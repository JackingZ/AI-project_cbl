<template>
  <div>
    <!-- 头部（子视图显示返回） -->
    <div v-if="startLocationFlag || endLocationFlag || distinctFlag" class="head-info-back">
      <span class="title">{{ subViewTitle }}</span>
      <el-button type="primary" size="small" @click="goBack">返 回</el-button>
    </div>

    <!-- 列表视图 -->
    <div v-show="!addEditFormShow && !(startLocationFlag || endLocationFlag || distinctFlag)">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.countryId" placeholder="起运国" filterable clearable style="width: 130px" @change="onCountry">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.expressId" :disabled="!query.countryId" placeholder="快递公司" filterable clearable style="width: 130px" @focus="loadExpress">
            <el-option v-for="item in orgIdList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.subtypeId" placeholder="服务类型" filterable clearable style="width: 140px">
            <el-option v-for="item in EXPRESS_SUBTYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.name" placeholder="请输入服务名称" clearable style="width: 200px" />
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="CirclePlus" :disabled="!can('add')" @click="openAdd">新增服务</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
          <template #col-subtypeId="{ row }">{{ lookup(EXPRESS_SUBTYPE_LIST, row.subtypeId) }}</template>
          <!-- 起运地代码：仅 subtypeId '0' 本地快递显示状态点 + 设置代码 -->
          <template #col-startCode="{ row }">
            <div v-if="row.subtypeId === '0'" style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.zonesConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="setUpCode(row)">设置代码</el-button>
            </div>
            <span v-else>--</span>
          </template>
          <!-- 目的地代码：'1'/'2' 国际分区；'0' 设置代码 -->
          <template #col-endCode="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.zonedConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button v-if="row.subtypeId === '1' || row.subtypeId === '2'" link type="primary" size="small" @click="setDist(row)">国际分区</el-button>
              <el-button v-else link type="primary" size="small" @click="setDownCode(row)">设置代码</el-button>
            </div>
          </template>
          <!-- 目的地/区域：仅 '0' 显示 -->
          <template #col-destination="{ row }">
            <div v-if="row.subtypeId === '0'" style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.destinationConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="setArea(row)">目的地/区域</el-button>
            </div>
            <span v-else>--</span>
          </template>
          <template #col-charging="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.chargingConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="setCharge(row)">设置计费</el-button>
            </div>
          </template>
          <template #col-address="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.addressConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="handleSpecial(row)">特殊配置</el-button>
            </div>
          </template>
          <template #col-agent="{ row }">
            <el-button link type="primary" size="small" @click="handleAgent(row)">关联代理商</el-button>
          </template>
          <template #col-status="{ row }">
            <el-switch :model-value="row.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" :disabled="!can('edit')" @change="v => onStatus(row, v)" />
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('add')" @click="openCopy(row)">复制</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>

    <!-- 内嵌子视图：起运地/目的地代码、国际分区 -->
    <ExpressLocationCode v-if="startLocationFlag" type="start" :local-data="subViewRow" />
    <ExpressLocationCode v-if="endLocationFlag" type="end" :local-data="subViewRow" />
    <ExpressDistinct v-if="distinctFlag" :local-data="subViewRow" />

    <!-- 内嵌新增/编辑表单 -->
    <ExpressForm v-if="addEditFormShow" :is-edit="isEdit" :is-copy="isCopy" :row="editRow" :country-list="countryList" :type-list="EXPRESS_SUBTYPE_LIST" @back="addEditFormShow = false" @save-success="onSaved" />

    <!-- 关联代理商 -->
    <RelevanceTransfer v-model="agentDlg.visible" :title="agentDlg.title" :company-list="agentList" :selected="agentDlg.selected" @save="saveAgent" />
    <!-- 排除仓库（特殊配置） -->
    <RelevanceTransfer v-model="specialDlg.visible" :title="specialDlg.title" :titles="['选择排除仓库', '已排除仓库']" :company-list="warehouseList" :selected="specialDlg.selected" @save="saveSpecial" />

    <!-- 目的地/区域 -->
    <Modal v-model="areaDlg.visible" :title="areaDlg.title" width="960px" :footer="false" @closed="closeArea">
      <div v-loading="areaDlg.loading">
        <el-row style="margin-bottom: 20px">
          <el-col :span="12" style="text-align: center">
            <span class="is-required">地址类型：</span>
            <el-select v-model="areaForm.yType" filterable clearable placeholder="请选择" style="width: 200px" @change="onAddress">
              <el-option v-for="item in EXPRESS_ADDRESS_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-col>
          <el-col v-if="areaForm.yType !== '0' && areaForm.yType !== '102'" :span="12" style="text-align: center">
            <span class="is-required">国家：</span>
            <el-select v-model="areaForm.countryId" clearable filterable placeholder="请选择" style="width: 200px" @change="onAreaCountry">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-col>
        </el-row>
        <el-transfer
          v-model="areaOptions"
          filterable
          :filter-method="filterMethod"
          :titles="[`选择${areaDlg.title}`, '已选择']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="areaList"
          style="height: 450px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button type="primary" size="small" @click="saveArea">保存</el-button>
        </div>
      </div>
    </Modal>

    <!-- 设置计费（重量区间） -->
    <Modal v-model="weightDlg.visible" :title="`选择重量区间  ${rangeText}`" width="960px" :footer="false" @closed="closeWeight">
      <div v-loading="weightDlg.loading">
        <el-form label-width="120px" label-position="right" size="small" class="dialog-form">
          <el-form-item label="重量范围" style="width: 80%; display: inline-block" class="is-required">
            <div v-for="(item, index) in weightSections" :key="index" class="item-after-icon">
              <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
              <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
              <span>
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addWeight"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="delWeight(index)"><RemoveFilled /></el-icon>
              </span>
            </div>
          </el-form-item>
        </el-form>
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button type="primary" size="small" @click="saveWeight">保存</el-button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { CirclePlus, RemoveFilled } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import ExpressForm from './components/express-form.vue'
import ExpressLocationCode from './components/express-location-code.vue'
import ExpressDistinct from './components/express-distinct.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import {
  expressApi, getCountryList, getExpressCompany, getAgentOptions, getWarehouseList,
  getAllAreaList, getRegionList, getStateByCountry,
  EXPRESS_SUBTYPE_LIST, EXPRESS_ADDRESS_LIST, lookup
} from '@/api/modules/service'

