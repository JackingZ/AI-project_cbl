<template>
  <div>
    <!-- 列表视图 -->
    <div v-show="addEditForm === 'index'">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.productId" placeholder="所属产品" filterable clearable style="width: 110px" @focus="loadProduct">
            <el-option v-for="item in productList" :key="item.id" :label="item.productName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.purpose" placeholder="服务用途" filterable clearable style="width: 110px">
            <el-option v-for="item in PURPOSE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.subtypeId" placeholder="服务类型" filterable clearable style="width: 110px" @change="onSubtype">
            <el-option v-for="item in subtypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="query.subtypeId === '1' || query.subtypeId === '2'">
          <el-select v-model="query.containerType" placeholder="业务类型" clearable style="width: 110px">
            <el-option v-for="item in CONTAINER_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="query.subtypeId === '1' || query.subtypeId === '2'">
          <el-select v-model="query.coverTank" placeholder="支持锁舱" clearable style="width: 110px">
            <el-option v-for="item in COVER_TANK_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.countryFromId" placeholder="起运国" filterable clearable style="width: 130px">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 源注释：起运港下拉默认隐藏
        <el-form-item>
          <el-select v-model="query.departureId" :disabled="!query.subtypeId || !query.countryFromId" placeholder="起运港" filterable clearable style="width: 130px">
            <el-option v-for="item in startPortList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item>
          <el-select v-model="query.countryId" placeholder="目的国" filterable clearable style="width: 130px">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.orgTag" placeholder="服务机构" filterable clearable style="width: 110px">
            <el-option v-for="item in ORG_TAG_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 源注释：目的港下拉默认隐藏
        <el-form-item>
          <el-select v-model="query.destinationId" :disabled="!query.subtypeId || !query.countryId || query.subtypeId === '3'" placeholder="目的港" filterable clearable style="width: 130px">
            <el-option v-for="item in endPortList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item>
          <el-select v-model="query.agentId" placeholder="关联代理商" filterable clearable style="width: 130px">
            <el-option v-for="item in agentsList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 源注释：商品属性筛选默认隐藏
        <el-form-item>
          <el-select v-model="query.category" placeholder="商品属性" clearable style="width: 110px">
            <el-option v-for="item in CATEGORY_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item>
          <el-select v-model="query.purposeType" placeholder="目的地类型" clearable style="width: 120px">
            <el-option v-for="item in PURPOSE_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.dispatch" placeholder="派件方式" clearable style="width: 110px">
            <el-option label="卡派" value="0" />
            <el-option label="快递" value="1" />
            <el-option v-if="query.subtypeId === '1' || query.subtypeId === '2'" label="整柜直送" value="3" />
            <el-option label="自提" value="2" />
            <el-option v-if="query.purposeType === 2" label="到仓" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.status" placeholder="启用状态" clearable style="width: 100px">
            <el-option v-for="item in STATUS_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.name" placeholder="请输入服务名称" clearable style="width: 200px" />
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="CirclePlus" :disabled="!can('add')" @click="openAdd">新增服务</el-button>
          <el-button type="primary" :icon="EditPen" @click="setServiceGroup">服务组</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
          <template #col-containerType="{ row }">{{ (CONTAINER_TYPE_LIST.find(t => t.id === row.containerType) || {}).name || '--' }}</template>
          <template #col-coverTank="{ row }">{{ row.coverTank === '1' ? '是' : row.coverTank === '0' ? '否' : '-' }}</template>
          <template #col-targets="{ row }">{{ formatTargetCountrys(row.targets) }}</template>
          <template #col-purposeType="{ row }">{{ (PURPOSE_TYPE_LIST.find(t => t.id === row.purposeType) || {}).name || '--' }}</template>
          <template #col-dispatch="{ row }">{{ DISPATCH_LIST[row.dispatch] || '--' }}</template>
          <template #col-examine="{ row }">{{ row.examine ? '是' : '否' }}</template>
          <template #col-area="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.ytag ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="onArea(row)">目的地/区域</el-button>
            </div>
          </template>
          <template #col-charge="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.xtag ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" @click="onCharge(row)">设置计费</el-button>
            </div>
          </template>
          <template #col-agent="{ row }">
            <el-button link type="primary" size="small" @click="handleAgent(row)">关联代理商</el-button>
          </template>
          <template #col-status="{ row }">
            <el-switch :model-value="normalizeSwitchValue(row.status)" active-value="1" inactive-value="0" active-text="启用" inactive-text="禁用" :disabled="!can('edit')" @change="v => handleSwitch(row, v)" />
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('add')" @click="handleCopy(row)">复制</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>

    <!-- 内嵌新增/编辑/复制表单 -->
    <PrivatelineForm
      v-if="addEditForm === 'addEditForm'"
      :is-edit="isEdit"
      :is-copy="isCopy"
      :row="editRow"
      :country-list="countryList"
      @back="addEditForm = 'index'"
      @confirm="saveConfirm"
    />

    <!-- 服务组（内嵌，源三态之一） -->
    <PrivatelineLineGroup v-if="addEditForm === 'group'" @back="addEditForm = 'index'" />

    <!-- 关联代理商 -->
    <Modal v-model="dialogAgent" :title="`关联代理商 【${agentTitle}】`" width="960px" :footer="false" @closed="closeAgent">
      <div v-loading="dialogLoading">
        <el-transfer
          v-model="selectAgents"
          filterable
          :filter-method="filterMethod"
          :titles="['选择关联代理商', '已关联代理商']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="agentList"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="closeAgent">取 消</el-button>
          <el-button type="primary" size="small" @click="confirmAgent">确 定</el-button>
        </div>
      </div>
    </Modal>

    <!-- 设置服务组合（源命令行按钮隐藏，弹窗保留） -->
    <Modal v-model="isGroupDialog" title="设置服务组合" width="960px" :footer="false">
      <PrivatelineSet v-if="isGroupDialog" />
    </Modal>

    <!-- 目的地/区域 & 设置计费（isType 1/2/3/4） -->
    <Modal v-model="dialogVisible" :title="`选择${title}`" width="960px" :footer="false" @closed="cancel">
      <p v-if="isType !== '1' && isType !== '3'" style="font-size: 14px; color: #606266; margin: 0 0 10px">{{ text }}</p>
      <div v-loading="dialogLoading">
        <el-form label-width="120px" label-position="right" size="small" class="dialog-form">
          <div v-show="isType === '1'">
            <el-form-item label="地址类型" class="is-required">
              <el-select v-model="dialogForm.yType" filterable clearable placeholder="请选择" style="width: 200px" @change="onAddress">
                <el-option v-for="item in addressList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="dialogForm.yType !== '0' && dialogForm.yType !== '102'" label="国家" class="is-required">
              <el-select v-model="dialogForm.countryId" clearable filterable placeholder="请选择" style="width: 200px" @change="onCountry">
                <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </div>
          <div v-show="isType === '2'" style="height: 400px; overflow-y: auto">
            <el-form-item label="区间范围" style="width: 80%" class="is-required">
              <div v-for="(item, index) in dialogForm.sections" :key="index" class="item-after-icon">
                <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
                <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
                <span>
                  <el-icon v-if="index === 0" class="item-icon-plus" @click="addRangeData"><CirclePlus /></el-icon>
                  <el-icon v-else class="item-icon-reduce" @click="deleteRangeData(index)"><RemoveFilled /></el-icon>
                </span>
              </div>
            </el-form-item>
          </div>
          <div v-show="isType === '4'" style="height: 400px; overflow-y: auto">
            <el-form-item label="重量范围" style="width: 80%; display: inline-block" class="is-required">
              <div v-for="(item, index) in dialogForm.sections1" :key="index" class="item-after-icon">
                <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
                <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
                <span>
                  <el-icon v-if="index === 0" class="item-icon-plus" @click="addRangeData1"><CirclePlus /></el-icon>
                  <el-icon v-else class="item-icon-reduce" @click="deleteRangeData1(index)"><RemoveFilled /></el-icon>
                </span>
              </div>
            </el-form-item>
            <!-- 源注释：方数范围 sections2 默认隐藏
            <el-form-item label="方数范围" style="width: 49%; display: inline-block" class="is-required">
              <div v-for="(item, index) in dialogForm.sections2" :key="index" class="item-after-icon">
                <el-input-number v-model="item.lower" :controls="false" placeholder="输入下限" />
                <el-input-number v-model="item.upper" :controls="false" placeholder="输入上限" />
              </div>
            </el-form-item>
            -->
          </div>
        </el-form>
        <div v-show="isType === '1' || isType === '3'">
          <el-transfer
            v-model="options"
            filterable
            :filter-method="filterMethod"
            :titles="[`选择${title}`, '已选择']"
            :props="{ key: 'id', label: 'name' }"
            filter-placeholder="输入搜索"
            :data="areaList"
            style="height: 450px"
          />
        </div>
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button type="primary" size="small" @click="save">保存</el-button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus, EditPen, RemoveFilled } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import PrivatelineForm from './components/privateline-form.vue'
import PrivatelineSet from './components/privateline-set.vue'
import PrivatelineLineGroup from './components/privateline-line-group.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import {
  privatelineApi, getCountryList, getProductList, getServiceSubtypeList, getAgentOptions,
  getRegionList, getFbastoreList, getContainerList, getStateByCountry, getAllAreaList,
  PURPOSE_LIST, CONTAINER_TYPE_LIST, COVER_TANK_LIST, ORG_TAG_LIST, PURPOSE_TYPE_LIST,
  DISPATCH_LIST, CATEGORY_LIST, STATUS_LIST
} from '@/api/modules/service'

