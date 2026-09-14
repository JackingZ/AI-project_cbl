<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流 -->
    <PriceCardList
      title="外协报价"
      :cards="cardList"
      :loading="cardLoading"
      :current-id="currentId"
      :total="total"
      :page="page"
      :size="size"
      :show-add="can('add')"
      :can-copy="can('copy')"
      :can-view="can('get')"
      :can-delete="can('del')"
      :menu-deletable="row => row.audit === 1 || row.audit === 3"
      @add="addPrice"
      @row-click="onRow"
      @menu="onMenu"
      @update:page="onPage"
    >
      <template #search>
        <el-form :model="searchForm" class="pl-search" size="small">
          <el-form-item>
            <el-select v-model="searchForm.subtypeId" clearable filterable placeholder="业务类型" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in SUBTYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.supplierId" clearable filterable placeholder="供应商" style="width: 100%" @focus="getSupplierOptions" @change="getTableData(1)">
              <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.audit" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in AUDITING_STATUS_LIST" :key="item.id" :label="item.name" :value="Number(item.id)" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-popover v-model:visible="popoverShow" placement="bottom-start" trigger="click" width="380">
              <div class="pl-filter">
                <el-form-item label="服务" label-width="90px">
                  <el-select v-model="searchForm.lscId" clearable filterable placeholder="请选择" style="width: 250px" @focus="getServiceOptions">
                    <el-option v-for="item in serviceList" :key="item.id" :label="item.label" :value="item.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="目的港关税" label-width="90px">
                  <el-radio-group v-model="searchForm.includeTax">
                    <el-radio-button :value="undefined">全部</el-radio-button>
                    <el-radio-button :value="true">包税</el-radio-button>
                    <el-radio-button :value="false">不包税</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="派送方式" label-width="90px">
                  <el-radio-group v-model="searchForm.dispatch">
                    <el-radio-button :value="undefined">全部</el-radio-button>
                    <el-radio-button value="0">卡派</el-radio-button>
                    <el-radio-button value="1">快递</el-radio-button>
                    <el-radio-button value="2">自提</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="目的地类型" label-width="90px">
                  <el-radio-group v-model="searchForm.purposeType">
                    <el-radio-button :value="undefined">全部</el-radio-button>
                    <el-radio-button v-for="item in PURPOSE_TYPE_LIST" :key="item.id" :value="item.id">{{ item.name }}</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <div style="text-align: right">
                  <el-button @click="handleClear">清空</el-button>
                  <el-button v-if="can('query')" type="primary" @click="handleConfirm">筛选</el-button>
                </div>
              </div>
              <template #reference><el-input placeholder="全部筛选" readonly :suffix-icon="ArrowDown" /></template>
            </el-popover>
          </el-form-item>
        </el-form>
      </template>

      <template #card="{ item }">
        <el-row>
          <el-col :span="1">
            <el-tooltip effect="dark" :content="lookup(AUDITING_STATUS_LIST, String(item.audit))" placement="top">
              <i class="card-tips" :class="auditDot(item.audit)" />
            </el-tooltip>
          </el-col>
          <el-col :span="19" class="word-limit">&nbsp;{{ item.lscName }}</el-col>
          <el-col :span="4" style="text-align: right">{{ item.includeTax ? '包税' : '不包税' }}</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="5">供应商</el-col>
          <el-col :span="19" class="word-limit" style="color: #409eff">{{ item.fromCustName }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="5">
            <span v-if="item.status === 2" class="btn-tip-green">生效中</span>
            <span v-else-if="item.status === 1" class="btn-tip-blue">待生效</span>
            <span v-else class="btn-tip-grey">已失效</span>
          </el-col>
          <el-col :span="19" style="line-height: 16px">{{ (item.startTime || '').slice(0, 10) }} ~ {{ (item.endTime || '').slice(0, 10) }}</el-col>
          <el-col :span="24" style="text-align: right; margin-top: 4px">
            <span class="border-tip-blue">{{ (item.subtype || {}).value }}</span>&nbsp;
            <span class="border-tip-blue">{{ lookup(DISPATCH_LIST, item.dispatch) }}</span>
          </el-col>
        </el-row>
      </template>
    </PriceCardList>

    <!-- 右侧：详情/编辑 + 矩阵 -->
    <div v-loading="formLoading" class="pl-main">
      <div v-show="isRightShow">
        <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="90px" size="small" class="pl-form">
          <el-row>
            <el-col :span="19">
              <el-form-item label="业务类型" prop="subtypeId">
                <el-select v-model="selectForm.subtypeId" :disabled="isView" style="width: 100px" clearable filterable placeholder="请选择" @change="onSubtype">
                  <el-option v-for="item in SUBTYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="供应商" prop="fromCustId" label-width="70px">
                <el-select v-model="selectForm.fromCustId" :disabled="isView" style="width: 160px" clearable filterable placeholder="请选择供应商" @focus="getSupplierSel" @change="onSupplier">
                  <el-option v-for="item in supplierSelList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item prop="lscId" label="服务" label-width="60px">
                <el-select v-model="selectForm.lscId" :disabled="isView || !selectForm.fromCustId" style="width: 200px" clearable filterable placeholder="请选择服务" @change="onServiceSel">
                  <el-option v-for="item in serviceSelList" :key="item.id" :label="item.label" :value="item.id" />
                </el-select>
              </el-form-item>
              <!-- 所属公司：仅 custType 0（聚货通）显示 -->
              <el-form-item v-if="custType === '0'" label="所属公司" prop="agentId" label-width="80px">
                <el-select v-model="selectForm.agentId" :disabled="isView" style="width: 160px" clearable filterable placeholder="请选择" @focus="getAgentOptions">
                  <el-option v-for="item in agentList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5" style="text-align: right">
              <template v-if="!isHistory && selectForm.status !== 9">
                <el-button v-if="isView && (selectForm.audit === 1 || selectForm.audit === 3) && can('edit')" type="primary" link size="small" @click="editRow">编辑</el-button>
                <el-button v-if="isView && selectForm.audit !== 4 && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
                <el-button v-if="!isView && can('edit')" type="primary" link size="small" @click="cancelRow">取消</el-button>
                <el-button v-if="!isView && can('edit')" type="primary" link size="small" @click="saveRow">保存</el-button>
                <el-button v-if="isView && (selectForm.audit === 1 || selectForm.audit === 3) && can('del')" type="danger" link size="small" @click="deleteRow(1)">删除</el-button>
              </template>
              <template v-if="isView">
                <el-button v-if="can('copy')" type="primary" link size="small" @click="copyPrice">复制此版本</el-button>
                <el-button v-if="selectForm.audit === 4 && !historyId" type="primary" link size="small" @click="invalidPrice">失效</el-button>
              </template>
            </el-col>
          </el-row>

          <div class="item-read">
            <el-form-item label="计费方式："><div>{{ lookup(PRICE_TYPE_LIST, Number(selectForm.priceType)) }}</div></el-form-item>
            <!-- <el-form-item label="目的港：">{{ selectForm.destinationPort }}</el-form-item> -->
            <el-form-item label="重量单位："><div style="width: 50px">{{ selectForm.umWeight }}</div></el-form-item>
            <el-form-item label="体积单位："><div style="width: 50px">{{ selectForm.umVolume }}</div></el-form-item>
            <el-form-item label="货币单位："><span v-if="selectForm.currencyId">{{ selectForm.currencyId }}</span><span v-if="selectForm.currencyName">{{ '-' + selectForm.currencyName }}</span></el-form-item>
          </div>

          <el-row>
            <el-col :span="21">
              <!-- 计费配置：priceType '4'（整柜）时隐藏 -->
              <el-form-item v-if="selectForm.priceType !== '4'" label="计费配置" prop="measureId">
                <el-select v-model="selectForm.measureId" :disabled="isView || !selectForm.lscId" style="width: 160px" clearable filterable placeholder="请选择" @focus="getChargeOptions">
                  <el-option v-for="item in chargeList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="交货区域" prop="deliveries" label-width="105px">
                <el-select v-model="selectForm.deliveries" :disabled="isView" style="width: 200px" clearable filterable multiple collapse-tags placeholder="请选择" @focus="getDeliveryOptions">
                  <el-option v-for="item in deliveryList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="有效时间" prop="times">
                <el-date-picker v-model="selectForm.times" :disabled="isView" type="datetimerange" size="small" value-format="YYYY-MM-DD HH:mm:ss" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 310px" />
              </el-form-item>
            </el-col>
            <el-col :span="3" style="text-align: right">
              <el-select v-if="isView" v-model="historyId" clearable filterable placeholder="历史版本" style="width: 100%" size="small" @change="onHistory">
                <el-option v-for="item in historyList" :key="item.id" :label="`${item.startTime} ~ ${item.endTime}`" :value="item.id" />
              </el-select>
            </el-col>
          </el-row>

          <el-row v-if="!isView">
            <el-form-item label="设置区间" class="is-required">
              <el-button type="primary" size="small" plain @click="onSection">{{ selectForm.priceType === '4' ? '柜型' : '计费区间' }}</el-button>
            </el-form-item>
            <el-form-item label="目的地/区域" class="is-required" label-width="105px">
              <el-button type="primary" size="small" plain @click="onAddress">目的地/区域</el-button>
            </el-form-item>
          </el-row>

          <div v-if="isView && selectForm.audit === 3">
            <el-form-item label="拒绝原因：" label-width="90px" style="width: 100%">{{ selectForm.reason }}</el-form-item>
          </div>
        </el-form>

        <PriceMatrix
          left-title="目的地"
          :right-title="lookup(PRICE_TYPE_LIST, Number(selectForm.priceType))"
          :columns="aAxisData"
          :data="tableData"
          :editable="!isView"
          :edit-remark="!isView"
          :show-prescription="false"
        />
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗（audit 4通过/3拒绝） -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="audit">
          <el-radio-group v-model="auditForm.audit"><el-radio :value="4">通过</el-radio><el-radio :value="3">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.audit === 3" label="拒绝原因：" prop="reason">
          <el-input v-model="auditForm.reason" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>

    <!-- 计费区间/目的地配置 -->
    <RangeConfigDialog
      ref="rangeRef"
      v-model="dialogRange"
      :mode="sectionMode"
      :title="sectionTitle"
      :loading="selectLoading"
      @save="saveRange"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import PriceMatrix from './components/PriceMatrix.vue'
import RangeConfigDialog from './components/RangeConfigDialog.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import {
  outsourcApi, SUBTYPE_LIST, AUDITING_STATUS_LIST, DISPATCH_LIST, PURPOSE_TYPE_LIST, PRICE_TYPE_LIST,
  buildNumAxis, lookup,
  getOutsourcSupplierOptions, getOutsourcAgentOptions, getDeliveryAreaOptions, getOutsourcServiceOptions, getOutsourcChargeOptions
} from '@/api/modules/price'

