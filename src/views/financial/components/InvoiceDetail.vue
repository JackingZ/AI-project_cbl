<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>{{ isPay ? '应付款' : '应收款' }}</span>
        <span v-if="!isOnce" class="fin-detail-head__code">编号：{{ form.code }}</span>
        <el-tag v-if="!isOnce" size="small" :type="statusTag(form.status)">{{ lookup(INV_STATUS_LIST, form.status) }}</el-tag>
        <el-tag v-if="isView" size="small" :type="form.ifVerify === '1' ? 'success' : 'info'">{{ form.ifVerify === '1' ? '已核销' : '未核销' }}</el-tag>
      </div>
      <div>
        <el-button v-if="!isView" type="primary" :disabled="!form.exRate" @click="submit">{{ isOnce ? '提交' : '重新提交' }}</el-button>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isView" class="fin-form">
      <el-form-item :label="isPay ? '开票企业' : '客户'" prop="clientName">
        <el-input v-model="form.clientName" readonly placeholder="请选择">
          <template v-if="!isView" #append><el-button :icon="Search" @click="openCustomer" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="服务类型" prop="serviceTypeId">
        <el-select v-model="form.serviceTypeId" placeholder="请选择" style="width: 100%">
          <el-option v-for="s in SERVICE_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="原单号" prop="orderCode">
        <el-input v-model="form.orderCode" readonly placeholder="请选择">
          <template v-if="!isView" #append><el-button :icon="Search" @click="openOrder" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="发票日期" prop="invDate">
        <el-date-picker v-model="form.invDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择" style="width: 100%" />
      </el-form-item>
      <el-form-item label="发票类型" prop="invoiceType">
        <el-select v-model="form.invoiceType" placeholder="请选择" style="width: 100%">
          <el-option v-for="t in INVOICE_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="发票货币" prop="currencyId">
        <el-select v-model="form.currencyId" placeholder="请选择" style="width: 100%" @change="onCurrency">
          <el-option v-for="c in currencyOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="汇率" prop="exRate">
        <el-input-number v-model="form.exRate" :min="0" :precision="4" :controls="false" style="width: 100%" />
      </el-form-item>
      <template v-if="isView && ['02', '06'].includes(form.businessType)">
        <el-form-item v-if="['02','06'].includes(form.businessType)" label="SO号"><el-input v-model="form.soNoList" readonly /></el-form-item>
        <el-form-item v-if="form.businessType==='02'" label="提单号"><el-input v-model="form.billNoList" readonly /></el-form-item>
        <el-form-item v-if="form.businessType==='02'" label="航空单号"><el-input v-model="form.airNoList" readonly /></el-form-item>
        <el-form-item v-if="form.businessType==='02'" label="柜号"><el-input v-model="form.containerNoList" readonly /></el-form-item>
      </template>
      <el-form-item v-if="isView" label="审核时间"><el-input v-model="form.auditTime" readonly /></el-form-item>
      <el-form-item label="截止付款时间"><el-input v-model="form.cutoffTime" readonly /></el-form-item>
      <el-form-item v-if="isView" label="付款时间"><el-input v-model="form.payTime" readonly /></el-form-item>
      <el-form-item v-if="isView" label="逾期天数"><el-input :model-value="String(overdueDay(form.cutoffTime))" readonly /></el-form-item>
      <el-form-item label="备注" class="fin-form__full">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <!-- 明细行 -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <span class="fin-sub__title">账单明细</span>
        <el-button v-if="!isView" type="primary" size="small" @click="addItem">添加明细行</el-button>
      </div>
      <el-table :data="form.items" border size="small">
        <el-table-column type="index" label="行号" width="60" />
        <el-table-column label="项目" min-width="150">
          <template #default="{ row }">
            <el-input v-model="row.costitemName" readonly placeholder="请选择项目">
              <template v-if="!isView" #append><el-button :icon="Search" @click="openProject(row)" /></template>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="140">
          <template #default="{ row }"><el-input v-model="row.itemDesc" :disabled="isView" placeholder="说明" /></template>
        </el-table-column>
        <el-table-column label="数量" width="110">
          <template #default="{ row }"><el-input-number v-model="row.quantity" :min="0" :controls="false" :disabled="isView" style="width: 100%" @change="calcItem(row)" /></template>
        </el-table-column>
        <el-table-column label="单价" width="130">
          <template #default="{ row }"><el-input-number v-model="row.price" :min="0" :precision="4" :controls="false" :disabled="isView" style="width: 100%" @change="calcItem(row)" /></template>
        </el-table-column>
        <el-table-column label="金额" width="110">
          <template #default="{ row }">{{ row.amount }}</template>
        </el-table-column>
        <el-table-column label="账单本币金额" width="120">
          <template #default="{ row }">{{ row.selfAmount }}</template>
        </el-table-column>
        <!-- 客户确认列 源页注释，保持注释 -->
        <!-- <el-table-column label="客户确认" width="90"><template #default="{ row }">{{ row.confirm === 1 ? '已确认' : '未确认' }}</template></el-table-column> -->
        <el-table-column v-if="!isView" label="操作" width="80" fixed="right">
          <template #default="{ $index }"><el-button link type="danger" size="small" @click="delItem($index)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 选择客户/开票企业 -->
    <Modal v-model="custDlg.visible" :title="isPay ? '选择开票企业' : '选择客户'" width="760px" @confirm="confirmCustomer">
      <SearchBar :model="custDlg.query" @search="loadCustomers" @reset="resetCustomers">
        <el-form-item label="名称"><el-input v-model="custDlg.query.name" placeholder="请输入名称" clearable style="width: 180px" /></el-form-item>
      </SearchBar>
      <el-table :data="custDlg.list" border height="360" highlight-current-row @current-change="r => custDlg.picked = r">
        <el-table-column width="50">
          <template #default="{ row }"><el-radio :model-value="custDlg.picked?.id" :value="row.id" @change="custDlg.picked = row"><span></span></el-radio></template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="属性" width="120"><template #default="{ row }">{{ propertyText(row) }}</template></el-table-column>
        <el-table-column prop="parentName" label="所属上级" min-width="140"><template #default="{ row }">{{ row.parentName || '--' }}</template></el-table-column>
      </el-table>
    </Modal>

    <!-- 选择原单号 -->
    <Modal v-model="orderDlg.visible" title="选择原单号" width="900px" @confirm="confirmOrder">
      <el-table :data="orderDlg.list" border height="380" highlight-current-row @current-change="r => orderDlg.picked = r">
        <el-table-column width="50">
          <template #default="{ row }"><el-radio :model-value="orderDlg.picked?.id" :value="row.id" @change="orderDlg.picked = row"><span></span></el-radio></template>
        </el-table-column>
        <el-table-column prop="orderCode" label="原单号" min-width="130" />
        <el-table-column prop="clientName" label="客户名称" min-width="130" />
        <el-table-column prop="invDate" label="开票日期" width="160" />
        <el-table-column label="货币" width="90"><template #default="{ row }">{{ row.currencyName }}</template></el-table-column>
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="orderDlg.total" :current-page="orderDlg.page" :page-size="10" @current-change="p => { orderDlg.page = p; loadOrders() }" />
        <div style="margin-top: 8px">
          <el-button @click="orderDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmOrder">确定</el-button>
        </div>
      </template>
    </Modal>

    <!-- 选择项目 -->
    <Modal v-model="projDlg.visible" title="选择项目" width="640px" @confirm="confirmProject">
      <el-table :data="projDlg.list" border height="360" highlight-current-row @current-change="r => projDlg.picked = r">
        <el-table-column width="50">
          <template #default="{ row }"><el-radio :model-value="projDlg.picked?.id" :value="row.id" @change="projDlg.picked = row"><span></span></el-radio></template>
        </el-table-column>
        <el-table-column prop="name" label="项目名称" min-width="160" />
        <el-table-column prop="code" label="编码" width="120" />
      </el-table>
    </Modal>
  </PageCard>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import { required } from '@/utils/validate'
