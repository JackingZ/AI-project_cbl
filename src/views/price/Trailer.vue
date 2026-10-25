<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流 -->
    <PriceCardList
      title="拖车报价"
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
      :menu-deletable="row => row.auditing === 1 || row.auditing === 3"
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
            <el-popover placement="bottom-start" trigger="click" width="320">
              <el-form label-width="60px" size="small">
                <el-form-item label="国家">
                  <el-select v-model="searchForm.countryId" clearable filterable placeholder="请选择" style="width: 100%" @focus="getCountryList">
                    <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="服务">
                  <el-select v-model="searchForm.serviceId" :disabled="!searchForm.countryId" clearable filterable placeholder="请选择" style="width: 100%">
                    <el-option v-for="item in serviceList" :key="item.id" :label="item.label" :value="item.id" />
                  </el-select>
                </el-form-item>
                <div style="text-align: right"><el-button size="small" @click="searchForm.countryId = undefined; searchForm.serviceId = undefined">清空</el-button><el-button type="primary" size="small" @click="getTableData(1)">筛选</el-button></div>
              </el-form>
              <template #reference><el-input v-model="searchForm.serviceName" placeholder="服务" readonly :suffix-icon="ArrowDown" /></template>
            </el-popover>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.auditing" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in AUDITING_STATUS_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-popover v-model:visible="popoverShow" placement="bottom-start" trigger="click" width="380">
              <div class="pl-filter">
                <el-form-item label="价格标准" label-width="90px">
                  <el-radio-group v-model="searchForm.ifStandard">
                    <el-radio-button value="0">全部</el-radio-button>
                    <el-radio-button :value="true">标准</el-radio-button>
                    <el-radio-button :value="false">特殊</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="地址类型" label-width="90px">
                  <el-radio-group v-model="searchForm.addressType">
                    <el-radio-button value="99">全部</el-radio-button>
                    <el-radio-button value="1">港口</el-radio-button>
                    <el-radio-button value="2">火车站</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="有效时间" label-width="90px">
                  <el-date-picker v-model="searchForm.times" unlink-panels type="daterange" size="small" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 250px" />
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
            <el-tooltip effect="dark" :content="lookup(AUDIT_NUM_LIST, item.auditing)" placement="top">
              <i class="card-tips" :class="auditDot(item.auditing)" />
            </el-tooltip>
          </el-col>
          <el-col :span="19" class="word-limit">&nbsp;{{ (item.service || {}).value }}</el-col>
          <el-col :span="4" style="text-align: right">{{ item.ifStandard ? '标准报价' : '特殊报价' }}</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="18" class="word-limit" style="color: #409eff">{{ item.city || '' }} {{ item.addressName }}</el-col>
          <el-col :span="6" style="text-align: right">{{ custTag(item) }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="5">
            <span v-if="item.status === '1'" class="btn-tip-green">生效中</span>
            <span v-else-if="item.status === '2'" class="btn-tip-blue">待生效</span>
            <span v-else class="btn-tip-grey">已失效</span>
          </el-col>
          <el-col :span="19" style="line-height: 16px">{{ item.startTime }} ~ {{ item.endTime }}</el-col>
          <el-col :span="24" style="text-align: right; margin-top: 4px">
            <span class="border-tip-blue">{{ (item.subtype || {}).value }}</span>
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
              <el-form-item label="所在国家" prop="selectCountryId" label-width="80px">
                <el-select v-model="selectForm.selectCountryId" :disabled="isView" style="width: 140px" clearable filterable placeholder="请选择" @focus="getCountryList">
                  <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item prop="serviceId" label="服务" label-width="60px">
                <el-select v-model="selectForm.serviceId" :disabled="isView || !selectForm.selectCountryId" style="width: 180px" clearable filterable placeholder="请选择服务" @change="onServiceSel">
                  <el-option v-for="item in serviceList2" :key="item.id" :label="item.label" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="报价对象">一级代理商</el-form-item>
            </el-col>
            <el-col :span="5" style="text-align: right">
              <template v-if="!isHistory && selectForm.status !== '3'">
                <el-button v-if="isView && (selectForm.auditing === 1 || selectForm.auditing === 3) && can('edit')" type="primary" link size="small" @click="editRow">编辑</el-button>
                <el-button v-if="isView && selectForm.auditing !== 4 && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
                <el-button v-if="!isView && can('edit')" type="primary" link size="small" @click="cancelRow">取消</el-button>
                <el-button v-if="!isView && can('edit')" type="primary" link size="small" @click="saveRow">保存</el-button>
                <el-button v-if="isView && (selectForm.auditing === 1 || selectForm.auditing === 3) && can('del')" type="danger" link size="small" @click="deleteRow(1)">删除</el-button>
              </template>
              <template v-if="isView">
                <el-button v-if="can('copy')" type="primary" link size="small" @click="copyPrice">复制此版本</el-button>
                <el-button v-if="selectForm.auditing === 4 && !historyId" type="primary" link size="small" @click="invalidPrice">失效</el-button>
              </template>
            </el-col>
          </el-row>

          <div class="item-read">
            <el-form-item label="起运地址："><div>{{ selectForm.addressName }}</div></el-form-item>
            <el-form-item label="货币单位："><span v-if="selectForm.currencyId">{{ selectForm.currencyId }}</span><span v-if="selectForm.currencyName">{{ '-' + selectForm.currencyName }}</span></el-form-item>
          </div>

          <el-row>
            <el-col :span="21">
              <el-form-item v-if="!isView && selectForm.endAddressType === 0" label="城市" class="is-required">
                <el-button type="primary" size="small" plain @click="onSection('y')">选择城市/目的地</el-button>
              </el-form-item>
              <el-form-item v-else-if="!isView" label="目的地" class="is-required">
                <el-button type="primary" size="small" plain @click="onSection('y')">选择目的地</el-button>
              </el-form-item>
              <el-form-item label="价格标准" prop="ifStandard">
                <el-radio-group v-model="selectForm.ifStandard" :disabled="isView">
                  <el-radio :value="true">标准</el-radio>
                  <el-radio :value="false">特殊</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="selectForm.ifStandard === false" label="关联代理商" class="is-required" label-width="105px">
                <el-button type="primary" link size="small" @click="onRelevance">已选择({{ (selectForm.associatedAgents || []).length }})</el-button>
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

          <div v-if="isView && selectForm.auditing === 3">
            <el-form-item label="拒绝原因：" label-width="90px" style="width: 100%">{{ selectForm.reason }}</el-form-item>
          </div>
        </el-form>

        <PriceMatrix
          left-title="目的地"
          right-title="柜型"
          :columns="aAxisData"
          :data="tableData"
          :editable="!isView"
          :edit-remark="!isView"
          :show-prescription="false"
        />
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗 -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="status">
          <el-radio-group v-model="auditForm.status"><el-radio value="4">通过</el-radio><el-radio value="3">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.status === '3'" label="拒绝原因：" prop="note">
          <el-input v-model="auditForm.note" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>

    <!-- 目的地 / 关联代理商 穿梭框（复用同一组件，按 transferType 区分保存） -->
    <RelevanceTransfer
      v-model="dialogTransfer"
      :title="transferType === 'y' ? '关联目的地' : '关联代理商'"
      :loading="selectLoading"
      :company-list="transferList"
      :selected="transferType === 'y' ? destSelected : selectForm.associatedAgents"
      :show-footer="!isView"
      @save="onTransferSave"
    />

    <div v-show="isRightShow && can('quotation')" class="agent-price" @click="showAgentPrice">
      <el-tooltip effect="dark" content="供应商报价" placement="top"><el-icon><Money /></el-icon></el-tooltip>
    </div>
    <AgentPriceDialog ref="agentPriceRef" :fetch-supplier="trailerApi.supplier" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ArrowDown, Money } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import PriceMatrix from './components/PriceMatrix.vue'
