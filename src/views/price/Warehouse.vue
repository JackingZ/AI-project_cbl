<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流 -->
    <PriceCardList
      title="仓储报价"
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
            <el-select v-model="searchForm.warehouseId" clearable filterable placeholder="仓库" style="width: 100%" @focus="getWarehouseList" @change="getTableData(1)">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.auditing" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in AUDIT_NUM_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.ifStandard" clearable filterable placeholder="报价标准" style="width: 100%" @change="getTableData(1)">
              <el-option label="标准" :value="true" />
              <el-option label="特殊" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-popover v-model:visible="popoverShow" placement="bottom-start" trigger="click" width="330">
              <div class="pl-filter">
                <el-form-item label="有效时间" label-width="80px">
                  <el-date-picker v-model="searchForm.times" unlink-panels type="daterange" size="small" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 240px" />
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
          <el-col :span="19" class="word-limit">&nbsp;{{ item.warehouseName }}</el-col>
          <el-col :span="4" style="text-align: right">{{ item.ifStandard ? '标准报价' : '特殊报价' }}</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="4">
            <span v-if="item.effective === 2" class="btn-tip-green">生效中</span>
            <span v-else-if="item.effective === 1" class="btn-tip-blue">待生效</span>
            <span v-else class="btn-tip-grey">已失效</span>
          </el-col>
          <el-col :span="16" style="line-height: 16px; text-align: center">{{ item.startTime }} ~ {{ item.endTime }}</el-col>
          <el-col :span="4" style="text-align: right">{{ custTag(item) }}</el-col>
        </el-row>
      </template>
    </PriceCardList>

    <!-- 右侧：详情/编辑 -->
    <div v-loading="formLoading" class="pl-main">
      <div v-show="isRightShow">
        <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="90px" size="small" class="pl-form">
          <el-row>
            <el-col :span="19">
              <el-form-item label="仓库" prop="warehouseId">
                <el-tooltip effect="dark" :content="selectForm.warehouseName" placement="top" :disabled="!selectForm.warehouseName">
                  <el-select v-model="selectForm.warehouseId" :disabled="isEdit || !isAdd" style="width: 180px" clearable filterable placeholder="请选择仓库" @focus="getWarehouseSel" @change="onService">
                    <el-option v-for="item in warehouseSelList" :key="item.id" :label="item.name" :value="item.id" />
                  </el-select>
                </el-tooltip>
              </el-form-item>
              <!-- 参考报价：仅代理商（custType==='2'）显示 -->
              <el-form-item v-if="custType === '2'" label="参考报价" prop="refId" label-width="80px">
                <el-select v-model="selectForm.refId" :disabled="!isAdd || !selectForm.warehouseId" style="width: 180px" clearable filterable placeholder="请选择参考报价" @change="onEffect">
                  <el-option v-for="item in effectList" :key="item.id" :label="`${item.startTime} ~ ${item.endTime}`" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="报价对象">
                <span v-if="custType === '0'">一级代理商</span>
                <!--<div v-else-if="custType === '3'">SYSTEM</div>-->
                <el-select v-else v-model="selectForm.toCustSubtype" :disabled="isEdit || !isAdd" style="width: 120px" clearable placeholder="请选择" @change="onType">
                  <el-option v-for="item in custList" :key="item.id" :label="item.name" :value="item.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="5" style="text-align: right">
              <template v-if="!isHistory && selectForm.effective !== 3">
                <el-button v-if="!isEdit && !isAdd && (selectForm.auditing === 1 || selectForm.auditing === 3) && can('edit')" type="primary" link size="small" @click="editRow">编辑</el-button>
                <el-button v-if="!isEdit && !isAdd && selectForm.auditing !== 4 && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
                <el-button v-if="(isEdit || isAdd)" type="primary" link size="small" @click="cancelRow">取消</el-button>
                <el-button v-if="(isEdit || isAdd)" type="primary" link size="small" @click="saveRow">保存</el-button>
                <el-button v-if="!isEdit && !isAdd && (selectForm.auditing === 1 || selectForm.auditing === 3) && can('del')" type="danger" link size="small" @click="deleteRow(1)">删除</el-button>
              </template>
              <template v-if="!isEdit && !isAdd">
                <el-button v-if="can('copy')" type="primary" link size="small" @click="copyPrice">复制此版本</el-button>
                <el-button v-if="selectForm.auditing === 4 && !historyId" type="primary" link size="small" @click="invalidPrice">失效</el-button>
              </template>
            </el-col>
          </el-row>

          <div class="item-read">
            <el-form-item label="重量单位：">{{ umWeightLabel(selectForm.umWeight) }}</el-form-item>
            <el-form-item label="长度单位：">{{ umLengthLabel(selectForm.umLength) }}</el-form-item>
            <el-form-item label="货币单位："><span v-if="selectForm.currencyId">{{ selectForm.currencyId }}</span><span v-if="selectForm.currencyName">{{ '-' + selectForm.currencyName }}</span></el-form-item>
          </div>

          <el-row>
            <el-col :span="21">
              <el-form-item label="价格标准" prop="ifStandard">
                <el-radio-group v-model="selectForm.ifStandard" :disabled="!isEdit && !isAdd" @change="onMode">
                  <el-radio :value="true">标准</el-radio>
                  <el-radio :value="false">特殊</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="selectForm.ifStandard === false" :label="isLabelValue" class="is-required" label-width="105px">
                <el-button type="primary" link size="small" @click="onCompany">已选择({{ (selectForm.associatedAgents || []).length }})</el-button>
              </el-form-item>
              <!-- 特殊报价：有效时间取上级标准周期 -->
              <el-form-item v-if="selectForm.ifStandard === false" label="有效时间" prop="refStandard">
                <el-select v-model="selectForm.refStandard" :disabled="!isEdit && !isAdd" style="width: 310px" clearable filterable placeholder="请选择有效时间" @focus="getTimeList">
                  <el-option v-for="item in timeList" :key="item.id" :label="`${item.startTime} ~ ${item.endTime}`" :value="item.id" />
                </el-select>
              </el-form-item>
              <!-- 标准报价：日期区间 -->
              <el-form-item v-else label="有效时间" prop="times">
                <el-date-picker v-model="selectForm.times" :disabled="!isEdit && !isAdd" type="datetimerange" size="small" value-format="YYYY-MM-DD HH:mm:ss" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 310px" />
              </el-form-item>
              <!-- 源“单票最低收费”整块注释保留（原项目隐藏功能，勿放开） -->
              <!-- <el-form-item label="单票最低收费" label-width="110px" prop="floorPrice">
                <el-input-number v-model="selectForm.floorPrice" :disabled="!isEdit && !isAdd" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
              </el-form-item> -->
            </el-col>
            <el-col :span="3" style="text-align: right">
              <el-select v-if="!isEdit && !isAdd" v-model="historyId" clearable filterable placeholder="历史版本" style="width: 100%" size="small" @change="onHistory">
                <el-option v-for="item in historyList" :key="item.id" :label="`${item.startTime} ~ ${item.endTime}`" :value="item.id" />
              </el-select>
            </el-col>
          </el-row>

          <div v-if="!isEdit && !isAdd && selectForm.auditing === 3">
            <el-form-item label="拒绝原因：" label-width="90px" style="width: 100%">{{ selectForm.reason }}</el-form-item>
          </div>
        </el-form>

        <!-- 收费项目价格表（el-table + span-method 合并 收费项目/计费方式 列） -->
        <div v-show="isTableShow">
          <div style="display: flex; justify-content: space-between; align-items: center; margin: 6px 0">
            <span style="font-weight: 600">供应商报价</span>
            <!-- 批量修改：仅代理商（custType 2）编辑态 -->
            <el-popover v-if="custType === '2' && (isEdit || isAdd)" v-model:visible="batchShow" placement="bottom-end" trigger="click" width="260">
              <div>
                <el-input-number v-model="batchNum" :precision="2" :controls="false" placeholder="浮动金额" style="width: 100%" />
                <div style="text-align: right; margin-top: 10px">
                  <el-button size="small" @click="batchConfirm(0)">重置</el-button>
                  <el-button size="small" @click="batchShow = false">取消</el-button>
                  <el-button type="primary" size="small" @click="batchConfirm(1)">保存</el-button>
                </div>
              </div>
              <template #reference><el-button type="primary" size="small" plain>批量修改</el-button></template>
            </el-popover>
          </div>
          <el-row :gutter="20">
            <!-- 参考价：仅代理商显示 -->
            <el-col v-if="custType === '2'" :span="12">
              <div class="tbl-title">参考价</div>
              <el-table :data="tableUpper" :span-method="tableUpperSpanMethod" border size="small" max-height="440">
                <el-table-column label="收费项目" prop="name" width="130" show-overflow-tooltip />
                <el-table-column label="计费方式" width="90"><template #default="{ row }">{{ formatType(row.type) }}</template></el-table-column>
                <el-table-column label="计费配置" width="120"><template #default="{ row }">{{ cellConfig(row) }}</template></el-table-column>
                <el-table-column label="价格" prop="price" min-width="90" />
                <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
              </el-table>
            </el-col>
            <el-col :span="custType === '2' ? 12 : 24">
              <div class="tbl-title">标准价</div>
              <el-table :data="tableData" :span-method="tableDataSpanMethod" border size="small" max-height="440">
                <el-table-column label="收费项目" prop="name" width="130" show-overflow-tooltip />
                <el-table-column label="计费方式" width="90"><template #default="{ row }">{{ formatType(row.type) }}</template></el-table-column>
                <el-table-column label="计费配置" width="120"><template #default="{ row }">{{ cellConfig(row) }}</template></el-table-column>
                <el-table-column label="价格" min-width="120">
                  <template #default="{ row }">
                    <el-input-number v-if="(isEdit || isAdd) && !((row.type === '5' || row.type === '6') && !row.cellValue)" v-model="row.price" :controls="false" :min="0" :max="999999" :precision="2" size="small" style="width: 100%" />
                    <span v-else>{{ row.price }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="最低收费" min-width="120">
                  <template #default="{ row }">
                    <el-input-number v-if="(isEdit || isAdd) && !((row.type === '5' || row.type === '6') && !row.cellValue)" v-model="row.minCharge" :controls="false" :min="0" :max="999999" :precision="2" size="small" style="width: 100%" />
                    <span v-else>{{ row.minCharge }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" min-width="140">
                  <template #default="{ row }">
                    <el-input v-if="isEdit || isAdd" v-model="row.remark" maxlength="100" size="small" />
                    <span v-else>{{ row.remark }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
        </div>
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗 -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="auditing">
          <el-radio-group v-model="auditForm.auditing"><el-radio :value="4">通过</el-radio><el-radio :value="3">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.auditing === 3" label="拒绝原因：" prop="reason">
          <el-input v-model="auditForm.reason" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>

    <!-- 关联代理商/客户 穿梭框 -->
    <RelevanceTransfer
      v-model="dialogCompany"
      :title="isLabelValue"
      :loading="selectLoading"
      :company-list="companyList"
      :selected="selectForm.associatedAgents"
      :show-footer="isEdit || isAdd"
      @save="saveCompany"
    />

    <!-- 供应商报价浮层：仅SYSTEM（custType 0） -->
    <div v-show="isRightShow && custType === '0' && can('quotation')" class="agent-price" @click="showAgentPrice">
      <el-tooltip effect="dark" content="供应商报价" placement="top"><el-icon><Money /></el-icon></el-tooltip>
    </div>
    <AgentPriceDialog ref="agentPriceRef" :fetch-supplier="warehouseApi.supplier" />
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ArrowDown, Money } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import RelevanceTransfer from './components/RelevanceTransfer.vue'
import AgentPriceDialog from './components/AgentPriceDialog.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import {
  warehouseApi, AUDIT_NUM_LIST, SETTLEMENT_LIST, lookup,
  getWarehouseOptions, getWarehouseChargeConfig, getCustTypeOptions
} from '@/api/modules/price'

defineOptions({ name: 'PriceWarehouse' })
const { can } = usePagePerms()

// 当前登录用户客户类型（mock：SYSTEM '0'，与其它价格页一致）
const custType = '0'

const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const popoverShow = ref(false)
const searchForm = reactive({ warehouseId: undefined, auditing: undefined, ifStandard: undefined, times: [] })
const warehouseList = ref([])
const warehouseSelList = ref([])

const auditDot = a => (a === 1 ? 'card-tip-blue' : a === 2 ? 'card-tip-y' : a === 3 ? 'card-tip-red' : 'card-tip-success')
const custTag = item => { const t = item.toCustType; const s = item.toCustSubtype; if (t === '2') return '代理商价'; if (t === '1' && s === '0') return '直客价'; if (t === '1' && s === '1') return '同行价'; if (t === '0') return 'SYSTEM价'; return '' }
const formatType = t => lookup(SETTLEMENT_LIST, t)
const cellConfig = row => { if (row.type === '5' || row.type === '6') return row.cellName || '--'; if (row.min != null && row.max != null) return `${row.min}-${row.max}`; return '单位单价' }
const umWeightLabel = v => ({ T: 'T-吨', LBS: 'LB-磅', KGS: 'KG-公斤', OZS: 'OZ-盎' }[v] || v || '--')
const umLengthLabel = v => ({ FT: 'FT-英尺', M: 'M-米', CM: 'CM-厘米' }[v] || v || '--')

const getTableData = async (p) => {
  if (p === 1) { page.value = 1; popoverShow.value = false }
  cardLoading.value = true
  try {
    const res = await warehouseApi.getList({
      warehouseId: searchForm.warehouseId, auditing: searchForm.auditing, ifStandard: searchForm.ifStandard,
      startTime: (searchForm.times || [])[0], endTime: (searchForm.times || [])[1],
      page: page.value, size: size.value
    })
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const handleClear = () => { searchForm.times = [] }
const handleConfirm = () => { popoverShow.value = false; getTableData(1) }

const getWarehouseList = async () => { const res = await getWarehouseOptions(); warehouseList.value = res.data }
const getWarehouseSel = async () => { const res = await getWarehouseOptions(); warehouseSelList.value = res.data.filter(o => o.status === '1') }

/* ------- 右侧 ------- */
const editForm = ref(null)
const formLoading = ref(false)
const selectLoading = ref(false)
const isRightShow = ref(false)
const isTableShow = ref(false)
const isEdit = ref(false)
const isAdd = ref(false)
const isHistory = ref(false)
const currentId = ref('')
const historyId = ref('')
const historyList = ref([])
const effectList = ref([])
const timeList = ref([])
const custList = ref([])

// 收费项目价格表
const tableData = ref([])
const tableUpper = ref([])
// span 数组（源 spanArr1/2 与 divArr1/2）
let spanArr1 = []; let spanArr2 = []
let divArr1 = []; let divArr2 = []

const defaultSelectForm = () => ({ id: undefined, warehouseId: undefined, warehouseName: undefined, refId: undefined, toCustSubtype: undefined, toCustType: undefined, umWeight: undefined, umLength: undefined, currencyId: undefined, currencyName: undefined, ifStandard: true, refStandard: undefined, auditing: undefined, effective: undefined, reason: '', associatedAgents: [], times: [] /*, floorPrice: undefined */ })
const selectForm = reactive(defaultSelectForm())

const isLabelValue = computed(() => {
  if (custType === '0') return '关联代理商'
  if (custType === '2') return selectForm.toCustSubtype === '2' ? '关联代理商' : '关联客户'
  return '关联客户'
})

const formRules = {
  warehouseId: [required('请选择仓库', 'change')],
  refId: [required('请选择参考报价', 'change')],
  ifStandard: [required('请选择价格标准', 'change')],
  times: [required('请选择有效时间', 'change')],
  refStandard: [required('请选择有效时间', 'change')]
}

// span 构建（源 getSpanArr/getDivArr，保留 arr2 在“同名不同计费方式”分支不 push 的原始怪异行为）
const buildSpan = (data, arr1, arr2) => {
  arr1.length = 0; arr2.length = 0
  let num1 = 0; let num2 = 0
  data.forEach((row, i) => {
    if (i === 0) { arr1.push(1); num1 = 0; arr2.push(1); num2 = 0 }
    else if (row.name === data[i - 1].name) {
      arr1[num1] += 1; arr1.push(0)
      if (row.type === data[i - 1].type) { arr2[num2] += 1; arr2.push(0) }
    } else { arr1.push(1); num1 = i; arr2.push(1); num2 = i }
  })
}
const makeSpanMethod = (arr1, arr2) => ({ columnIndex, rowIndex }) => {
  if (columnIndex === 0) { const r = arr1[rowIndex]; return { rowspan: r, colspan: r > 0 ? 1 : 0 } }
  if (columnIndex === 1) { const r = arr2[rowIndex] || 0; return { rowspan: r, colspan: r > 0 ? 1 : 0 } }
}
const tableDataSpanMethod = makeSpanMethod(spanArr1, spanArr2)
const tableUpperSpanMethod = makeSpanMethod(divArr1, divArr2)
const rebuildSpans = () => { buildSpan(tableData.value, spanArr1, spanArr2); buildSpan(tableUpper.value, divArr1, divArr2) }

const resetForm = () => {
  Object.assign(selectForm, defaultSelectForm())
  tableData.value = []; tableUpper.value = []
  spanArr1.length = 0; spanArr2.length = 0; divArr1.length = 0; divArr2.length = 0
  currentId.value = ''; historyId.value = ''
  isHistory.value = false; isRightShow.value = false; isTableShow.value = false; isEdit.value = false; isAdd.value = false
  editForm.value?.clearValidate()
}
const addPrice = () => { resetForm(); isRightShow.value = true; isAdd.value = true; getWarehouseSel() }

const onRow = async (item, isCopy = false) => {
  if (!can('get') && !can('copy')) return
  resetForm(); isRightShow.value = true; isTableShow.value = true; isAdd.value = isCopy; formLoading.value = true
  try {
    const res = await warehouseApi.getById(item.id)
    const d = res.data || {}
    currentId.value = isCopy ? '' : d.id
    Object.assign(selectForm, {
      id: isCopy ? undefined : d.id, warehouseId: d.warehouseId, warehouseName: d.warehouseName, refId: d.refId,
      toCustSubtype: d.toCustSubtype, toCustType: d.toCustType,
      umWeight: d.umWeight, umLength: d.umLength, currencyId: d.currencyId, currencyName: d.currencyName,
      ifStandard: d.ifStandard, auditing: d.auditing, effective: d.effective, reason: d.reason,
      associatedAgents: (d.associatedAgents || []).map(it => it.id || it),
      times: !isCopy && d.startTime ? [`${d.startTime} 00:00:00`, `${d.endTime} 23:59:59`] : []
    })
    tableData.value = (d.priceList || []).map(r => ({ ...r }))
    if (custType === '2') tableUpper.value = (d.priceList || []).map(r => ({ ...r }))
    rebuildSpans()
    if (isCopy) getWarehouseSel()
  } finally { formLoading.value = false }
}

// 仓库切换：拉取收费项目配置 + 单位
const onService = async () => {
  const wh = warehouseSelList.value.find(o => o.id === selectForm.warehouseId) || {}
  selectForm.warehouseName = wh.name
  selectForm.umWeight = 'KGS'; selectForm.umLength = 'CM'; selectForm.currencyId = 'RMB'; selectForm.currencyName = '人民币'
  const res = await getWarehouseChargeConfig()
  tableData.value = res.data.map(r => ({ ...r }))
  isTableShow.value = true
  rebuildSpans()
  if (custType === '2') { effectList.value = []; selectForm.refId = undefined }
}
const onEffect = async () => {
  if (!selectForm.refId) return
  const res = await warehouseApi.getById(selectForm.refId)
  const d = res.data || {}
  tableUpper.value = (d.priceList || []).map(r => ({ ...r }))
  rebuildSpans()
}
const onType = () => {}
const onMode = () => { if (selectForm.ifStandard) { selectForm.refStandard = undefined } else { selectForm.times = [] } }

const editRow = () => { isEdit.value = true }
const cancelRow = async () => { const id = currentId.value; resetForm(); if (id) await onRow({ id }) }

/* ------- 审核 ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ auditing: 4, reason: undefined })
const auditRules = { auditing: [required('请选择审核状态', 'change')], reason: [required('请输入拒绝原因')] }
const onShow = async () => {
  if (selectForm.auditing === 1) { await warehouseApi.audit({ tag: 2, id: currentId.value, reason: '' }); selectForm.auditing = 2; getTableData() }
  Object.assign(auditForm, { auditing: 4, reason: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { auditing: undefined, reason: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.auditing === 3 && !auditForm.reason) return ElMessage.error('请输入拒绝原因')
  selectLoading.value = true
  try { await warehouseApi.audit({ tag: auditForm.auditing, id: currentId.value, reason: auditForm.reason }); ElMessage.success('审核成功'); onHide(); getTableData(); resetForm() }
  finally { selectLoading.value = false }
}

/* ------- 失效/删除/复制/历史 ------- */
const invalidPrice = () => {
  ElMessageBox.confirm('该操作会使此报价及相关代理报价失效，请确认是否操作?', '温馨提示', { type: 'warning' }).then(async () => {
    await warehouseApi.invalid(currentId.value); ElMessage.success('操作成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const deleteRow = (tag, row) => {
  const id = tag === 1 ? currentId.value : row.id
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await warehouseApi.remove(id); ElMessage.success('删除成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const copyPrice = () => { onRow({ id: currentId.value }, true) }
const onHistory = async val => { if (!val) return; isHistory.value = true; await onRow({ id: val }) }

/* ------- 关联代理商/客户 ------- */
const dialogCompany = ref(false)
const companyList = ref([])
const onCompany = async () => {
  const res = await getCustTypeOptions()
  companyList.value = res.data
  dialogCompany.value = true
}
const saveCompany = ids => { selectForm.associatedAgents = ids }

/* ------- 特殊报价有效时间 ------- */
const getTimeList = async () => { const res = await warehouseApi.standardPeriod(); timeList.value = res.data }

/* ------- 批量修改（custType 2） ------- */
const batchShow = ref(false)
const batchNum = ref(undefined)
const batchConfirm = tag => {
  if (tag === 0) { tableData.value.forEach((it, i) => { it.price = tableUpper.value[i] ? tableUpper.value[i].price : it.price }); batchNum.value = undefined }
  else {
    const n = Number(batchNum.value) || 0
    tableData.value.forEach((it, i) => { const base = tableUpper.value[i] ? Number(tableUpper.value[i].price) : Number(it.price) || 0; if (it.type === '1') it.price = Number((base + n).toFixed(2)) })
  }
  batchShow.value = false
}

/* ------- 保存 ------- */
const saveRow = async () => {
  await editForm.value.validate()
  if (!tableData.value.length) return ElMessage.error('暂未配置，无法报价')
  if (tableData.value.every(it => !it.price && it.price !== 0)) return ElMessage.error('请至少填写一条报价')
  if (selectForm.ifStandard === false && (!selectForm.associatedAgents || !selectForm.associatedAgents.length)) return ElMessage.error('请选择关联代理商')
  formLoading.value = true
  try {
    let startTime; let endTime
    if (selectForm.ifStandard) { startTime = (selectForm.times || [])[0]; endTime = (selectForm.times || [])[1] }
    else { const t = timeList.value.find(x => x.id === selectForm.refStandard) || {}; startTime = t.startTime ? `${t.startTime} 00:00:00` : undefined; endTime = t.endTime ? `${t.endTime} 23:59:59` : undefined }
    const toCustType = custType === '0' ? '2' : custType === '2' ? (selectForm.toCustSubtype === '2' ? '2' : '1') : (selectForm.toCustSubtype === '-1' ? '0' : '1')
    const payload = {
      id: selectForm.id, warehouseId: selectForm.warehouseId, warehouseName: selectForm.warehouseName,
      refId: selectForm.refId, toCustType, toCustSubtype: custType === '0' ? '1' : selectForm.toCustSubtype,
      ifStandard: selectForm.ifStandard, refStandard: selectForm.refStandard,
      umWeight: selectForm.umWeight, umLength: selectForm.umLength, currencyId: selectForm.currencyId, currencyName: selectForm.currencyName,
      auditing: selectForm.auditing === 3 ? 1 : (selectForm.auditing || 1), effective: selectForm.effective || 1,
      startTime: (startTime || '').slice(0, 10), endTime: (endTime || '').slice(0, 10),
      associatedAgents: (selectForm.associatedAgents || []).map(id => { const a = companyList.value.find(x => x.id === id) || {}; return { id, name: a.name } }),
      priceList: tableData.value
    }
    await warehouseApi.save(payload)
    ElMessage.success('保存成功'); resetForm(); getTableData()
  } finally { formLoading.value = false }
}

const onMenu = ({ action, row }) => { if (action === 'copy') onRow(row, true); else if (action === 'view') onRow(row); else if (action === 'delete') deleteRow(2, row) }

/* ------- 供应商报价 ------- */
const agentPriceRef = ref(null)
const showAgentPrice = () => { if (!selectForm.warehouseId) return ElMessage.warning('请选择仓库'); agentPriceRef.value?.show({ id: currentId.value, warehouseId: selectForm.warehouseId }) }

getWarehouseList(); getTableData()
</script>

<style scoped lang="scss">
.pl-wrap { display: flex; flex-flow: row nowrap; min-height: inherit; }
.pl-main { flex: 1; overflow: auto; margin-left: 12px; background: $bg-card; border-radius: $card-radius; padding: 20px; }
.pl-search :deep(.el-form-item) { display: inline-block; vertical-align: top; width: 50%; padding-right: 4px; margin-bottom: 10px; }
.pl-filter :deep(.el-form-item) { margin-bottom: 10px; }
.pl-form :deep(.el-form-item) { display: inline-block; vertical-align: top; }
.item-read { background: #eaeef4; padding: 5px 10px; margin: 10px 0; :deep(.el-form-item) { margin-bottom: 0; } }
.tbl-title { font-size: 13px; color: $text-secondary; margin-bottom: 6px; }
.card-tips { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
.card-tip-blue { background: #2291e6; }
.card-tip-y { background: #ff7d19; }
.card-tip-red { background: #e12e2e; }
.card-tip-success { background: #189800; }
.word-limit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-tip-green { color: #189800; background: rgba(24, 152, 0, .2); padding: 2px; border-radius: 2px; }
.btn-tip-blue { color: #2291e6; background: rgba(34, 145, 230, .2); padding: 2px; border-radius: 2px; }
.btn-tip-grey { color: #909399; background: rgba(144, 147, 153, .2); padding: 2px; border-radius: 2px; }
.agent-price { width: 40px; height: 40px; background: rgba(34, 145, 230, .13); border-radius: 4px; position: fixed; right: 60px; bottom: 100px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: $primary-color; font-size: 22px; z-index: 20; }
</style>