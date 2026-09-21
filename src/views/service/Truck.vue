<template>
  <div>
    <!-- 头部（编辑表单时隐藏） -->
    <div v-if="!addEditFormShow">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.addressCategory" placeholder="地址类别" filterable clearable style="width: 100px">
            <el-option v-for="item in ADDRESS_CATEGORY_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.addressType" placeholder="目的地类型" filterable clearable style="width: 120px">
            <el-option v-for="item in TRUCK_ADDRESS_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.countryId" placeholder="所在国家" filterable clearable style="width: 130px" @change="onCountry">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.stateId" :disabled="!query.countryId" placeholder="州/省" filterable clearable style="width: 130px" @focus="loadState" @change="onState">
            <el-option v-for="item in stateList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.cityId" :disabled="!query.stateId" placeholder="城市" filterable clearable style="width: 130px" @focus="loadCity">
            <el-option v-for="item in cityList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.subtypeId" placeholder="服务类型" filterable clearable style="width: 110px">
            <el-option v-for="item in TRUCK_SUBTYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 280px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option v-for="item in SELECT_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="CirclePlus" :disabled="!can('add')" @click="openAdd">新增服务</el-button>
          <!-- 源 v-if="false"：设置组合入口默认隐藏 -->
          <el-button v-if="false" type="primary" :icon="EditPen" @click="openGroup">设置组合</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
          <!-- 计费设置：priceType '0'→设置车型；'1'/'2'→设置区间 -->
          <template #col-charging="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.x ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button v-if="row.priceType === '0'" link type="primary" size="small" @click="handleRelevance(row, '0')">设置车型</el-button>
              <el-button v-else-if="row.priceType === '1' || row.priceType === '2'" link type="primary" size="small" @click="handleRelevance(row, row.priceType)">设置区间</el-button>
              <span v-else>--</span>
            </div>
          </template>
          <!-- 目的地：addressType!=='4'→目的地；'4'→设置里程区间 -->
          <template #col-destination="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.y ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button v-if="row.addressType !== '4'" link type="primary" size="small" @click="handleAddress(row)">目的地</el-button>
              <el-button v-else link type="primary" size="small" @click="handleRelevance(row, '3')">设置里程区间</el-button>
            </div>
          </template>
          <template #col-agent="{ row }">
            <el-button link type="primary" size="small" @click="handleAgent(row)">关联代理商</el-button>
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

    <!-- 内嵌新增/编辑表单 -->
    <TruckForm v-if="addEditFormShow" :is-edit="isEdit" :is-copy="isCopy" :row="editRow" :country-list="countryList" :sub-type-list="TRUCK_SUBTYPE_LIST" @back="addEditFormShow = false" @save-success="onSaved" />

    <!-- 关联代理商 -->
    <RelevanceTransfer v-model="agentDlg.visible" :title="agentDlg.title" :titles="['选择关联代理商', '已关联代理商']" :company-list="agentList" :selected="agentDlg.selected" @save="saveAgent" />

    <!-- 设置车型 / 设置区间 / 目的地 -->
    <TruckSetCar ref="setCarRef" @saved="loadData" />
    <TruckSetSection ref="setSectionRef" @saved="loadData" />
    <TruckPurposeSet ref="purposeSetRef" :country-list="countryList" @load="loadData" />

    <!-- 设置服务组合（源命令行按钮隐藏，弹窗保留） -->
    <Modal v-model="groupDlg.visible" title="设置服务组合" width="960px" :footer="false">
      <TruckSet v-if="groupDlg.visible" :sub-type-list="TRUCK_SUBTYPE_LIST" />
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus, EditPen } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import TruckForm from './components/truck-form.vue'
import TruckSetCar from './components/truck-set-car.vue'
import TruckSetSection from './components/truck-set-section.vue'
import TruckPurposeSet from './components/truck-purpose-set.vue'
import TruckSet from './components/truck-set.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import {
  truckApi, getCountryList, getStateByCountry, getCityByState,
  ADDRESS_CATEGORY_LIST, TRUCK_ADDRESS_TYPE_LIST, TRUCK_SUBTYPE_LIST, SELECT_TYPE_LIST
} from '@/api/modules/service'

