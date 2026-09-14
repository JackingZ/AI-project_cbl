<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流 -->
    <PriceCardList
      title="订舱报价"
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
      :menu-deletable="row => row.audit !== '1' && row.audit !== '3'"
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
              <el-form label-width="70px" size="small">
                <el-form-item label="目的国">
                  <el-select v-model="searchForm.countryId" clearable filterable placeholder="请选择" style="width: 100%" @focus="getCountryList">
                    <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="服务">
                  <el-select v-model="searchForm.bscId" :disabled="!searchForm.countryId" clearable filterable placeholder="请选择" style="width: 100%">
                    <el-option v-for="item in serviceList" :key="item.id" :label="item.label" :value="item.id" />
                  </el-select>
                </el-form-item>
                <div style="text-align: right"><el-button size="small" @click="searchForm.countryId = undefined; searchForm.bscId = undefined">清空</el-button><el-button type="primary" size="small" @click="getTableData(1)">筛选</el-button></div>
              </el-form>
              <template #reference><el-input v-model="searchForm.bscName" placeholder="服务" readonly :suffix-icon="ArrowDown" /></template>
            </el-popover>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.audit" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in AUDIT_STR_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-popover v-model:visible="popoverShow" placement="bottom-start" trigger="click" width="360">
              <div class="pl-filter">
                <el-form-item label="价格标准" label-width="90px">
                  <el-radio-group v-model="searchForm.mode">
                    <el-radio-button :value="undefined">全部</el-radio-button>
                    <el-radio-button value="0">标准</el-radio-button>
                    <el-radio-button value="1">特殊</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="有效时间" label-width="90px">
                  <el-date-picker v-model="searchForm.times" unlink-panels type="daterange" size="small" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 250px" />
                </el-form-item>
                <el-form-item label="历史报价" label-width="90px">
                  <el-checkbox v-model="searchForm.history">显示历史报价</el-checkbox>
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
            <el-tooltip effect="dark" :content="lookup(AUDIT_STR_LIST, item.audit)" placement="top">
              <i class="card-tips" :class="`card-tip-${item.audit}`" />
            </el-tooltip>
          </el-col>
          <el-col :span="19" class="word-limit">&nbsp;{{ (item.bsc || {}).value }}</el-col>
          <el-col :span="4" style="text-align: right">{{ item.mode === '1' ? '特殊报价' : '标准报价' }}</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="20" class="word-limit" style="color: #409eff">{{ (item.portsFrom || {}).value }} --- {{ (item.portsTo || {}).value }}</el-col>
          <el-col :span="4" style="text-align: right">{{ CATEGORY_LABELS[item.category] }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="4">
            <span v-if="item.status === '1'" class="btn-tip-green">生效中</span>
            <span v-else-if="item.status === '0'" class="btn-tip-blue">待生效</span>
            <span v-else class="btn-tip-grey">已失效</span>
          </el-col>
          <el-col :span="20" style="line-height: 16px">{{ formatTime(item.period) }}</el-col>
          <el-col :span="24" style="text-align: right; margin-top: 4px">
            <span class="border-tip-blue">{{ (item.subtype || {}).value }}</span>&nbsp;
            <span v-if="item.loadType" class="border-tip-blue">{{ lookup(LOAD_TYPE_LIST, item.loadType) }}</span>
          </el-col>
        </el-row>
      </template>
    </PriceCardList>

    <!-- 右侧：详情/编辑 + 矩阵 -->
    <div v-loading="formLoading" class="pl-main">
      <div v-show="isRightShow">
        <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="90px" size="small" class="pl-form">
          <el-row>
            <el-col :span="20">
              <el-form-item label="业务类型" prop="subtypeId">
                <el-select v-model="selectForm.subtypeId" :disabled="isEdit || !isAdd" style="width: 100px" clearable filterable placeholder="请选择" @change="onSubtype">
                  <el-option v-for="item in SUBTYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="isAdd" label="目的国" prop="countryId" label-width="75px">
                <el-select v-model="selectForm.countryId" style="width: 140px" clearable filterable placeholder="请选择" @focus="getCountryList" @change="onServiceReload">
                  <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item prop="bscId" label="服务" label-width="75px">
                <el-select v-model="selectForm.bscId" :disabled="isEdit || !isAdd || !selectForm.subtypeId" style="width: 200px" clearable filterable placeholder="请选择服务" @change="onServiceSel">
                  <el-option v-for="item in serviceList2" :key="item.id" :label="item.label" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="报价对象" prop="category" required>
                <el-select v-model="selectForm.category" :disabled="isEdit || !isAdd" style="width: 100px" clearable filterable placeholder="请选择">
                  <el-option v-for="item in custList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="4" style="text-align: right">
              <template v-if="!isHistory && selectForm.status !== '2'">
                <el-button v-if="!isEdit && !isAdd && !editOther && selectForm.audit !== '1' && selectForm.audit !== '3' && can('edit')" type="primary" link size="small" @click="editRow">编辑</el-button>
                <el-button v-if="!isEdit && !isAdd && !editOther && selectForm.audit !== '1' && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
                <el-button v-if="(isAdd || isEdit || editOther) && can('edit')" type="primary" link size="small" @click="cancelRow">取消</el-button>
                <el-button v-if="(isAdd || isEdit || editOther) && can('edit')" type="primary" link size="small" @click="saveRow">保存</el-button>
                <el-button v-if="!isAdd && !isEdit && !editOther && selectForm.audit !== '1' && selectForm.audit !== '3' && can('del')" type="danger" link size="small" @click="deleteRow(1)">删除</el-button>
              </template>
              <template v-if="!isEdit && !isAdd && !editOther">
                <el-button v-if="can('copy')" type="primary" link size="small" @click="copyPrice">复制此版本</el-button>
                <el-button v-if="selectForm.audit === '1' && !historyId" type="primary" link size="small" @click="invalidPrice">失效</el-button>
              </template>
            </el-col>
          </el-row>

          <div class="item-read">
            <el-form-item v-if="(selectForm.portsFrom || {}).value || (selectForm.portsTo || {}).value" label="航线：" label-width="95px">
              <div>{{ (selectForm.portsFrom || {}).value }} --- {{ (selectForm.portsTo || {}).value }}</div>
            </el-form-item>
            <el-form-item label="重量单位："><div style="width: 60px">{{ selectForm.umWeight }}</div></el-form-item>
            <el-form-item label="长度单位："><div style="width: 60px">{{ selectForm.umLength }}</div></el-form-item>
            <el-form-item v-if="selectForm.subtypeId !== '1' && selectForm.subtypeId !== '2'" label="货币单位：">
              <span v-if="selectForm.currencyId">{{ selectForm.currencyId }}</span><span v-if="selectForm.currencyName">{{ '-' + selectForm.currencyName }}</span>
            </el-form-item>
            <el-form-item v-if="(selectForm.subtypeId === '1' || selectForm.subtypeId === '2') && selectForm.loadType === '2'" label="整柜货币单位：" label-width="110px">
              <span>{{ selectForm.currencyId1 }}{{ selectForm.currencyName1 ? '-' + selectForm.currencyName1 : '' }}</span>
            </el-form-item>
            <el-form-item v-if="(selectForm.subtypeId === '1' || selectForm.subtypeId === '2') && selectForm.loadType === '3'" label="拼箱货币单位：" label-width="110px">
              <span>{{ selectForm.currencyId2 }}{{ selectForm.currencyName2 ? '-' + selectForm.currencyName2 : '' }}</span>
            </el-form-item>
          </div>

          <el-row>
            <el-col :span="21">
              <el-form-item v-if="selectForm.subtypeId && selectForm.bscId" label="装载方式" prop="loadType">
                <el-radio-group v-model="selectForm.loadType" :disabled="(!isEdit && !isAdd)" @change="onLoadType">
                  <el-radio v-for="item in loadTypeOption" :key="item.id" :value="item.id">{{ item.name }}</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="价格标准" prop="mode">
                <el-radio-group v-model="selectForm.mode" :disabled="!isEdit && !isAdd">
                  <el-radio value="0">标准</el-radio>
                  <el-radio value="1">特殊</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="selectForm.mode === '1'" :label="selectForm.category === '3' || selectForm.category === '4' ? '关联客户' : '关联代理商'" class="is-required" label-width="110px">
                <el-button type="primary" link size="small" @click="onCompany">已选择({{ (selectForm.agentId || []).length }})</el-button>
              </el-form-item>
              <el-form-item label="有效时间" prop="times">
                <el-date-picker v-model="selectForm.times" :disabled="!isEdit && !isAdd" type="datetimerange" size="small" value-format="YYYY-MM-DD HH:mm:ss" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 310px" />
              </el-form-item>
            </el-col>
            <el-col :span="3" style="text-align: right">
              <el-select v-if="!isEdit && !isAdd" v-model="historyId" clearable filterable placeholder="历史版本" style="width: 100%" size="small" @change="onHistory">
                <el-option v-for="item in historyList" :key="item.id" :label="formatTime(item.period)" :value="item.id" />
              </el-select>
              <el-popover v-if="isAdd || isEdit" v-model:visible="batchShow" placement="bottom" trigger="click" width="260">
                <div style="padding: 0 10px">
                  <div>请输入需要批量修改的值</div>
                  <el-input-number v-model="batchNum" :controls="false" placeholder="请输入" :precision="2" size="small" style="margin: 13px 0; width: 100%" />
                  <div style="display: flex; justify-content: space-between">
                    <el-button type="primary" link size="small" style="color: #ff6d00" @click="batchConfirm(0)">重置</el-button>
                    <div><el-button type="primary" link size="small" style="color: #999" @click="batchShow = false">取消</el-button><el-button type="primary" link size="small" @click="batchConfirm(1)">保存</el-button></div>
                  </div>
                </div>
                <template #reference><el-button type="primary" link size="small">批量修改</el-button></template>
              </el-popover>
            </el-col>
          </el-row>

          <el-row v-if="isAdd || isEdit">
            <el-form-item v-if="selectForm.bscId && selectForm.loadType && rangeTitle" :label="rangeTitle" class="is-required">
              <el-button type="primary" size="small" plain @click="onRangeReset">{{ rangeTitle }}</el-button>
            </el-form-item>
          </el-row>

          <div v-if="!isEdit && !isAdd && selectForm.audit === '2'">
            <el-form-item label="拒绝原因：" label-width="90px" style="width: 100%">{{ selectForm.remark }}</el-form-item>
          </div>
        </el-form>

        <PriceMatrix
          :left-title="leftTitle"
          :right-title="rightTitle"
          :columns="aAxisData"
          :data="tableData"
          :editable="isEdit || isAdd"
          :edit-remark="isEdit || isAdd || editOther"
          :show-prescription="false"
        />
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗（订舱无分公司同步） -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="audit">
          <el-radio-group v-model="auditForm.audit"><el-radio value="1">通过</el-radio><el-radio value="2">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.audit === '2'" label="拒绝原因：" prop="remark">
          <el-input v-model="auditForm.remark" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>

    <RangeConfigDialog
      ref="rangeRef"
      v-model="dialogRange"
      :mode="isType"
      :title="rangeDialogTitle"
      :loading="selectLoading"
      :address-list="ADDRESS_AXIS_LIST"
      :country-list="countryList"
      :box-list="boxList"
      @load-country="getCountryList"
      @save="saveRange"
    />

    <RelevanceTransfer
      v-model="dialogCompany"
      :title="selectForm.category === '3' || selectForm.category === '4' ? '关联客户' : '关联代理商'"
      :loading="selectLoading"
      :company-list="companyList"
      :selected="selectForm.agentId"
      :show-footer="isAdd || isEdit"
      @save="onCompanySave"
    />

    <div v-show="isRightShow && can('quotation')" class="agent-price" @click="showAgentPrice">
      <el-tooltip effect="dark" content="供应商报价" placement="top"><el-icon><Money /></el-icon></el-tooltip>
    </div>
    <AgentPriceDialog ref="agentPriceRef" :fetch-supplier="bookingApi.supplier" />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ArrowDown, Money } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import PriceMatrix from './components/PriceMatrix.vue'