import {
  invoiceApi, INV_STATUS_LIST, INVOICE_TYPE_LIST, SERVICE_LIST,
  getCurrencyOptions, getExRateValue, getSelectableOrders,
  lookup, clientProperty, countNum, overdueDay
} from '@/api/modules/financial'
import { getCustomerList, getSupplierList } from '@/api/modules/organizers'

const props = defineProps({
  isPay: { type: Boolean, default: false },
  mode: { type: String, default: 'add' },   // add | edit | view
  rowId: { type: [Number, String], default: null }
})
const emit = defineEmits(['back', 'saved'])

const isOnce = props.mode === 'add'
const isView = props.mode === 'view'
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')

const formRef = ref(null)
const currencyOptions = ref([])
const defaultForm = () => ({
  id: null, code: '', clientName: '', clientId: null, serviceTypeId: '', orderCode: '',
  invDate: '', invoiceType: '1', currencyId: '', currencyName: '', exRate: props.isPay ? undefined : 1,
  status: '0', ifVerify: '0', businessType: '', soNoList: '', billNoList: '', airNoList: '', containerNoList: '',
  auditTime: '', cutoffTime: '', payTime: '', remark: '', items: [], type: props.isPay ? 'P' : 'R'
})
const form = reactive(defaultForm())
const rules = {
  clientName: [required('请选择')],
  serviceTypeId: [required('请选择服务类型', 'change')],
  orderCode: [required('请选择原单号')],
  invDate: [required('请选择发票日期', 'change')],
  invoiceType: [required('请选择发票类型', 'change')],
  currencyId: [required('请选择货币', 'change')],
  exRate: [required('请输入汇率', 'change')]
}