defineOptions({ name: 'SvcTruck' })
const { can } = usePagePerms()

const fetchList = (p = {}) => {
  const params = {
    page: p.page, size: p.size,
    addressCategory: p.addressCategory, addressType: p.addressType,
    countryId: p.countryId, subtypeId: p.subtypeId
  }
  if (p.selectType === '1') params.code = p.keyword
  else if (p.selectType === '2') params.name = p.keyword
  return truckApi.list(params)
}
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, {
  addressCategory: '', addressType: '', countryId: '', stateId: '', cityId: '', subtypeId: '', keyword: '', selectType: '1'
})

const columns = [
  { prop: 'name', label: '服务名称', minWidth: 160, fixed: 'left' },
  { prop: 'ksId', label: '服务编码', minWidth: 200, fixed: 'left', showOverflowTooltip: true },
  { prop: 'abbr', label: '服务简称', minWidth: 140 },
  { prop: 'subtypeName', label: '服务类型', minWidth: 140 },
  { prop: 'charging', label: '计费设置', width: 130 },
  { prop: 'destination', label: '目的地', width: 140 },
  { prop: 'agent', label: '关联代理商', width: 130 },
  { prop: 'createTime', label: '添加时间', minWidth: 160 },
  { prop: 'status', label: '启用状态', width: 150, align: 'center', fixed: 'right' }
]

/* 筛选下拉级联 */
const countryList = ref([])
const stateList = ref([])
const cityList = ref([])
const loadState = async () => { if (query.countryId) stateList.value = (await getStateByCountry(query.countryId)).data }
const loadCity = async () => { if (query.stateId) cityList.value = (await getCityByState(query.stateId)).data }
const onCountry = () => { query.stateId = ''; query.cityId = ''; stateList.value = []; cityList.value = [] }
const onState = () => { query.cityId = ''; cityList.value = [] }

onMounted(async () => { countryList.value = (await getCountryList()).data })

/* 新增/编辑/复制 内嵌表单 */
const addEditFormShow = ref(false)
const isEdit = ref(false)
const isCopy = ref(false)
const editRow = ref(null)
const openAdd = () => { isEdit.value = false; isCopy.value = false; editRow.value = null; addEditFormShow.value = true }
const openEdit = row => { isEdit.value = true; isCopy.value = false; editRow.value = { ...row }; addEditFormShow.value = true }
const openCopy = row => { isEdit.value = true; isCopy.value = true; editRow.value = { ...row }; addEditFormShow.value = true }
const onSaved = () => { addEditFormShow.value = false; loadData() }

/* 关联代理商 */
const agentList = ref([])
const agentDlg = reactive({ visible: false, title: '', selected: [], id: null })
const handleAgent = async row => {
  agentList.value = (await truckApi.getAgents(row.subtypeId)).data
  agentDlg.selected = (await truckApi.getAgentById(row.id)).data
  agentDlg.title = `关联代理商【${row.name}】`
  agentDlg.id = row.id
  agentDlg.visible = true
}
const saveAgent = async ids => { await truckApi.saveAgent(agentDlg.id, ids); ElMessage.success('保存成功'); loadData() }

/* 计费设置：车型 / 区间 / 里程区间 */
const setCarRef = ref()
const setSectionRef = ref()
const handleRelevance = (row, type) => {
  if (type === '0') setCarRef.value.showModel(row)
  else setSectionRef.value.showModel(row, type)
}

/* 目的地 */
const purposeSetRef = ref()
const handleAddress = row => purposeSetRef.value.setData(row)

/* 设置服务组合（隐藏入口） */
const groupDlg = reactive({ visible: false })
const openGroup = () => { groupDlg.visible = true }

/* 启用/禁用（STRING '1'/'0'，源二态守卫） */
const onStatus = (row, val) => {
  const olds = String(row.status); const news = String(val)
  if (!olds || olds === news) return
  const text = news === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该卡派服务，是否继续？`, '提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await truckApi.changeStatus(row.id, val); ElMessage.success('修改成功'); loadData() })
    .catch(() => loadData())
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await truckApi.res.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.cfg-dot { font-size: 30px; margin-right: 5px; font-weight: bold; line-height: 1; }
</style>