defineOptions({ name: 'SvcPrivateline' })
const { can } = usePagePerms()

const fetchList = (p = {}) => privatelineApi.list({
  page: p.page, size: p.size,
  productId: p.productId, subtypeId: p.subtypeId, containerType: p.containerType, coverTank: p.coverTank,
  countryFromId: p.countryFromId, countryId: p.countryId, orgTag: p.orgTag,
  purposeType: p.purposeType, dispatch: p.dispatch, status: p.status, name: p.name
})
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, {
  purpose: '', productId: '', agentId: '', countryId: '', orgTag: '', dispatch: '', containerType: '',
  coverTank: '', countryFromId: '', category: '', subtypeId: '', purposeType: '', status: '', name: ''
})

const columns = [
  { prop: 'name', label: '服务名称', minWidth: 200, fixed: 'left' },
  { prop: 'lsId', label: '服务编码', minWidth: 150, fixed: 'left' },
  { prop: 'productName', label: '所属产品', width: 100 },
  { prop: 'subtypeName', label: '服务类型', width: 100 },
  { prop: 'containerType', label: '业务类型', width: 100 },
  { prop: 'coverTank', label: '支持锁舱', width: 100 },
  { prop: 'countryName', label: '起运国', minWidth: 120 },
  { prop: 'targets', label: '目的国', minWidth: 200 },
  { prop: 'departureName', label: '起运港', minWidth: 200, showOverflowTooltip: true },
  { prop: 'destinationName', label: '目的港', minWidth: 200, showOverflowTooltip: true },
  { prop: 'purposeType', label: '目的地类型', width: 120 },
  { prop: 'dispatch', label: '派件方式', width: 100 },
  { prop: 'examine', label: '是否验货', width: 100 },
  { prop: 'area', label: '目的地/区域', width: 130 },
  { prop: 'charge', label: '设置计费', width: 120 },
  { prop: 'agent', label: '关联代理商', width: 130 },
  { prop: 'status', label: '启用状态', width: 150, align: 'center', fixed: 'right' }
]

