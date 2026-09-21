<template>
  <div>
    <!-- 订舱服务：列表视图 / 内嵌编辑表单（源 v-show 同页切换） -->
    <div v-show="!editShow">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.conveyance" placeholder="业务类型" clearable style="width: 130px" @change="onSVTool">
            <el-option v-for="item in CONVEYANCE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.countryFromId" placeholder="起运国" filterable clearable style="width: 130px" @change="query.portFrom = ''">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.portFrom" :disabled="!query.conveyance || !query.countryFromId" placeholder="起运港" clearable filterable style="width: 130px" @focus="loadStartPort">
            <el-option v-for="item in startPortList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.countryToId" placeholder="目的国" filterable clearable style="width: 130px" @change="query.portsToId = ''">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.portsToId" :disabled="!query.conveyance || !query.countryToId" placeholder="目的港" clearable filterable style="width: 130px" @focus="loadEndPort">
            <el-option v-for="item in endPortList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.transType" :disabled="!query.conveyance" placeholder="服务类型" clearable style="width: 130px">
            <el-option v-for="item in svTypes" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="请输入内容" clearable class="input-with-select" style="width: 280px">
            <template #prepend>
              <el-select v-model="selectType" style="width: 120px">
                <el-option label="服务编码" value="1" />
                <el-option label="航线名称" value="2" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="CirclePlus" :disabled="!can('add')" @click="openAdd">新增服务</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
          <template #col-conveyance="{ row }">{{ lookup(CONVEYANCE_LIST, row.conveyance) }}</template>
          <template #col-transType="{ row }">{{ formatTrans(row.transType) }}</template>
          <template #col-trans="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.transConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" :disabled="!can('view')" @click="showServiceLine(row)">航线服务商</el-button>
            </div>
          </template>
          <template #col-chargeSide="{ row }">
            <div v-if="isChargeSide(row.transType)" style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.axisRangeConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" :disabled="!can('edit')" @click="onChargeSide(row)">设置计费区间</el-button>
            </div>
            <span v-else>--</span>
          </template>
          <template #col-chargeType="{ row }">
            <div v-if="isChargeType(row.transType)" style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.axisTypeConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" :disabled="!can('edit')" @click="onChargeType(row)">设置计费类型</el-button>
            </div>
            <span v-else>--</span>
          </template>
          <template #col-agent="{ row }">
            <!-- 源航线代理商配置状态点 v-if="agentConfiged" 已注释，仅保留按钮 -->
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="showServiceAgent(row)">航线代理商</el-button>
          </template>
          <template #col-status="{ row }">
            <el-switch :model-value="normalizeSwitchValue(row.status)" active-value="1" inactive-value="0" active-text="启用" inactive-text="禁用" :disabled="!can('edit')" @change="v => onStatus(row, v)" />
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('add')" @click="openCopy(row)">复制</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>

    <!-- 内嵌编辑表单 -->
    <BookingForm v-if="editShow" :is-edit="isEdit" :is-copy="isCopy" :row="editRow" :tools="tools" @back="editShow = false" @save-success="onSaved" />

    <!-- 计费区间/类型弹窗 -->
    <BookingChargeDialog ref="chargeDialog" @saved="loadData" />

    <!-- 航线服务商弹窗（1200px） -->
    <Modal v-model="airlineVisible" :title="airlineTitle" width="1200px" :footer="false">
      <AirlineServiceProvider v-if="airlineVisible" :st-id="airlineStId" :country-service="airlineCountries" :bs-id="airlineBsId" />
    </Modal>

    <!-- 关联代理商穿梭框 -->
    <RelevanceTransfer v-model="agentDlg.visible" :title="agentDlg.title" :company-list="agentList" :selected="agentDlg.selected" @save="saveAgent" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import BookingForm from './components/booking-form.vue'
import BookingChargeDialog from './components/booking-charge-dialog.vue'
import AirlineServiceProvider from './components/airline-service-provider.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import {
  bookingApi, getCountryList, getPortList, getBookingSvTypes, getServiceSubtypeList,
  getAgentOptions, CONVEYANCE_LIST, TRANS_TYPE_LIST, lookup
} from '@/api/modules/service'

defineOptions({ name: 'SvcBooking' })
const { can } = usePagePerms()

const selectType = ref('1')
const fetchList = (p = {}) => {
  const params = {
    page: p.page, size: p.size, conveyance: p.conveyance,
    countryFromId: p.countryFromId, countryToId: p.countryToId, transType: p.transType
  }
  if (selectType.value === '1') params.serviceCode = p.keyword
  else params.name = p.keyword
  return bookingApi.list(params)
}
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, {
  keyword: '', conveyance: '', countryFromId: '', countryToId: '', portFrom: '', portsToId: '', transType: ''
})