defineOptions({ name: 'SvcExpress' })
const { can } = usePagePerms()

const fetchList = (p = {}) => expressApi.list({
  page: p.page, size: p.size, countryId: p.countryId, expressId: p.expressId, subtypeId: p.subtypeId, name: p.name
})
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, {
  countryId: '', expressId: '', subtypeId: '', name: ''
})

const columns = [
  { prop: 'name', label: '服务名称', minWidth: 180, fixed: 'left' },
  { prop: 'expressCode', label: '服务编码', minWidth: 150, fixed: 'left' },
  { prop: 'abbr', label: '服务简称', minWidth: 150 },
  { prop: 'subtypeId', label: '服务类型', minWidth: 120 },
  { prop: 'startCode', label: '起运地代码', width: 130 },
  { prop: 'endCode', label: '目的地代码', width: 130 },
  { prop: 'destination', label: '目的地/区域', width: 130 },
  { prop: 'charging', label: '设置计费', width: 120 },
  { prop: 'address', label: '特殊配置', width: 120 },
  { prop: 'agent', label: '关联代理商', width: 150 },
  { prop: 'createTime', label: '添加时间', width: 180 },
  { prop: 'status', label: '启用状态', width: 120, align: 'center', fixed: 'right' }
]

/* 筛选下拉数据源 */
const countryList = ref([])
const orgIdList = ref([])
const loadExpress = async () => { orgIdList.value = (await getExpressCompany(query.countryId, '4')).data }
const onCountry = () => { query.expressId = '' }

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

