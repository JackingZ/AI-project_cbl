<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流（只读投影，无新增） -->
    <PriceCardList
      title="供应商报价"
      :cards="cardList"
      :loading="cardLoading"
      :current-id="currentId"
      :total="total"
      :page="page"
      :size="size"
      :show-add="false"
      :can-copy="false"
      :can-view="can('get')"
      :can-delete="false"
      @row-click="onRow"
      @update:page="onPage"
    >
      <template #search>
        <el-form :model="searchForm" class="pl-search" size="small">
          <el-form-item>
            <el-select v-model="searchForm.priceType" filterable placeholder="报价类型" style="width: 100%" @change="onFamily">
              <el-option v-for="item in SUPPLIER_PRICE_TYPES" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.supplierId" clearable filterable placeholder="供应商" style="width: 100%" @focus="getSupplierOptions" @change="getTableData(1)">
              <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.auditStatus" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in auditOptions" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>

      <template #card="{ item }">
        <el-row>
          <el-col :span="1">
            <el-tooltip effect="dark" :content="lookup(auditOptions, auditVal(item))" placement="top">
              <i class="card-tips" :class="auditDot(item)" />
            </el-tooltip>
          </el-col>
          <el-col :span="19" class="word-limit">&nbsp;{{ cardName(item) }}</el-col>
          <el-col :span="4" style="text-align: right">{{ modeLabel(item) }}</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="4">{{ statusTag(item) }}</el-col>
          <el-col :span="16" style="line-height: 16px; text-align: center">{{ periodLabel(item) }}</el-col>
          <el-col :span="4" style="text-align: right">{{ familyName }}</el-col>
        </el-row>
      </template>
    </PriceCardList>

    <!-- 右侧：只读详情 + 审核 -->
    <div v-loading="formLoading" class="pl-main">
      <div v-show="isRightShow">
        <el-row>
          <el-col :span="19">
            <div class="pl-title">{{ cardName(detail) }}</div>
          </el-col>
          <el-col :span="5" style="text-align: right">
            <el-button v-if="canAudit && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
          </el-col>
        </el-row>

        <div class="item-read">
          <el-form-item label="报价类型：">{{ familyName }}</el-form-item>
          <el-form-item label="供应商："><span>{{ detail.fromCustName || (detail.fromCust || {}).value || '--' }}</span></el-form-item>
          <el-form-item label="业务类型："><span>{{ (detail.subtype || {}).value || '--' }}</span></el-form-item>
          <el-form-item label="有效时间："><span>{{ periodLabel(detail) }}</span></el-form-item>
          <el-form-item label="货币单位："><span v-if="detail.currencyId">{{ detail.currencyId }}</span><span v-if="detail.currencyName">{{ '-' + detail.currencyName }}</span></el-form-item>
        </div>

        <div v-if="detail.reasonText" class="reason-box">拒绝原因：{{ detail.reasonText }}</div>

        <!-- 仓储：收费项目 el-table -->
        <el-table v-if="family === 'warehouse'" :data="chargeRows" border size="small" max-height="440">
          <el-table-column label="收费项目" prop="name" width="140" show-overflow-tooltip />
          <el-table-column label="计费方式" width="100"><template #default="{ row }">{{ lookup(SETTLEMENT_LIST, row.type) }}</template></el-table-column>
          <el-table-column label="价格" prop="price" min-width="100" />
          <el-table-column label="最低收费" prop="minCharge" min-width="100" />
          <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
        </el-table>

        <!-- 专线/订舱/卡派/拖车/报关：二维矩阵（只读） -->
        <PriceMatrix
          v-else
          :left-title="matrixLeft"
          :right-title="matrixRight"
          :columns="aAxisData"
          :data="tableData"
          :editable="false"
          :edit-remark="false"
          :show-prescription="false"
        />
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗（按域族分派审核编码） -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="pass">
          <el-radio-group v-model="auditForm.pass"><el-radio :value="true">通过</el-radio><el-radio :value="false">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.pass === false" label="拒绝原因：" prop="reason">
          <el-input v-model="auditForm.reason" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import PriceMatrix from './components/PriceMatrix.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import {
  SUPPLIER_PRICE_TYPES, supplierAggApiMap, getSupplierList,
  AUDIT_STR_LIST, AUDIT_NUM_LIST, SETTLEMENT_LIST, lookup, buildAxis, buildNumAxis
} from '@/api/modules/price'