const columns = [
  { prop: 'name', label: '航线名称', minWidth: 150, fixed: 'left', showOverflowTooltip: true },
  { prop: 'serviceCode', label: '服务编码', minWidth: 120, fixed: 'left' },
  { prop: 'conveyance', label: '业务类型', width: 100 },
  { prop: 'transType', label: '服务类型', width: 100 },
  { prop: 'alias', label: '航线简称', minWidth: 120, showOverflowTooltip: true },
  { prop: 'countryFromName', label: '起运国', minWidth: 120 },
  { prop: 'portsFromName', label: '起运港', minWidth: 200, showOverflowTooltip: true },
  { prop: 'countryToName', label: '目的国', minWidth: 120 },
  { prop: 'portsToName', label: '目的港', minWidth: 200, showOverflowTooltip: true },
  { prop: 'trans', label: '航线服务商', minWidth: 150 },
  { prop: 'chargeSide', label: '设置计费区间', width: 120 },
  { prop: 'chargeType', label: '设置计费类型', width: 120 },
  { prop: 'agent', label: '航线代理商', minWidth: 150 },
  { prop: 'status', label: '启用状态', width: 150, align: 'center', fixed: 'right' }
]

/* transType 多值格式化（源 formatTrans：按 , 拆分映射拼名，重复空格分隔） */
const formatTrans = type => {
  if (!type) return ''
  return String(type).split(',').map(it => lookup(TRANS_TYPE_LIST, it)).filter(Boolean).join(' ')
}
/* 计费区间：transType 含 1/3/5 时显示 */
const isChargeSide = type => String(type || '').split(',').some(it => it === '1' || it === '3' || it === '5')
/* 计费类型：transType 含 0/2/4 时显示 */
const isChargeType = type => String(type || '').split(',').some(it => it === '0' || it === '2' || it === '4')

/* 筛选下拉数据源 */
const countryList = ref([])
const svTypes = ref([])
const tools = ref([])
const startPortList = ref([])
const endPortList = ref([])
const loadStartPort = async () => { startPortList.value = (await getPortList(query.countryFromId, query.conveyance)).data }
const loadEndPort = async () => { endPortList.value = (await getPortList(query.countryToId, query.conveyance)).data }
const onSVTool = val => {
  query.transType = ''; query.portFrom = ''; query.portsToId = ''
  query.countryFromId = ''; query.countryToId = ''
  loadSvTypes(val)
}
const loadSvTypes = async val => { svTypes.value = (await getBookingSvTypes(val || '0')).data }

onMounted(async () => {
  countryList.value = (await getCountryList()).data
  tools.value = (await getServiceSubtypeList('02')).data.map(e => ({ ...e, value: e.id, label: e.name }))
  await loadSvTypes('0')
})

/* 内嵌编辑表单切换 */
const editShow = ref(false)
const isEdit = ref(false)
const isCopy = ref(false)
const editRow = ref(null)
const openAdd = () => { isEdit.value = false; isCopy.value = false; editRow.value = null; editShow.value = true }
const openEdit = row => { isEdit.value = true; isCopy.value = false; editRow.value = { ...row }; editShow.value = true }
const openCopy = row => { isEdit.value = true; isCopy.value = true; editRow.value = { ...row }; editShow.value = true }
const onSaved = () => { editShow.value = false; loadData() }

/* 启用状态开关（源 changeBookingStatus 仅传 id，切换二态） */
const onStatus = (row, val) => {
  if (!row.status || row.status === val) return
  const text = val === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该航线，是否继续？`, '提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await bookingApi.changeStatus(row.id); ElMessage.success('修改成功'); loadData() })
    .catch(() => loadData())
}

const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await bookingApi.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

/* 计费区间/类型弹窗 */
const chargeDialog = ref()
const onChargeSide = row => chargeDialog.value.openSide(row)
const onChargeType = row => chargeDialog.value.openType(row)

/* 航线服务商弹窗 */
const airlineVisible = ref(false)
const airlineTitle = ref('')
const airlineStId = ref('')
const airlineBsId = ref('')
const airlineCountries = ref([])
const showServiceLine = row => {
  airlineStId.value = row.conveyance
  airlineBsId.value = row.id
  airlineCountries.value = [row.countryFromId, row.countryToId]
  airlineTitle.value = `航线服务商 - ${row.name}`
  airlineVisible.value = true
}

/* 关联代理商 */
const agentList = ref([])
const agentDlg = reactive({ visible: false, title: '', selected: [], id: null })
const showServiceAgent = async row => {
  agentList.value = (await getAgentOptions()).data
  agentDlg.selected = (await bookingApi.getAgentById(row.id)).data
  agentDlg.title = `关联代理商【${row.name}】`
  agentDlg.id = row.id
  agentDlg.visible = true
}
const saveAgent = async ids => { await bookingApi.saveAgent(agentDlg.id, ids); ElMessage.success('保存成功'); loadData() }
</script>

<style scoped>
.cfg-dot { font-size: 30px; margin-right: 5px; font-weight: bold; line-height: 1; }
</style>