import RelevanceTransfer from './components/RelevanceTransfer.vue'
import AgentPriceDialog from './components/AgentPriceDialog.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import {
  trailerApi, SUBTYPE_LIST, AUDIT_NUM_LIST, AUDITING_STATUS_LIST, buildNumAxis, lookup,
  getCountryOptions, getCarServiceOptions, getCabinetOptions, getCustTypeOptions
} from '@/api/modules/price'

defineOptions({ name: 'PriceTrailer' })
const { can } = usePagePerms()

const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const popoverShow = ref(false)
const searchForm = reactive({ subtypeId: undefined, countryId: undefined, serviceId: undefined, serviceName: undefined, auditing: undefined, ifStandard: '0', addressType: '99', times: [] })
const countryList = ref([])
const serviceList = ref([])
const serviceList2 = ref([])

const auditDot = a => (a === 1 ? 'card-tip-blue' : a === 2 ? 'card-tip-y' : a === 3 ? 'card-tip-red' : 'card-tip-success')
const custTag = item => { const t = item.toType; const s = item.toSubtype; if (t === '2') return '代理商价'; if (t === '1' && s === '0') return '直客价'; if (t === '1' && s === '1') return '同行价'; if (t === '3') return 'SYSTEM价'; return '' }

const getTableData = async (p) => {
  if (p === 1) { page.value = 1; popoverShow.value = false }
  cardLoading.value = true
  try {
    const res = await trailerApi.getList({
      subtypeId: searchForm.subtypeId, auditing: searchForm.auditing,
      ifStandard: searchForm.ifStandard === '0' ? '' : searchForm.ifStandard,
      addressType: searchForm.addressType === '99' ? '' : searchForm.addressType,
      page: page.value, size: size.value
    })
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const handleClear = () => { Object.assign(searchForm, { ifStandard: '0', addressType: '99', times: [] }) }
const handleConfirm = () => { popoverShow.value = false; getTableData(1) }

const getCountryList = async () => { const res = await getCountryOptions(); countryList.value = res.data.result || [] }
const getServiceList = async () => { const res = await getCarServiceOptions(); serviceList.value = res.data.result || []; serviceList2.value = res.data.result || [] }

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

const defaultSelectForm = () => ({ id: undefined, subtypeId: undefined, selectCountryId: undefined, serviceId: undefined, serviceName: undefined, tsId: undefined, toType: undefined, toSubtype: undefined, ifStandard: true, addressType: undefined, addressName: undefined, city: undefined, endAddressType: undefined, currencyId: undefined, currencyName: undefined, auditing: undefined, effective: undefined, status: undefined, times: [], associatedAgents: [], reason: '' })
const selectForm = reactive(defaultSelectForm())

const formRules = {
  subtypeId: [required('请选择业务类型', 'change')],
  selectCountryId: [required('请选择所在国家', 'change')],
  serviceId: [required('请选择服务', 'change')],
  ifStandard: [required('请选择价格标准', 'change')],
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
    const res = await trailerApi.getById(item.id)
    const d = res.data || {}
    currentId.value = isCopy ? '' : d.id
    Object.assign(selectForm, {
      id: isCopy ? undefined : d.id, subtypeId: (d.subtype || {}).key, selectCountryId: d.selectCountryId || d.countryId,
      serviceId: (d.service || {}).key, serviceName: d.serviceName, tsId: d.tsId,
      toType: d.toType, toSubtype: d.toSubtype, ifStandard: d.ifStandard,
      addressType: d.addressType, addressName: d.addressName, city: d.city, endAddressType: d.endAddressType,
      currencyId: d.currencyId, currencyName: d.currencyName,
      auditing: d.auditing, effective: d.effective, status: d.status,
      associatedAgents: (d.associatedAgents || []).map(it => it.id || it), reason: d.reason,
      times: !isCopy && d.startTime ? [`${d.startTime} 00:00:00`, `${d.endTime} 23:59:59`] : []
    })
    const rows = (d.rows || []).map(r => ({ ...r }))
    aAxisData.value = buildNumAxis(rows)
    tableData.value = rows
    await getServiceList()
  } finally { formLoading.value = false }
}

const onSubtype = () => { selectForm.serviceId = undefined; tableData.value = []; aAxisData.value = [] }
const onServiceSel = async () => {
  if (!serviceList2.value.length) await getServiceList()
  const svc = serviceList2.value.find(it => it.id === selectForm.serviceId)
  if (svc) Object.assign(selectForm, { serviceName: svc.name, addressName: svc.addressName, addressType: svc.addressType, endAddressType: svc.addressType === '2' ? 1 : 0, currencyId: svc.currencyId, currencyName: svc.currencyName })
  tableData.value = []; aAxisData.value = []
}

const editRow = () => { isView.value = false }
const cancelRow = async () => { const id = currentId.value; resetForm(); if (id) await onRow({ id }) }

/* ------- 审核 ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ status: '4', note: undefined })
const auditRules = { status: [required('请选择审核状态', 'change')] }
const onShow = async () => {
  if (selectForm.auditing === 1) { await trailerApi.audit({ id: currentId.value, status: 2 }); selectForm.auditing = 2; getTableData() }
  Object.assign(auditForm, { status: '4', note: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { status: undefined, note: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.status !== '4' && auditForm.status !== '3') return
  selectLoading.value = true
  try { await trailerApi.audit({ id: currentId.value, status: auditForm.status, reason: auditForm.note }); ElMessage.success('审核成功'); onHide(); getTableData(); resetForm() }
  finally { selectLoading.value = false }
}

/* ------- 失效/删除/复制/历史 ------- */
const invalidPrice = () => {
  ElMessageBox.confirm('该操作会使此报价及相关代理报价失效，请确认是否操作?', '温馨提示', { type: 'warning' }).then(async () => {
    await trailerApi.invalid(currentId.value); ElMessage.success('操作成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const deleteRow = (tag, row) => {
  const id = tag === 1 ? currentId.value : row.id
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await trailerApi.remove(id); ElMessage.success('删除成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const copyPrice = () => { onRow({ id: currentId.value }, true) }
const onHistory = async val => { if (!val) return; isHistory.value = true; await onRow({ id: val }) }

/* ------- 穿梭框（目的地 y / 关联代理商 a，源同一 transferModal） ------- */
const dialogTransfer = ref(false)
const transferType = ref('a')
const transferList = ref([])
const destSelected = ref([])
const onSection = async type => {
  if (!selectForm.serviceId) return ElMessage.error('请先选择服务')
  transferType.value = type
  const res = await getCabinetOptions()
  transferList.value = (res.data || []).map((c, i) => ({ id: c.id, name: `${selectForm.city || ''}目的地${i + 1}` }))
  destSelected.value = tableData.value.map(r => (r.address || {}).value)
  dialogTransfer.value = true
}
const onRelevance = async () => {
  transferType.value = 'a'
  const res = await getCustTypeOptions()
  transferList.value = res.data || []
  dialogTransfer.value = true
}
const onTransferSave = ids => {
  if (transferType.value === 'y') {
    // 目的地重建 yAxis（矩阵行），保留已有 X 列
    tableData.value = ids.map(id => {
      const it = transferList.value.find(x => x.id === id) || { name: id }
      const cols = aAxisData.value.length ? aAxisData.value : [{ label: '20GP' }, { label: '40GP' }, { label: '40HQ' }]
      if (!aAxisData.value.length) aAxisData.value = cols
      return { address: { value: it.name }, addrName: it.name, prices: cols.map(c => ({ x: { value: c.label }, price: undefined })), remark: '' }
    })
  } else {
    selectForm.associatedAgents = ids
  }
}

/* ------- 保存 ------- */
const saveRow = async () => {
  await editForm.value.validate()
  const json = tableData.value.filter(it => !it.isSuperiorPrice)
  if (!json.length) return ElMessage.error('请先选择目的地')
  if (json.every(it => it.prices.every(p => !p.price && p.price !== 0))) return ElMessage.error('请至少填写一条报价')
  if (selectForm.ifStandard === false && (!selectForm.associatedAgents || !selectForm.associatedAgents.length)) return ElMessage.error('请选择关联代理商')
  formLoading.value = true
  try {
    const subtype = SUBTYPE_LIST.find(s => s.id === selectForm.subtypeId) || {}
    const payload = {
      id: selectForm.id, typeId: '06',
      subtype: { key: selectForm.subtypeId, value: subtype.name },
      service: { key: selectForm.serviceId, value: selectForm.serviceName }, serviceName: selectForm.serviceName, tsId: selectForm.tsId,
      selectCountryId: selectForm.selectCountryId, toType: selectForm.toType, toSubtype: selectForm.toSubtype,
      ifStandard: selectForm.ifStandard, addressType: selectForm.addressType, addressName: selectForm.addressName, city: selectForm.city, endAddressType: selectForm.endAddressType,
      currencyId: selectForm.currencyId, currencyName: selectForm.currencyName,
      auditing: selectForm.auditing === 3 ? 1 : (selectForm.auditing || 1), effective: selectForm.effective || 1, status: selectForm.status || '2',
      startTime: (selectForm.times || [])[0] ? (selectForm.times[0] || '').slice(0, 10) : undefined,
      endTime: (selectForm.times || [])[1] ? (selectForm.times[1] || '').slice(0, 10) : undefined,
      period: { effect: (selectForm.times || [])[0], expire: (selectForm.times || [])[1] },
      associatedAgents: (selectForm.associatedAgents || []).map(id => { const a = transferList.value.find(x => x.id === id) || {}; return { id, name: a.name } }),
      rows: json
    }
    await trailerApi.save(payload)
    ElMessage.success('保存成功'); resetForm(); getTableData()
  } finally { formLoading.value = false }
}

const onMenu = ({ action, row }) => { if (action === 'copy') onRow(row, true); else if (action === 'view') onRow(row); else if (action === 'delete') deleteRow(2, row) }

/* ------- 供应商报价 ------- */
const agentPriceRef = ref(null)
const showAgentPrice = () => { if (!selectForm.serviceId) return ElMessage.warning('请选择服务'); agentPriceRef.value?.show({ id: selectForm.serviceId, serviceId: selectForm.serviceId }) }

getCountryList(); getServiceList(); getTableData()
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
.agent-price { width: 40px; height: 40px; background: rgba(34, 145, 230, .13); border-radius: 4px; position: fixed; right: 60px; bottom: 100px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: $primary-color; font-size: 22px; z-index: 20; }
</style>