/* 内嵌子视图（起运/目的地代码、国际分区） */
const startLocationFlag = ref(false)
const endLocationFlag = ref(false)
const distinctFlag = ref(false)
const subViewRow = ref(null)
const subViewTitle = computed(() => {
  const r = subViewRow.value || {}
  const tail = `${r.countryName || ''} - ${r.expressName || ''} - ${r.expressCode || ''}`
  if (startLocationFlag.value) return `起运地代码（${tail}）`
  if (endLocationFlag.value) return `目的地代码（${tail}）`
  if (distinctFlag.value) return `国际分区（${tail}）`
  return ''
})
const setUpCode = row => { subViewRow.value = { ...row }; startLocationFlag.value = true }
const setDownCode = row => { subViewRow.value = { ...row }; endLocationFlag.value = true }
const setDist = row => { subViewRow.value = { ...row }; distinctFlag.value = true }
const goBack = () => { startLocationFlag.value = false; endLocationFlag.value = false; distinctFlag.value = false; loadData() }

/* 关联代理商 */
const agentList = ref([])
const agentDlg = reactive({ visible: false, title: '', selected: [], id: null })
const handleAgent = async row => {
  agentList.value = (await getAgentOptions()).data
  agentDlg.selected = (await expressApi.getAgentById(row.id)).data
  agentDlg.title = `关联代理商【${row.name}】`
  agentDlg.id = row.id
  agentDlg.visible = true
}
const saveAgent = async ids => { await expressApi.saveAgent(agentDlg.id, ids); ElMessage.success('保存成功'); loadData() }

/* 特殊配置（排除仓库） */
const warehouseList = ref([])
const specialDlg = reactive({ visible: false, title: '', selected: [], id: null })
const handleSpecial = async row => {
  warehouseList.value = (await getWarehouseList((row.esEntity || {}).countryId)).data.map(w => ({ id: w.id, name: w.name }))
  specialDlg.selected = (await expressApi.getSpecialById(row.id)).data
  specialDlg.title = `排除仓库配置【${row.name}】`
  specialDlg.id = row.id
  specialDlg.visible = true
}
const saveSpecial = async ids => { await expressApi.saveSpecial(specialDlg.id, ids); ElMessage.success('保存成功'); loadData() }

/* 目的地/区域 */
const areaDlg = reactive({ visible: false, title: '地址类型', loading: false, id: null })
const areaForm = reactive({ yType: '0', countryId: '' })
const areaList = ref([])
const areaOptions = ref([])
const filterMethod = (q, item) => (item.name || '').indexOf(q) > -1
const setArea = async row => {
  areaDlg.id = row.id
  areaForm.yType = '0'
  areaForm.countryId = ''
  areaOptions.value = []
  areaDlg.visible = true
  await onAddress()
  const cfg = (await expressApi.getPriceConfig(row.id, 'Y')).data
  if (cfg) { areaForm.yType = cfg.yType || '0'; areaForm.countryId = cfg.countryId || ''; areaOptions.value = cfg.options || []; await onAreaCountry() }
}
const onAddress = async () => {
  areaOptions.value = []
  areaList.value = []
  areaForm.countryId = ''
  if (areaForm.yType === '0') areaList.value = (await getCountryList()).data
  else if (areaForm.yType === '102') areaList.value = (await getAllAreaList(2)).data
}
const onAreaCountry = async () => {
  const t = areaForm.yType
  if (t === '0') areaList.value = (await getCountryList()).data
  else if (t === '5') areaList.value = (await getRegionList(areaForm.countryId)).data
  else if (t === '1') areaList.value = (await getStateByCountry(areaForm.countryId)).data
  else if (t === '100') areaList.value = (await getAllAreaList(1, areaForm.countryId)).data
  else if (t === '102') areaList.value = (await getAllAreaList(2, areaForm.countryId)).data
  else { areaList.value = []; areaOptions.value = [] }
}
const saveArea = async () => {
  areaDlg.loading = true
  try {
    await expressApi.savePriceConfig(areaDlg.id, 'Y', { yType: areaForm.yType, countryId: areaForm.countryId, options: [...areaOptions.value] })
    ElMessage.success('保存成功')
    areaDlg.visible = false
    loadData()
  } finally {
    areaDlg.loading = false
  }
}
const closeArea = () => { areaForm.yType = '0'; areaForm.countryId = ''; areaList.value = []; areaOptions.value = [] }