defineOptions({ name: 'PriceOutsourc' })
const { can } = usePagePerms()

// 当前登录客户类型（mock：聚货通 '0'，显示“所属公司”）
const custType = '0'

const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const popoverShow = ref(false)
const searchForm = reactive({ subtypeId: undefined, supplierId: undefined, audit: undefined, lscId: undefined, includeTax: undefined, dispatch: undefined, purposeType: undefined })
const supplierList = ref([])
const serviceList = ref([])

const auditDot = a => (a === 1 ? 'card-tip-blue' : a === 2 ? 'card-tip-y' : a === 3 ? 'card-tip-red' : 'card-tip-success')

const getTableData = async (p) => {
  if (p === 1) { page.value = 1; popoverShow.value = false }
  cardLoading.value = true
  try {
    const res = await outsourcApi.getList({
      subtypeId: searchForm.subtypeId, supplierId: searchForm.supplierId, audit: searchForm.audit,
      lscId: searchForm.lscId, includeTax: searchForm.includeTax, dispatch: searchForm.dispatch, purposeType: searchForm.purposeType,
      page: page.value, size: size.value
    })
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const handleClear = () => { Object.assign(searchForm, { lscId: undefined, includeTax: undefined, dispatch: undefined, purposeType: undefined }) }
const handleConfirm = () => { popoverShow.value = false; getTableData(1) }

const getSupplierOptions = async () => { const res = await getOutsourcSupplierOptions(); supplierList.value = res.data }
const getServiceOptions = async () => { const res = await getOutsourcServiceOptions(); serviceList.value = res.data.result || [] }

/* ------- 右侧 ------- */
const editForm = ref(null)
const formLoading = ref(false)
const selectLoading = ref(false)
const isRightShow = ref(false)
const isView = ref(false)
const isHistory = ref(false)
const currentId = ref('')
const historyId = ref('')
const historyList = ref([])
const aAxisData = ref([])
const tableData = ref([])
const supplierSelList = ref([])
const serviceSelList = ref([])
const agentList = ref([])
const deliveryList = ref([])
const chargeList = ref([])

const defaultSelectForm = () => ({ id: undefined, subtypeId: undefined, fromCustId: undefined, fromCustName: undefined, lscId: undefined, lscName: undefined, lscCode: undefined, agentId: undefined, measureId: undefined, priceType: undefined, umWeight: undefined, umVolume: undefined, currencyId: undefined, currencyName: undefined, deliveries: [], audit: undefined, status: undefined, times: [], reason: '' /*, destinationPort: undefined, status: 0 */ })
const selectForm = reactive(defaultSelectForm())

const formRules = {
  subtypeId: [required('请选择业务类型', 'change')],
  fromCustId: [required('请选择供应商', 'change')],
  lscId: [required('请选择服务', 'change')],
  agentId: [required('请选择所属公司', 'change')],
  measureId: [required('请选择计费配置', 'change')],
  deliveries: [required('请选择交货区域', 'change')],
  times: [required('请选择有效时间', 'change')]
}

const resetForm = () => {
  Object.assign(selectForm, defaultSelectForm())
  tableData.value = []; aAxisData.value = []
  currentId.value = ''; historyId.value = ''
  isHistory.value = false; isRightShow.value = false; isView.value = false
  editForm.value?.clearValidate()
}
const addPrice = () => { resetForm(); isRightShow.value = true }

const onRow = async (item, isCopy = false) => {
  if (!can('get') && !can('copy')) return
  resetForm(); isRightShow.value = true; isView.value = !isCopy; formLoading.value = true
  try {
    const res = await outsourcApi.getById(item.id)
    const d = res.data || {}
    currentId.value = isCopy ? '' : d.id
    Object.assign(selectForm, {
      id: isCopy ? undefined : d.id, subtypeId: (d.subtype || {}).key,
      fromCustId: d.fromCustId, fromCustName: d.fromCustName, lscId: (d.lsc || {}).key, lscName: d.lscName, lscCode: d.lscCode,
      agentId: d.agentId, measureId: d.measureId, priceType: d.priceType,
      umWeight: d.umWeight, umVolume: d.umVolume, currencyId: d.currencyId, currencyName: d.currencyName,
      deliveries: (d.deliveries || []).map(it => it.id || it), audit: d.audit, status: d.status, reason: d.reason,
      times: !isCopy && d.startTime ? [d.startTime, d.endTime] : []
    })
    const rows = (d.rows || []).map(r => ({ ...r }))
    aAxisData.value = buildNumAxis(rows)
    tableData.value = rows
  } finally { formLoading.value = false }
}

const getSupplierSel = async () => { const res = await getOutsourcSupplierOptions(); supplierSelList.value = res.data }
const getAgentOptions = async () => { const res = await getOutsourcAgentOptions(); agentList.value = res.data }
const getDeliveryOptions = async () => { const res = await getDeliveryAreaOptions(); deliveryList.value = res.data }
const getChargeOptions = async () => { const res = await getOutsourcChargeOptions(); chargeList.value = res.data }

const onSubtype = () => { selectForm.lscId = undefined; tableData.value = []; aAxisData.value = [] }
const onSupplier = async () => {
  const s = supplierSelList.value.find(o => o.id === selectForm.fromCustId) || {}
  selectForm.fromCustName = s.name
  selectForm.lscId = undefined; tableData.value = []; aAxisData.value = []
  await getServiceSel()
}
const getServiceSel = async () => { const res = await getOutsourcServiceOptions(); serviceSelList.value = res.data.result || [] }
const onServiceSel = async () => {
  if (!serviceSelList.value.length) await getServiceSel()
  const svc = serviceSelList.value.find(it => it.id === selectForm.lscId)
  if (svc) Object.assign(selectForm, { lscName: svc.name, lscCode: svc.lsId, priceType: svc.priceType, umWeight: svc.umWeight, umVolume: svc.umVolume, currencyId: svc.currencyId, currencyName: svc.currencyName })
  tableData.value = []; aAxisData.value = []
}

const editRow = () => { isView.value = false }
const cancelRow = async () => { const id = currentId.value; resetForm(); if (id) await onRow({ id }) }

/* ------- 审核 ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ audit: 4, reason: undefined })
const auditRules = { audit: [required('请选择审核状态', 'change')], reason: [required('请输入拒绝原因')] }
const onShow = async () => {
  if (selectForm.audit === 1) { await outsourcApi.audit({ audit: 2, id: currentId.value }); selectForm.audit = 2; getTableData() }
  Object.assign(auditForm, { audit: 4, reason: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { audit: undefined, reason: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.audit === 3 && !auditForm.reason) return ElMessage.error('请输入拒绝原因')
  selectLoading.value = true
  try { await outsourcApi.audit({ audit: auditForm.audit, id: currentId.value }); ElMessage.success('审核成功'); onHide(); getTableData(); resetForm() }
  finally { selectLoading.value = false }
}

/* ------- 失效/删除/复制/历史 ------- */
const invalidPrice = () => {
  ElMessageBox.confirm('该操作会使此报价失效，请确认是否操作?', '温馨提示', { type: 'warning' }).then(async () => {
    await outsourcApi.invalid(currentId.value); ElMessage.success('操作成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const deleteRow = (tag, row) => {
  const id = tag === 1 ? currentId.value : row.id
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await outsourcApi.remove(id); ElMessage.success('删除成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const copyPrice = () => { onRow({ id: currentId.value }, true) }
const onHistory = async val => { if (!val) return; isHistory.value = true; await onRow({ id: val }) }

/* ------- 设置区间/目的地 ------- */
const rangeRef = ref(null)
const dialogRange = ref(false)
const sectionMode = ref('one')
const sectionTitle = ref('')
const onSection = () => {
  if (!selectForm.lscId) return ElMessage.error('请先选择服务')
  rangeRef.value?.resetForm()
  if (selectForm.priceType === '4') { sectionTitle.value = '柜型'; sectionMode.value = 'three' }
  else if (selectForm.priceType === '3') { sectionTitle.value = '体积区间'; sectionMode.value = 'one' }
  else { sectionTitle.value = '重量区间'; sectionMode.value = 'one' }
  dialogRange.value = true
}
const onAddress = () => {
  if (!selectForm.lscId) return ElMessage.error('请先选择服务')
  rangeRef.value?.resetForm()
  sectionTitle.value = '地址类型'; sectionMode.value = 'four'
  dialogRange.value = true
}
const saveRange = () => { ElMessage.success('保存成功'); dialogRange.value = false }

/* ------- 保存 ------- */
const saveRow = async () => {
  await editForm.value.validate()
  const json = tableData.value.filter(it => !it.isUpper)
  if (!json.length) return ElMessage.error('暂未配置，无法报价')
  if (json.every(it => (it.prices || []).every(p => !p.price && p.price !== 0))) return ElMessage.error('请至少填写一条报价')
  formLoading.value = true
  try {
    const subtype = SUBTYPE_LIST.find(s => s.id === selectForm.subtypeId) || {}
    const payload = {
      id: selectForm.id, typeId: '05',
      subtype: { key: selectForm.subtypeId, value: subtype.name },
      lsc: { key: selectForm.lscId, value: selectForm.lscName }, lscName: selectForm.lscName, lscCode: selectForm.lscCode,
      fromCustId: selectForm.fromCustId, fromCustName: selectForm.fromCustName,
      agentId: custType === '0' ? selectForm.agentId : undefined,
      measureId: selectForm.priceType === '4' ? undefined : selectForm.measureId,
      priceType: selectForm.priceType, umWeight: selectForm.umWeight, umVolume: selectForm.umVolume,
      currencyId: selectForm.currencyId, currencyName: selectForm.currencyName,
      deliveries: (selectForm.deliveries || []).map(id => { const a = deliveryList.value.find(x => x.id === id) || {}; return { id, value: a.name } }),
      audit: selectForm.audit === 3 ? 1 : (selectForm.audit || 1), status: selectForm.status || 1,
      startTime: (selectForm.times || [])[0], endTime: (selectForm.times || [])[1],
      period: { effect: (selectForm.times || [])[0], expire: (selectForm.times || [])[1] },
      rows: json
      // destinationPort: selectForm.destinationPort,
      // status: 0
    }
    await outsourcApi.save(payload)
    ElMessage.success('保存成功'); resetForm(); getTableData()
  } finally { formLoading.value = false }
}

const onMenu = ({ action, row }) => { if (action === 'copy') onRow(row, true); else if (action === 'view') onRow(row); else if (action === 'delete') deleteRow(2, row) }

getTableData()
</script>

<style scoped lang="scss">
.pl-wrap { display: flex; flex-flow: row nowrap; min-height: inherit; }
.pl-main { flex: 1; overflow: auto; margin-left: 12px; background: $bg-card; border-radius: $card-radius; padding: 20px; }
.pl-search :deep(.el-form-item) { display: inline-block; vertical-align: top; width: 50%; padding-right: 4px; margin-bottom: 10px; }
.pl-filter :deep(.el-form-item) { margin-bottom: 10px; }
.pl-form :deep(.el-form-item) { display: inline-block; vertical-align: top; }
.item-read { background: #eaeef4; padding: 5px 10px; margin: 10px 0; :deep(.el-form-item) { margin-bottom: 0; } }
.card-tips { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
.card-tip-blue { background: #2291e6; }
.card-tip-y { background: #ff7d19; }
.card-tip-red { background: #e12e2e; }
.card-tip-success { background: #189800; }
.word-limit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-tip-green { color: #189800; background: rgba(24, 152, 0, .2); padding: 2px; border-radius: 2px; }
.btn-tip-blue { color: #2291e6; background: rgba(34, 145, 230, .2); padding: 2px; border-radius: 2px; }
.btn-tip-grey { color: #909399; background: rgba(144, 147, 153, .2); padding: 2px; border-radius: 2px; }
.border-tip-blue { color: #2291e6; border: 1px solid #2291e6; padding: 1px 2px; border-radius: 2px; font-size: 12px; }
</style>