defineOptions({ name: 'PriceSupplier' })
const { can } = usePagePerms()

const searchForm = reactive({ priceType: '05', supplierId: undefined, auditStatus: undefined })
const supplierList = ref([])

// 当前族：str（专线/订舱）| warehouse（仓储）| num（卡派/拖车/报关）
const family = computed(() => (SUPPLIER_PRICE_TYPES.find(t => t.id === searchForm.priceType) || {}).family || 'str')
const familyName = computed(() => (SUPPLIER_PRICE_TYPES.find(t => t.id === searchForm.priceType) || {}).name || '')
const api = computed(() => supplierAggApiMap[searchForm.priceType])
const auditOptions = computed(() => (family.value === 'str' ? AUDIT_STR_LIST : AUDIT_NUM_LIST))

/* ------- 卡片字段抽象（各族字段名不同） ------- */
const auditVal = item => (family.value === 'str' ? item.audit : item.auditing)
const cardName = item => {
  if (!item) return ''
  if (family.value === 'str') return (item.lsc || {}).value || item.lscName
  if (family.value === 'warehouse') return item.warehouseName
  return (item.service || {}).value || item.kscName || item.serviceName
}
const modeLabel = item => {
  if (family.value === 'str') return item.mode === '1' ? '特殊报价' : '标准报价'
  return item.ifStandard ? '标准报价' : '特殊报价'
}
const periodLabel = item => {
  if (!item) return ''
  if (family.value === 'str') { const p = item.period || {}; return `${(p.effect || '').slice(0, 10)} ~ ${(p.expire || '').slice(0, 10)}` }
  return `${item.startTime || ''} ~ ${item.endTime || ''}`
}
const statusTag = item => {
  if (family.value === 'str') return item.status === '1' ? '生效中' : item.status === '0' ? '待生效' : '已失效'
  if (family.value === 'warehouse') return item.effective === 2 ? '生效中' : item.effective === 1 ? '待生效' : '已失效'
  return item.status === '1' ? '生效中' : item.status === '2' ? '待生效' : '已失效'
}
const auditDot = item => {
  const v = auditVal(item)
  if (family.value === 'str') return `card-tip-str-${v}`
  return v === 1 ? 'card-tip-blue' : v === 2 ? 'card-tip-y' : v === 3 ? 'card-tip-red' : 'card-tip-success'
}

/* ------- 列表 ------- */
const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const currentId = ref('')