/* 设置计费（重量区间） */
const rangeText = '(取值范围：>=起始值， <结束值)'
const weightDlg = reactive({ visible: false, loading: false, id: null })
const weightSections = ref([{ lower: undefined, upper: undefined }])
const setCharge = async row => {
  weightDlg.id = row.id
  weightSections.value = [{ lower: undefined, upper: undefined }]
  weightDlg.visible = true
  const cfg = (await expressApi.getPriceConfig(row.id, 'X')).data
  if (cfg && cfg.sections?.length) weightSections.value = cfg.sections
}
const addWeight = () => weightSections.value.push({ lower: undefined, upper: undefined })
const delWeight = index => weightSections.value.splice(index, 1)
const rangeValidate = range => {
  if (!range.every(item => (item.lower === 0 || item.lower) && item.upper)) { ElMessage.error('请完整填写区间值'); return false }
  if (range.some(item => item.upper <= item.lower)) { ElMessage.error('下限值不能大于等于上限值'); return false }
  let mixVal = false
  range.forEach((it, index) => {
    mixVal = range.some((r, i) => i !== index && ((r.lower <= it.lower && it.lower < r.upper) || (r.lower < it.upper && it.upper <= r.upper)))
  })
  if (mixVal) { ElMessage.error('区间范围不能重叠'); return false }
  for (let i = 1; i < range.length; i++) if (range[i].lower !== range[i - 1].upper) { ElMessage.error('区间范围必须连续'); return false }
  return true
}
const saveWeight = async () => {
  if (!rangeValidate(weightSections.value)) return
  weightDlg.loading = true
  try {
    await expressApi.savePriceConfig(weightDlg.id, 'X', { sections: weightSections.value.map(s => ({ ...s })) })
    ElMessage.success('保存成功')
    weightDlg.visible = false
    loadData()
  } finally {
    weightDlg.loading = false
  }
}
const closeWeight = () => { weightSections.value = [{ lower: undefined, upper: undefined }] }

/* 启用/禁用（NUMBER 1/0，源 handleSwitch 二态守卫） */
const onStatus = (row, val) => {
  const olds = String(row.status); const news = String(val)
  if (!olds || olds === news) return
  const text = news === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该快递服务，是否继续？`, '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await expressApi.changeStatus(row.id, val); ElMessage.success('更改成功'); loadData() })
    .catch(() => loadData())
}
/* 删除（源 changeStatus tag=delete，此处直删） */
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await expressApi.res.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.head-info-back {
  display: flex; align-items: center; justify-content: space-between;
  height: 50px; padding: 0 20px; border-bottom: 1px solid #ccc; margin-bottom: 10px;
  .title { font-size: 16px; color: #666; }
}
.cfg-dot { font-size: 30px; margin-right: 5px; font-weight: bold; line-height: 1; }
.dialog-form .el-form-item { margin-bottom: 10px; }
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
.item-after-icon {
  position: relative; padding-bottom: 15px;
  .item-icon-plus { position: absolute; top: 6px; color: #409eff; font-size: 18px; margin-left: 10px; cursor: pointer; }
  .item-icon-reduce { position: absolute; top: 6px; color: #f56c6c; font-size: 18px; margin-left: 10px; cursor: pointer; }
}
:deep(.el-transfer-panel) { width: 40%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
</style>