const formatTargetCountrys = row => (row || []).map(item => item.countryName).join(',')

/* 筛选下拉数据源 */
const countryList = ref([])
const productList = ref([])
const subtypeList = ref([])
const agentsList = ref([])
const loadProduct = async () => { productList.value = (await getProductList()).data }
const onSubtype = () => { query.containerType = ''; query.coverTank = ''; query.dispatch = '' }

onMounted(async () => {
  countryList.value = (await getCountryList()).data
  productList.value = (await getProductList()).data
  subtypeList.value = (await getServiceSubtypeList('05')).data.filter(it => it.id !== '3')
  agentsList.value = (await getAgentOptions()).data
})

/* 三态视图：index / addEditForm / group */
const addEditForm = ref('index')
const isEdit = ref(false)
const isCopy = ref(false)
const editRow = ref(null)
const openAdd = () => { isEdit.value = false; isCopy.value = false; editRow.value = null; addEditForm.value = 'addEditForm' }
const handleEdit = row => { isEdit.value = true; isCopy.value = false; editRow.value = { ...row }; addEditForm.value = 'addEditForm' }
const handleCopy = row => { isEdit.value = true; isCopy.value = true; editRow.value = { ...row }; addEditForm.value = 'addEditForm' }
const saveConfirm = () => { addEditForm.value = 'index'; loadData() }
const setServiceGroup = () => { addEditForm.value = 'group' }