const getSupplierOptions = async () => { const res = await getSupplierList(); supplierList.value = res.data }
const getTableData = async (p) => {
  if (p === 1) page.value = 1
  cardLoading.value = true
  try {
    const params = { supplierId: searchForm.supplierId, page: page.value, size: size.value }
    if (searchForm.auditStatus != null && searchForm.auditStatus !== '') {
      if (family.value === 'str') params.audit = searchForm.auditStatus; else params.auditing = searchForm.auditStatus
    }
    const res = await api.value.getList(params)
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const onFamily = () => { searchForm.auditStatus = undefined; resetForm(); getTableData(1) }

/* ------- 右侧只读详情 ------- */
const formLoading = ref(false)
const selectLoading = ref(false)
const isRightShow = ref(false)
const detail = reactive({})
const chargeRows = ref([])
const tableData = ref([])
const aAxisData = ref([])
const matrixLeft = ref('目的地')
const matrixRight = ref('')

const canAudit = computed(() => {
  if (family.value === 'str') return detail.audit !== '1'
  return detail.auditing !== 4
})

const resetForm = () => {
  Object.keys(detail).forEach(k => delete detail[k])
  chargeRows.value = []; tableData.value = []; aAxisData.value = []
  currentId.value = ''; isRightShow.value = false
}

const onRow = async (item) => {
  if (!can('get')) return
  resetForm(); isRightShow.value = true; formLoading.value = true
  try {
    const res = await api.value.getById(item.id)
    const d = res.data || {}
    currentId.value = d.id
    Object.assign(detail, d, { reasonText: rejectReason(d) })
    if (family.value === 'warehouse') {
      chargeRows.value = (d.priceList || []).map(r => ({ ...r }))
    } else if (family.value === 'str') {
      const rows = (d.rows || []).map(r => ({ ...r }))
      const axis = buildAxis(rows, d.loadType)
      matrixLeft.value = '目的地'; matrixRight.value = axis.rightTitle
      aAxisData.value = axis.columns; tableData.value = rows
    } else {
      const rows = (d.rows || []).map(r => ({ ...r }))
      matrixLeft.value = '目的地'; matrixRight.value = ''
      aAxisData.value = buildNumAxis(rows); tableData.value = rows
    }
  } finally { formLoading.value = false }
}
const rejectReason = d => (family.value === 'str' ? (d.audit === '2' ? d.remark : '') : ((d.auditing === 3 || d.audit === 3) ? d.reason : ''))

/* ------- 审核（按族分派） ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ pass: true, reason: undefined })
const auditRules = { pass: [required('请选择审核状态', 'change')], reason: [required('请输入拒绝原因')] }
const onShow = async () => {
  // 待审核 → 审核中（各族编码不同）
  if (family.value === 'str' && detail.audit === '0') { await api.value.audit({ id: currentId.value, audit: '3' }); detail.audit = '3'; getTableData() }
  else if (family.value === 'warehouse' && detail.auditing === 1) { await api.value.audit({ tag: 2, id: currentId.value, reason: '' }); detail.auditing = 2; getTableData() }
  else if (family.value === 'num' && detail.auditing === 1) { await api.value.audit({ id: currentId.value, status: 2 }); detail.auditing = 2; getTableData() }
  Object.assign(auditForm, { pass: true, reason: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { pass: undefined, reason: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.pass === false && !auditForm.reason) return ElMessage.error('请输入拒绝原因')
  selectLoading.value = true
  try {
    if (family.value === 'str') await api.value.audit({ id: currentId.value, audit: auditForm.pass ? '1' : '2', reason: auditForm.reason })
    else if (family.value === 'warehouse') await api.value.audit({ tag: auditForm.pass ? 4 : 3, id: currentId.value, reason: auditForm.reason })
    else await api.value.audit({ id: currentId.value, status: auditForm.pass ? 4 : 3, reason: auditForm.reason })
    ElMessage.success('审核成功'); onHide(); getTableData(); resetForm()
  } finally { selectLoading.value = false }
}

getSupplierOptions(); getTableData()
</script>

<style scoped lang="scss">
.pl-wrap { display: flex; flex-flow: row nowrap; min-height: inherit; }
.pl-main { flex: 1; overflow: auto; margin-left: 12px; background: $bg-card; border-radius: $card-radius; padding: 20px; }
.pl-search :deep(.el-form-item) { display: block; margin-bottom: 10px; }
.pl-title { font-size: 15px; font-weight: 600; color: $text-primary; }
.item-read { background: #eaeef4; padding: 5px 10px; margin: 10px 0; :deep(.el-form-item) { display: inline-block; margin-bottom: 0; } }
.reason-box { color: $danger-color; margin: 8px 0; }
.card-tips { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
.card-tip-str-0 { background: #2291e6; }
.card-tip-str-1 { background: #189800; }
.card-tip-str-2 { background: #e12e2e; }
.card-tip-str-3 { background: #ff7d19; }
.card-tip-blue { background: #2291e6; }
.card-tip-y { background: #ff7d19; }
.card-tip-red { background: #e12e2e; }
.card-tip-success { background: #189800; }
.word-limit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>