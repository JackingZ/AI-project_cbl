<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="名称">
        <el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="信用等级">
        <el-select v-model="query.creditRating" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="r in CREDIT_RATING_LIST" :key="r.code" :label="`${r.code} ${r.name}`" :value="r.code" />
        </el-select>
      </el-form-item>
      <!-- 源页无“新增”按钮，工具栏保持精简 -->
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="360" @change="loadData">
        <template #col-property="{ row }">{{ clientProperty(row.type, row.subtype) }}</template>
        <template #col-creditRating="{ row }">
          <el-tag size="small" :type="ratingTag(row.creditRating)">{{ ratingText(row.creditRating) }}</el-tag>
        </template>
        <template #col-signContract="{ row }">
          <el-tag size="small" :type="row.signContract === '1' ? 'success' : 'info'">{{ row.signContract === '1' ? '已签约' : '未签约' }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openTemplate(row)">设置模板</el-button>
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openFactors(row)">查看要素</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openInvoicePay(row)">发票付款</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openPayType(row)">付款方式</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openFlags(row)">设置标识</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEditCredit(row)">编辑信用</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openApplyAdjust(row)">申请调额</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 1. 设置模板（设置账期模板） -->
    <Modal v-model="dlg.template" title="设置账期模板" width="480px" :confirm-loading="saving" @confirm="confirmTemplate">
      <el-form label-width="110px">
        <el-form-item label="账期模板选择">
          <el-select v-model="templateForm.templateId" placeholder="请选择账期模板" style="width: 100%">
            <el-option v-for="t in TEMPLATE_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="templateForm.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 2. 查看要素（只读） -->
    <Modal v-model="dlg.factors" title="查看要素" width="720px">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="成立日期">{{ current?.setupDate || '--' }}</el-descriptions-item>
        <el-descriptions-item label="公司规模">{{ current?.companySize || '--' }}</el-descriptions-item>
        <el-descriptions-item label="注册资本">{{ current?.registeredCapital || '--' }}</el-descriptions-item>
        <el-descriptions-item label="经营类型">{{ current?.saleType === '1' ? '自营' : current?.saleType === '2' ? '代运营' : '--' }}</el-descriptions-item>
        <el-descriptions-item label="平台">{{ current?.platform || '--' }}</el-descriptions-item>
        <el-descriptions-item label="主营国家">{{ current?.mainState || '--' }}</el-descriptions-item>
        <el-descriptions-item label="店铺链接" :span="2">{{ current?.storeLink || '--' }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ current?.brand || '--' }}</el-descriptions-item>
        <el-descriptions-item label="商标">{{ current?.trademark || '--' }}</el-descriptions-item>
        <el-descriptions-item label="合作起始">{{ current?.cooperate || '--' }}</el-descriptions-item>
        <el-descriptions-item label="合作金额">{{ current?.cooperationAmount ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="付款情况">{{ current?.payment || '--' }}</el-descriptions-item>
        <el-descriptions-item label="最近付款">{{ current?.lastPayment || '--' }}</el-descriptions-item>
        <el-descriptions-item label="逾期次数">{{ current?.overdueTimes ?? '--' }}</el-descriptions-item>
        <el-descriptions-item label="逾期金额">{{ current?.overdueAmount ?? '--' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dlg.factors = false">关闭</el-button>
      </template>
    </Modal>

    <!-- 3. 发票付款（浏览） -->
    <Modal v-model="dlg.invoice" title="发票付款" width="860px">
      <el-table :data="invDlg.list" v-loading="invDlg.loading" border size="small" height="420">
        <el-table-column prop="code" label="发票编号" min-width="130" />
        <el-table-column prop="orderCode" label="原单号" min-width="120" />
        <el-table-column prop="invDate" label="发票日期" width="170" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="120" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ lookup(INV_STATUS_LIST, row.status) }}</el-tag></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-pagination
          layout="prev, pager, next" :total="invDlg.total" :current-page="invDlg.page" :page-size="invDlg.size"
          @current-change="p => { invDlg.page = p; loadInvoices() }"
        />
        <div style="margin-top: 8px">
          <el-button @click="dlg.invoice = false">关闭</el-button>
        </div>
      </template>
    </Modal>

    <!-- 4. 付款方式 -->
    <Modal v-model="dlg.paytype" title="付款方式" width="640px" :confirm-loading="saving" @confirm="confirmPayType">
      <div class="fin-sub">
        <div class="fin-sub__bar">
          <span class="fin-sub__title">付款方式列表</span>
          <el-button type="primary" size="small" @click="addPaytypeRow">添加</el-button>
        </div>
        <el-table :data="paytypeRows" border size="small">
          <el-table-column type="index" label="行号" width="60" />
          <el-table-column label="付款方式" min-width="150">
            <template #default="{ row }">
              <el-select v-model="row.source" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in SOURCE_LIST" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="账期天数" width="150">
            <template #default="{ row }"><el-input-number v-model="row.days" :min="0" :controls="false" style="width: 100%" /></template>
          </el-table-column>
          <el-table-column label="额度" width="150">
            <template #default="{ row }"><el-input-number v-model="row.amount" :min="0" :precision="2" :controls="false" style="width: 100%" /></template>
          </el-table-column>
          <el-table-column label="操作" width="70" fixed="right">
            <template #default="{ $index }"><el-button link type="danger" size="small" @click="paytypeRows.splice($index, 1)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </Modal>

    <!-- 5. 设置标识 -->
    <Modal v-model="dlg.flags" title="设置标识" width="560px" :confirm-loading="saving" @confirm="confirmFlags">
      <div class="credit-flags">
        <div v-for="f in FLAG_FIELDS" :key="f.key" class="credit-flags__item">
          <span class="credit-flags__label">{{ f.label }}</span>
          <el-switch :model-value="normalizeSwitchValue(flagsForm[f.key])" active-value="1" inactive-value="0" @update:model-value="flagsForm[f.key] = $event" />
        </div>
      </div>
    </Modal>

    <!-- 6. 编辑信用 -->
    <Modal v-model="dlg.credit" title="编辑信用" width="560px" :confirm-loading="saving" @confirm="confirmEditCredit">
      <el-form ref="creditFormRef" :model="creditForm" :rules="creditRules" label-width="90px">
        <el-form-item label="初始额度" prop="initialAmount">
          <el-input-number v-model="creditForm.initialAmount" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="可用信用" prop="credits">
          <el-input-number v-model="creditForm.credits" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="信用等级" prop="creditRating">
          <el-select v-model="creditForm.creditRating" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in ratingOptions" :key="r.code" :label="`${r.code} ${r.name}`" :value="r.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否签约" prop="signContract">
          <el-radio-group v-model="creditForm.signContract">
            <el-radio value="1">已签约</el-radio>
            <el-radio value="0">未签约</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提货方式" prop="takeMethod">
          <el-select v-model="creditForm.takeMethod" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="t in TAKE_METHOD_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input v-model="creditForm.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 7. 申请调额 -->
    <Modal v-model="dlg.adjust" title="申请调额" width="520px" :confirm-loading="saving" @confirm="confirmApplyAdjust">
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="90px">
        <el-form-item label="当前额度">
          <el-input :model-value="String(current?.credits ?? '')" readonly />
        </el-form-item>
        <el-form-item label="申请额度" prop="applyAmount">
          <el-input-number v-model="adjustForm.applyAmount" :min="0" :precision="2" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { required } from '@/utils/validate'
import {
  creditApi, CREDIT_RATING_LIST, SOURCE_LIST, TAKE_METHOD_LIST, INV_STATUS_LIST,
  clientProperty, lookup, getCreditRatingList, getCreditInvoiceList
} from '@/api/modules/financial'

defineOptions({ name: 'FinCredit' })
const { can } = usePagePerms()

/* 账期模板预设（stub） */
const TEMPLATE_LIST = [
  { id: '1', name: '月结30' }, { id: '2', name: '月结60' },
  { id: '3', name: '预付' }, { id: '4', name: '货到付款' }
]
/* 标识字段（'0'/'1' 字符串开关） */
const FLAG_FIELDS = [
  { key: 'locked', label: '锁定' }, { key: 'advance', label: '预付' },
  { key: 'collectionDelivery', label: '到付' }, { key: 'generateExpress', label: '生成快递单' },
  { key: 'printExpress', label: '打印快递单' }, { key: 'platformRecord', label: '平台备案' },
  { key: 'recordingRole', label: '录单角色' }, { key: 'maitou', label: '卖头' }
]

const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')
const ratingTag = code => ({ A: 'success', B: '', C: 'warning', D: 'danger' }[code] || 'info')
const ratingText = code => {
  const r = CREDIT_RATING_LIST.find(x => x.code === code)
  return r ? `${r.code} ${r.name}` : (code || '--')
}

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(creditApi.list, { name: '', creditRating: '' })
const columns = [
  { prop: 'name', label: '名称', minWidth: 160 },
  { prop: 'property', label: '属性', width: 100 },
  { prop: 'estimatedCost', label: '预估成本', width: 110 },
  { prop: 'debts', label: '欠款', width: 100 },
  { prop: 'initialAmount', label: '初始额度', width: 110 },
  { prop: 'credits', label: '可用信用', width: 110 },
  { prop: 'creditRating', label: '信用等级', width: 110, align: 'center' },
  { prop: 'signContract', label: '是否签约', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 160 }
]

/* 当前操作行 + 各弹窗可见状态 */
const current = ref(null)
const dlg = reactive({ template: false, factors: false, invoice: false, paytype: false, flags: false, credit: false, adjust: false })
const saving = ref(false)

/* 编辑信用用信用等级列表 */
const ratingOptions = ref([])
onMounted(async () => { ratingOptions.value = (await getCreditRatingList()).data })

/* 1. 设置模板 */
const templateForm = reactive({ templateId: '', notes: '' })
const openTemplate = row => {
  current.value = row
  templateForm.templateId = row.templateId || ''
  templateForm.notes = row.notes || ''
  dlg.template = true
}
const confirmTemplate = async () => {
  saving.value = true
  try {
    await creditApi.res.update(current.value.id, { templateId: templateForm.templateId, notes: templateForm.notes })
    ElMessage.success('设置成功')
    dlg.template = false
    loadData()
  } finally { saving.value = false }
}

/* 2. 查看要素 */
const openFactors = row => { current.value = row; dlg.factors = true }

/* 3. 发票付款 */
const invDlg = reactive({ list: [], total: 0, page: 1, size: 10, loading: false })
const loadInvoices = async () => {
  invDlg.loading = true
  try {
    const res = await getCreditInvoiceList({ page: invDlg.page, size: invDlg.size })
    invDlg.list = res.data.list
    invDlg.total = res.data.total
  } finally { invDlg.loading = false }
}
const openInvoicePay = row => { current.value = row; invDlg.page = 1; dlg.invoice = true; loadInvoices() }

/* 4. 付款方式 */
const paytypeRows = ref([])
const openPayType = row => {
  current.value = row
  paytypeRows.value = JSON.parse(JSON.stringify(row.paytypeList || []))
  dlg.paytype = true
}
const addPaytypeRow = () => paytypeRows.value.push({ source: '', days: 0, amount: 0 })
const confirmPayType = async () => {
  saving.value = true
  try {
    await creditApi.res.update(current.value.id, { paytypeList: JSON.parse(JSON.stringify(paytypeRows.value)) })
    ElMessage.success('保存成功')
    dlg.paytype = false
    loadData()
  } finally { saving.value = false }
}

/* 5. 设置标识 */
const flagsForm = reactive({
  locked: '0', advance: '0', collectionDelivery: '0', generateExpress: '0',
  printExpress: '0', platformRecord: '0', recordingRole: '0', maitou: '0'
})
const openFlags = row => {
  current.value = row
  FLAG_FIELDS.forEach(f => { flagsForm[f.key] = row[f.key] === '1' ? '1' : '0' })
  dlg.flags = true
}
const confirmFlags = async () => {
  saving.value = true
  try {
    await creditApi.res.update(current.value.id, { ...flagsForm })
    ElMessage.success('设置成功')
    dlg.flags = false
    loadData()
  } finally { saving.value = false }
}

/* 6. 编辑信用 */
const creditFormRef = ref(null)
const creditForm = reactive({ initialAmount: 0, credits: 0, creditRating: '', signContract: '0', takeMethod: '', notes: '' })
const creditRules = {
  initialAmount: [required('请输入初始额度', 'change')],
  creditRating: [required('请选择信用等级', 'change')]
}
const openEditCredit = row => {
  current.value = row
  Object.assign(creditForm, {
    initialAmount: row.initialAmount ?? 0, credits: row.credits ?? 0,
    creditRating: row.creditRating || '', signContract: row.signContract || '0',
    takeMethod: row.takeMethod || '', notes: row.notes || ''
  })
  dlg.credit = true
  creditFormRef.value?.clearValidate()
}
const confirmEditCredit = async () => {
  await creditFormRef.value.validate()
  saving.value = true
  try {
    await creditApi.res.update(current.value.id, { ...creditForm })
    ElMessage.success('修改成功')
    dlg.credit = false
    loadData()
  } finally { saving.value = false }
}

/* 7. 申请调额 */
const adjustFormRef = ref(null)
const adjustForm = reactive({ applyAmount: 0, reason: '' })
const adjustRules = {
  applyAmount: [required('请输入申请额度', 'change')],
  reason: [required('请输入调整原因')]
}
const openApplyAdjust = row => {
  current.value = row
  adjustForm.applyAmount = row.credits ?? 0
  adjustForm.reason = ''
  dlg.adjust = true
  adjustFormRef.value?.clearValidate()
}
const confirmApplyAdjust = async () => {
  await adjustFormRef.value.validate()
  saving.value = true
  try {
    await creditApi.res.update(current.value.id, { audit: '3' })
    ElMessage.success('申请已提交')
    dlg.adjust = false
    loadData()
  } finally { saving.value = false }
}
</script>

<style scoped lang="scss">
.fin-sub {
  &__bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  &__title { font-size: 14px; font-weight: 500; color: $text-primary; }
}
.credit-flags {
  display: flex;
  flex-wrap: wrap;
  &__item {
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px 10px 0;
  }
  &__label { font-size: $font-sm; color: $text-secondary; }
}
</style>