/* 关联代理商 */
const dialogAgent = ref(false)
const dialogLoading = ref(false)
const agentTitle = ref('')
const currentServiceId = ref('')
const agentList = ref([])
const selectAgents = ref([])
const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1
const handleAgent = async row => {
  agentTitle.value = row.name
  currentServiceId.value = row.id
  dialogAgent.value = true
  dialogLoading.value = true
  try {
    agentList.value = (await privatelineApi.getAgents(row.subtypeId)).data
    selectAgents.value = (await privatelineApi.getAgentById(row.id)).data
  } finally {
    dialogLoading.value = false
  }
}
const closeAgent = () => { dialogAgent.value = false; currentServiceId.value = '' }
const confirmAgent = async () => {
  dialogLoading.value = true
  try {
    const agents = selectAgents.value.map(item => {
      const target = agentList.value.find(info => info.id === item) || {}
      return { id: item, name: target.name }
    }).filter(it => it.name && it.id)
    await privatelineApi.saveAgent(currentServiceId.value, agents)
    ElMessage.success('保存成功')
    closeAgent()
    loadData()
  } finally {
    dialogLoading.value = false
  }
}

/* 服务组合弹窗（隐藏入口，保留） */
const isGroupDialog = ref(false)

/* ---- 目的地/区域 & 设置计费（isType 1地址/2区间/3柜型/4重量） ---- */
const text = '(取值范围：>=起始值， <结束值)'
const dialogVisible = ref(false)
const isType = ref('')
const title = ref('')
const addressList = ref([])
const areaList = ref([])
const options = ref([])
const dialogForm = reactive({
  yType: undefined, xType: undefined, loadType: undefined, countryId: undefined, xy: '',
  sections: [{ lower: undefined, upper: undefined }],
  sections1: [{ lower: undefined, upper: undefined }]
})
const resetDialogForm = () => {
  dialogForm.yType = undefined; dialogForm.xType = undefined; dialogForm.loadType = undefined
  dialogForm.countryId = undefined; dialogForm.xy = ''
  dialogForm.sections = [{ lower: undefined, upper: undefined }]
  dialogForm.sections1 = [{ lower: undefined, upper: undefined }]
}