import RangeConfigDialog from './components/RangeConfigDialog.vue'
import RelevanceTransfer from './components/RelevanceTransfer.vue'
import AgentPriceDialog from './components/AgentPriceDialog.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import {
  bookingApi, SUBTYPE_LIST, AUDIT_STR_LIST, LOAD_TYPE_LIST, CATEGORY_LABELS, CATEGORY_OPTS,
  ADDRESS_AXIS_LIST, buildAxis, lookup,
  getCountryOptions, getServiceOptions, getContainerOptions
} from '@/api/modules/price'

defineOptions({ name: 'PriceBooking' })
const { can } = usePagePerms()

const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const popoverShow = ref(false)
const searchForm = reactive({ subtypeId: undefined, countryId: undefined, bscId: undefined, bscName: undefined, audit: undefined, mode: undefined, history: false, times: [] })
const custList = CATEGORY_OPTS
const countryList = ref([])
const serviceList = ref([])
const serviceList2 = ref([])

const getTableData = async (p) => {
  if (p === 1) { page.value = 1; popoverShow.value = false }
  cardLoading.value = true
  try {
    const res = await bookingApi.getList({ subtypeId: searchForm.subtypeId, audit: searchForm.audit, mode: searchForm.mode, lscId: searchForm.bscId, page: page.value, size: size.value })
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const handleClear = () => { Object.assign(searchForm, { mode: undefined, history: false, times: [] }) }
const handleConfirm = () => { popoverShow.value = false; getTableData(1) }

const getCountryList = async () => { const res = await getCountryOptions(); countryList.value = res.data.result || [] }
const getServiceList = async () => { const res = await getServiceOptions(); serviceList.value = res.data.result || []; serviceList2.value = res.data.result || [] }
const onServiceReload = () => { selectForm.bscId = undefined }

/* ------- 右侧 ------- */
const editForm = ref(null)
const formLoading = ref(false)
const selectLoading = ref(false)
const isRightShow = ref(false)
const isAdd = ref(false)
const isEdit = ref(false)
const editOther = ref(false)
const isHistory = ref(false)
const currentId = ref('')
const historyId = ref('')
const historyList = ref([])
const leftTitle = ref('')
const rightTitle = ref('')
const rangeTitle = ref('')
const aAxisData = ref([])
const tableData = ref([])
const loadTypeOption = ref([])
const companyList = ref([])
const boxList = ref([])

const defaultSelectForm = () => ({ id: undefined, subtypeId: undefined, countryId: undefined, bscId: undefined, bscName: undefined, category: undefined, mode: '0', loadType: undefined, times: [], agentId: [], audit: undefined, status: undefined, remark: '', portsFrom: {}, portsTo: {}, umWeight: undefined, umLength: undefined, currencyId: undefined, currencyName: undefined, currencyId1: undefined, currencyName1: undefined, currencyId2: undefined, currencyName2: undefined })
const selectForm = reactive(defaultSelectForm())

const formRules = {
  subtypeId: [required('请选择业务类型', 'change')],
  countryId: [required('请选择目的国', 'change')],
  bscId: [required('请选择服务', 'change')],
  category: [required('请选择报价对象', 'change')],
  loadType: [required('请选择装载方式', 'change')],
  mode: [required('请选择价格标准', 'change')],
  times: [required('请选择有效时间', 'change')]
}

const formatTime = obj => { const o = obj || {}; return `${(o.effect || '').slice(0, 16)} ~ ${(o.expire || '').slice(0, 16)}` }

const resetForm = () => {
  Object.assign(selectForm, defaultSelectForm())
  tableData.value = []; aAxisData.value = []
  currentId.value = ''; historyId.value = ''
  isHistory.value = false; isRightShow.value = false
  isAdd.value = false; isEdit.value = false; editOther.value = false
  leftTitle.value = ''; rightTitle.value = ''
  editForm.value?.clearValidate()
}
const addPrice = () => { resetForm(); isRightShow.value = true; isAdd.value = true }

const buildLoadTypeOption = () => {
  if (selectForm.subtypeId === '0') loadTypeOption.value = [{ id: '0', name: '散货' }, { id: '1', name: '包板' }]
  else if (selectForm.subtypeId === '1' || selectForm.subtypeId === '2') loadTypeOption.value = [{ id: '2', name: '整柜' }, { id: '3', name: '拼箱' }, { id: '5', name: '整车' }]
  else loadTypeOption.value = LOAD_TYPE_LIST
}

const onRow = async (item, isCopy = false) => {
  if (!can('get') && !can('copy')) return
  resetForm(); isRightShow.value = true; formLoading.value = true
  try {
    const res = await bookingApi.getById(item.id)
    const d = res.data || {}
    currentId.value = isCopy ? '' : d.id
    Object.assign(selectForm, {
      id: isCopy ? undefined : d.id, subtypeId: (d.subtype || {}).key, countryId: d.countryId,
      bscId: (d.bsc || {}).key, bscName: (d.bsc || {}).value, category: d.category, mode: d.mode,
      loadType: d.loadType, audit: isCopy ? undefined : d.audit, status: isCopy ? undefined : d.status,
      remark: d.remark, portsFrom: d.portsFrom || {}, portsTo: d.portsTo || {},
      umWeight: d.umWeight, umLength: d.umLength, currencyId: d.currencyId, currencyName: d.currencyName,
      currencyId1: d.currencyId1, currencyName1: d.currencyName1, currencyId2: d.currencyId2, currencyName2: d.currencyName2,
      agentId: (d.specials || []).map(it => it.key),
      times: d.period && d.period.effect && !isCopy ? [d.period.effect, d.period.expire] : []
    })
    const rows = (d.rows || []).map(r => ({ ...r }))
    const axis = buildAxis(rows, d.loadType)
    leftTitle.value = '服务机构'
    rightTitle.value = axis.rightTitle
    aAxisData.value = axis.columns
    tableData.value = rows
    buildLoadTypeOption(); onRangeTitle()
    await getServiceList()
    if (isCopy) { isAdd.value = true }
  } finally { formLoading.value = false }
}

const onSubtype = () => { selectForm.bscId = undefined; selectForm.loadType = undefined; buildLoadTypeOption(); tableData.value = []; aAxisData.value = [] }
const onServiceSel = async () => {
  if (!serviceList2.value.length) await getServiceList()
  const svc = serviceList2.value.find(it => it.id === selectForm.bscId)
  if (svc) Object.assign(selectForm, { bscName: svc.label, umWeight: svc.umWeight, umLength: svc.umLength, currencyId: svc.currencyId, currencyName: svc.currencyName })
  buildLoadTypeOption()
}
const onLoadType = () => { tableData.value = []; aAxisData.value = []; onRangeTitle() }

const editRow = () => { if (selectForm.audit !== '1' && selectForm.audit !== '3') isEdit.value = true; else editOther.value = true }
const cancelRow = async () => { if (editOther.value || isEdit.value) { const id = currentId.value; resetForm(); await onRow({ id }) } else resetForm() }

/* ------- 审核 ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ audit: '1', remark: undefined })
const auditRules = { audit: [required('请选择审核状态', 'change')] }
const onShow = async () => {
  if (selectForm.audit === '0') { await bookingApi.audit({ id: currentId.value, audit: '3' }); selectForm.audit = '3'; getTableData() }
  Object.assign(auditForm, { audit: '1', remark: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { audit: undefined, remark: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.audit !== '1' && auditForm.audit !== '2') return
  selectLoading.value = true
  try { await bookingApi.audit({ id: currentId.value, audit: auditForm.audit, reason: auditForm.remark }); ElMessage.success('审核成功'); onHide(); getTableData(); resetForm() }
  finally { selectLoading.value = false }
}

/* ------- 失效/删除/复制/历史 ------- */
const invalidPrice = () => {
  ElMessageBox.confirm('该操作会使此报价及相关代理报价失效，请确认是否操作?', '温馨提示', { type: 'warning' }).then(async () => {
    await bookingApi.invalid(currentId.value); ElMessage.success('操作成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const deleteRow = (tag, row) => {
  const id = tag === 1 ? currentId.value : row.id
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await bookingApi.remove(id); ElMessage.success('删除成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const copyPrice = () => { onRow({ id: currentId.value }, true) }
const onHistory = async val => { if (!val) return; isHistory.value = true; await onRow({ id: val }) }

/* ------- 批量修改 ------- */
const batchShow = ref(false)
const batchNum = ref()
const batchConfirm = type => {
  tableData.value = tableData.value.map(it => {
    if (it.isUpper) return it
    it.prices = it.prices.map(p => { if (type === 1) { if (batchNum.value != null) p.price = Number(((p.price || 0) + batchNum.value).toFixed(2)) } else p.price = undefined; return p })
    return it
  })
  if (type === 0) batchShow.value = false
}

/* ------- 区间/柜型配置 ------- */
const rangeRef = ref(null)
const dialogRange = ref(false)
const isType = ref('')
const rangeDialogTitle = ref('')
const onRangeTitle = () => {
  const lt = selectForm.loadType
  if (lt === '2' || lt === '1' || lt === '4') rangeTitle.value = '柜型'
  else if (lt === '5') rangeTitle.value = '重量&方数区间'
  else if (lt === '3') rangeTitle.value = '体积区间'
  else if (lt === '0') rangeTitle.value = '重量区间'
  else rangeTitle.value = ''
}
const onRangeReset = () => {
  if (!selectForm.bscId) return ElMessage.error('请先选择服务')
  rangeRef.value?.resetForm()
  const lt = selectForm.loadType
  if (lt === '2' || lt === '1' || lt === '4') { rangeDialogTitle.value = '柜型'; isType.value = 'three'; getContainerBox() }
  else if (lt === '5') { rangeDialogTitle.value = '重量区间'; isType.value = 'two' }
  else { rangeDialogTitle.value = lt === '3' ? '体积区间' : '重量区间'; isType.value = 'one' }
  dialogRange.value = true
}
const getContainerBox = async () => { const res = await getContainerOptions(); boxList.value = res.data || [] }
const saveRange = () => { ElMessage.success('保存成功'); dialogRange.value = false }

/* ------- 关联客户 ------- */
const dialogCompany = ref(false)
const onCompany = async () => { if (!companyList.value.length) { const res = await getCountryOptions(); companyList.value = (res.data.result || []).map(c => ({ id: c.id, name: c.name })) } dialogCompany.value = true }
const onCompanySave = ids => { selectForm.agentId = ids }

/* ------- 保存 ------- */
const saveRow = async () => {
  await editForm.value.validate()
  const json = tableData.value.filter(it => !it.isUpper)
  if (!json.length) return ElMessage.error('暂未配置，无法报价')
  if (json.every(it => it.prices.every(p => !p.price && p.price !== 0))) return ElMessage.error('请至少填写一条报价')
  if (selectForm.mode === '1' && (!selectForm.agentId || !selectForm.agentId.length)) return ElMessage.error('请选择关联代理商')
  formLoading.value = true
  try {
    const subtype = SUBTYPE_LIST.find(s => s.id === selectForm.subtypeId) || {}
    const payload = {
      id: selectForm.id, serviceType: '02',
      bsc: { key: selectForm.bscId, value: selectForm.bscName },
      subtype: { key: selectForm.subtypeId, value: subtype.name },
      category: selectForm.category, mode: selectForm.mode, loadType: selectForm.loadType,
      audit: selectForm.audit === '2' ? '0' : (selectForm.audit || '0'), status: selectForm.status || '0',
      countryId: selectForm.countryId, portsFrom: selectForm.portsFrom, portsTo: selectForm.portsTo,
      currencyId: selectForm.currencyId, currencyName: selectForm.currencyName,
      currencyId1: selectForm.currencyId1, currencyName1: selectForm.currencyName1,
      currencyId2: selectForm.currencyId2, currencyName2: selectForm.currencyName2,
      umWeight: selectForm.umWeight, umLength: selectForm.umLength,
      period: { effect: (selectForm.times || [])[0], expire: (selectForm.times || [])[1] },
      deliveries: [], specials: (selectForm.agentId || []).map(id => { const c = companyList.value.find(x => x.id === id) || {}; return { key: id, value: c.name } }),
      rows: json
    }
    await bookingApi.save(payload)
    ElMessage.success('保存成功'); resetForm(); getTableData()
  } finally { formLoading.value = false }
}

const onMenu = ({ action, row }) => { if (action === 'copy') onRow(row, true); else if (action === 'view') onRow(row); else if (action === 'delete') deleteRow(2, row) }

/* ------- 供应商报价 ------- */
const agentPriceRef = ref(null)
const showAgentPrice = () => { if (!selectForm.bscId) return ElMessage.warning('请选择服务'); agentPriceRef.value?.show({ id: selectForm.bscId, lscId: selectForm.bscId }) }

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
.card-tip-0 { background: #2291e6; }
.card-tip-1 { background: #189800; }
.card-tip-2 { background: #e12e2e; }
.card-tip-3 { background: #ff7d19; }
.word-limit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-tip-green { color: #189800; background: rgba(24, 152, 0, .2); padding: 2px; border-radius: 2px; }
.btn-tip-blue { color: #2291e6; background: rgba(34, 145, 230, .2); padding: 2px; border-radius: 2px; }
.btn-tip-grey { color: #909399; background: rgba(144, 147, 153, .2); padding: 2px; border-radius: 2px; }
.border-tip-blue { color: #2291e6; border: 1px solid #2291e6; padding: 1px 2px; border-radius: 2px; font-size: 12px; }
.agent-price { width: 40px; height: 40px; background: rgba(34, 145, 230, .13); border-radius: 4px; position: fixed; right: 60px; bottom: 100px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: $primary-color; font-size: 22px; z-index: 20; }
</style>