onMounted(async () => {
  currencyOptions.value = (await getCurrencyOptions()).data
  if (!isOnce && props.rowId != null) {
    const res = await invoiceApi.get(props.rowId)
    if (res.data) Object.assign(form, JSON.parse(JSON.stringify(res.data)))
  }
})

const onCurrency = async v => { form.exRate = (await getExRateValue(v)).data; form.currencyName = (currencyOptions.value.find(c => c.id === v) || {}).name || '' }
const calcItem = row => { row.amount = Number(((row.quantity || 0) * (row.price || 0)).toFixed(2)); row.selfAmount = countNum(row.amount, form.exRate) }
const addItem = () => form.items.push({ id: Date.now(), costitemId: null, costitemName: '', itemDesc: '', quantity: 0, price: 0, amount: 0, selfAmount: 0, confirm: 0 })
const delItem = idx => form.items.splice(idx, 1)

/* 选择客户/开票企业 */
const custDlg = reactive({ visible: false, query: { name: '' }, list: [], picked: null })
const propertyText = row => props.isPay ? '供应商' : clientProperty(row.custTypeCode ?? (row.subtype === '同行' ? '1' : '1'), row.subtype === '同行' ? '1' : '0')
const loadCustomers = async () => {
  const fn = props.isPay ? getSupplierList : getCustomerList
  custDlg.list = (await fn({ name: custDlg.query.name, page: 1, size: 50 })).data.list
}
const resetCustomers = () => { custDlg.query.name = ''; loadCustomers() }
const openCustomer = () => { custDlg.visible = true; custDlg.picked = null; loadCustomers() }
const confirmCustomer = () => {
  if (!custDlg.picked) return ElMessage.warning('请选择一条记录')
  form.clientName = custDlg.picked.name; form.clientId = custDlg.picked.id
  custDlg.visible = false
}

/* 选择原单号 */
const orderDlg = reactive({ visible: false, list: [], picked: null, page: 1, total: 0 })
const loadOrders = async () => {
  const res = await getSelectableOrders({ page: orderDlg.page, size: 10 })
  orderDlg.list = res.data.list; orderDlg.total = res.data.total
}
const openOrder = () => { orderDlg.visible = true; orderDlg.picked = null; orderDlg.page = 1; loadOrders() }
const confirmOrder = () => {
  if (!orderDlg.picked) return ElMessage.warning('请选择一条记录')
  const o = orderDlg.picked
  form.orderCode = o.orderCode; form.businessType = o.businessType
  form.soNoList = o.soNoList; form.billNoList = o.billNoList; form.airNoList = o.airNoList; form.containerNoList = o.containerNoList
  orderDlg.visible = false
}

/* 选择项目 */
const projDlg = reactive({ visible: false, list: [], picked: null, targetRow: null })
const openProject = async row => {
  projDlg.visible = true; projDlg.picked = null; projDlg.targetRow = row
  const { getProjectList } = await import('@/api/modules/operatingCost')
  projDlg.list = (await getProjectList({ page: 1, size: 50 })).data.list
}
const confirmProject = () => {
  if (!projDlg.picked) return ElMessage.warning('请选择一条记录')
  projDlg.targetRow.costitemId = projDlg.picked.id
  projDlg.targetRow.costitemName = projDlg.picked.name
  projDlg.visible = false
}

const submit = async () => {
  await formRef.value.validate()
  const amount = Number(form.items.reduce((s, it) => s + (it.amount || 0), 0).toFixed(2))
  const payload = { ...JSON.parse(JSON.stringify(form)), amount, selfAmount: countNum(amount, form.exRate) }
  if (isOnce) await invoiceApi.add(payload)
  else await invoiceApi.update(form.id, payload)
  ElMessage.success('提交成功')
  emit('saved')
}
</script>

<style scoped lang="scss">
.fin-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  &__title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500; color: $text-primary; }
  &__code { font-size: 13px; color: $text-secondary; font-weight: 400; }
}
.fin-form { display: flex; flex-wrap: wrap; :deep(.el-form-item) { width: 50%; } &__full { width: 100% !important; } }
.fin-sub { margin-top: 12px; &__bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  &__title { font-size: 14px; font-weight: 500; color: $text-primary; } }
</style>