const onArea = row => {
  const { subtypeId, id, purposeType } = row
  if (purposeType === 1) {
    addressList.value = [
      { name: '国家', id: '0' }, { name: '国内区域', id: '5' }, { name: '城市区域', id: '100' },
      // { name: '仓库区域', id: '101' },
      { name: '国家区域', id: '102' }, { name: '州省', id: '1' }
    ]
  } else {
    addressList.value = [
      { name: '国家', id: '0' }, { name: '国内区域', id: '5' }, { name: '城市区域', id: '100' },
      { name: '仓库区域', id: '101' }, { name: '国家区域', id: '102' }, { name: '州省', id: '1' }, { name: '仓库代码', id: '7' }
    ]
  }
  currentServiceId.value = id
  currentSubtypeId.value = subtypeId
  title.value = '地址类型'
  dialogForm.xy = 'Y'
  isType.value = '1'
  dialogVisible.value = true
  getPriceConfig()
}
const currentSubtypeId = ref('')
const onCharge = row => {
  const { subtypeId, containerType, id, priceType } = row
  isType.value = '2'
  switch (subtypeId) {
    case '0': // 空
      title.value = '重量区间'; dialogForm.loadType = '0'; dialogForm.xType = '0'
      break
    case '1': // 海
    case '2': // 铁
      if (containerType === '0') {
        if (priceType === '2') { title.value = '重量区间'; dialogForm.loadType = '3'; dialogForm.xType = '0' }
        else { title.value = '体积区间'; dialogForm.loadType = '3'; dialogForm.xType = '1' }
      } else if (containerType === '1') {
        title.value = '柜型'; isType.value = '3'; dialogForm.loadType = '2'; dialogForm.xType = '3'; getContainer()
      }
      break
    case '3': // 快
      title.value = ''
      break
    case '4': // 卡散
      title.value = '重量区间'; isType.value = '4'; dialogForm.loadType = '5'
      break
    default:
      break
  }
  currentServiceId.value = id
  currentSubtypeId.value = subtypeId
  dialogForm.xy = 'X'
  dialogVisible.value = true
  getPriceConfig()
}
const getPriceConfig = async () => {
  dialogLoading.value = true
  try {
    const cfg = (await privatelineApi.getPriceConfig(currentServiceId.value, dialogForm.xy)).data
    if (!cfg) return
    if (isType.value === '1') {
      dialogForm.yType = cfg.yType
      dialogForm.countryId = cfg.countryId
      options.value = cfg.options || []
      if (cfg.yType === '0' || cfg.yType === '102') await onAddress(true)
      else await onCountry()
    } else if (isType.value === '2') {
      dialogForm.sections = (cfg.sections && cfg.sections.length) ? cfg.sections.map(s => ({ ...s })) : [{ lower: undefined, upper: undefined }]
    } else if (isType.value === '3') {
      options.value = cfg.options || []
    } else if (isType.value === '4') {
      dialogForm.sections1 = (cfg.sections1 && cfg.sections1.length) ? cfg.sections1.map(s => ({ ...s })) : [{ lower: undefined, upper: undefined }]
    }
  } finally {
    dialogLoading.value = false
  }
}
const onAddress = async keep => {
  if (keep !== true) { dialogForm.countryId = undefined; options.value = [] }
  areaList.value = []
  if (dialogForm.yType === '0') areaList.value = (await getCountryList()).data
  else if (dialogForm.yType === '102') areaList.value = (await getAllAreaList(2, dialogForm.countryId)).data
  else areaList.value = []
}
const onCountry = async () => {
  const type = dialogForm.yType
  dialogLoading.value = true
  try {
    if (type === '0') areaList.value = (await getCountryList()).data
    else if (type === '5') areaList.value = (await getRegionList(dialogForm.countryId)).data
    else if (type === '1') areaList.value = (await getStateByCountry(dialogForm.countryId)).data
    else if (type === '7') areaList.value = (await getFbastoreList(dialogForm.countryId)).data.map(item => ({ id: item.id, name: item.code + (item.postal ? '-' + item.postal : '') + (item.stateName ? '-' + item.stateName : '') }))
    else if (type === '100') areaList.value = (await getAllAreaList(1, dialogForm.countryId)).data
    else if (type === '101') areaList.value = (await getAllAreaList(3, dialogForm.countryId)).data
    else if (type === '102') areaList.value = (await getAllAreaList(2, dialogForm.countryId)).data
    else { areaList.value = []; options.value = [] }
  } finally {
    dialogLoading.value = false
  }
}
const getContainer = async () => {
  dialogLoading.value = true
  try { areaList.value = (await getContainerList()).data } finally { dialogLoading.value = false }
}
const addRangeData = () => dialogForm.sections.push({ lower: undefined, upper: undefined })
const deleteRangeData = index => dialogForm.sections.splice(index, 1)
const addRangeData1 = () => dialogForm.sections1.push({ lower: undefined, upper: undefined })
const deleteRangeData1 = index => dialogForm.sections1.splice(index, 1)

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
const save = async () => {
  let cfg = null
  if (isType.value === '1') {
    cfg = { yType: dialogForm.yType, countryId: dialogForm.countryId, options: [...options.value] }
  } else if (isType.value === '2') {
    if (!rangeValidate(dialogForm.sections)) return
    cfg = { sections: dialogForm.sections.map(s => ({ ...s })) }
  } else if (isType.value === '3') {
    cfg = { options: [...options.value] }
  } else if (isType.value === '4') {
    if (!rangeValidate(dialogForm.sections1)) return
    cfg = { sections1: dialogForm.sections1.map(s => ({ ...s })) }
  }
  dialogLoading.value = true
  try {
    await privatelineApi.savePriceConfig(currentServiceId.value, dialogForm.xy, cfg)
    ElMessage.success('保存成功')
    cancel()
    loadData()
  } finally {
    dialogLoading.value = false
  }
}
const cancel = () => {
  dialogVisible.value = false
  isType.value = ''
  options.value = []
  areaList.value = []
  resetDialogForm()
}

/* 启用/禁用（STRING '1'/'0'，源二态守卫） */
const handleSwitch = (row, val) => {
  const olds = String(row.status); const news = String(val)
  if (!olds || olds === news) return
  const textVal = news === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${textVal}该专线服务，是否继续？`, '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await privatelineApi.changeStatus(row.id, val); ElMessage.success('更改成功'); loadData() })
    .catch(() => loadData())
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await privatelineApi.res.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
</script>

<style scoped lang="scss">
.cfg-dot { font-size: 30px; margin-right: 5px; font-weight: bold; line-height: 1; }
.dialog-form .el-form-item { display: inline-block; vertical-align: top; width: 50%; margin-bottom: 10px; }
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
.item-after-icon {
  position: relative; padding-bottom: 15px;
  .item-icon-plus { position: absolute; top: 6px; color: #409eff; font-size: 18px; margin-left: 10px; cursor: pointer; }
  .item-icon-reduce { position: absolute; top: 6px; color: #f56c6c; font-size: 18px; margin-left: 10px; cursor: pointer; }
}
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
