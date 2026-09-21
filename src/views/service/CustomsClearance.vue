<template>
  <div>
    <!-- 报关服务：列表视图 / 内嵌编辑表单（源 v-show 同页切换） -->
    <div v-show="!editShow">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.countryId" placeholder="所在国家" filterable clearable style="width: 130px">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.subtypeId" clearable placeholder="服务类型" style="width: 140px">
            <el-option v-for="item in subTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyword" placeholder="请输入内容" clearable class="input-with-select" style="width: 280px">
            <template #prepend>
              <el-select v-model="selectType" style="width: 120px">
                <el-option v-for="t in SELECT_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
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
          <template #col-cost="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.costitemConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openCost(row)">关联成本项目</el-button>
            </div>
          </template>
          <template #col-customs="{ row }">
            <div style="display: flex; align-items: center">
              <span class="cfg-dot" :style="{ color: row.customsConfiged ? '#4cd964' : '#ff3b30' }">·</span>
              <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openCustoms(row)">关联海关</el-button>
            </div>
          </template>
          <template #col-agent="{ row }">
            <!-- 源此处关联代理商配置状态点 v-if="agentConfiged" 已注释，仅保留按钮 -->
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openAgent(row)">关联代理商</el-button>
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
    <CustomsForm v-if="editShow" :is-edit="isEdit" :is-copy="isCopy" :row="editRow" :sub-type-data="subTypeList" :country-data="countryList" @back="editShow = false" @save-success="onSaved" />

    <!-- 关联代理商穿梭框 -->
    <RelevanceTransfer v-model="agentDlg.visible" :title="agentDlg.title" :company-list="agentList" :selected="agentDlg.selected" @save="saveAgent" />

    <!-- 关联成本项目穿梭框 -->
    <RelevanceTransfer v-model="costDlg.visible" :title="costDlg.title" :company-list="costItemList" :selected="costDlg.selected" @save="saveCost" />

    <!-- 关联海关穿梭框 -->
    <CustomsTransferModal ref="transferModal" @saved="loadData" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import CustomsForm from './components/customs-form.vue'
import CustomsTransferModal from './components/customs-transfer-modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { customsApi, getCountryList, getServiceSubtypeList, getCostItemList, getAgentOptions, SELECT_TYPE_LIST } from '@/api/modules/service'

defineOptions({ name: 'SvcCustoms' })
const { can } = usePagePerms()

const selectType = ref('1')
const fetchList = (p = {}) => {
  const params = { page: p.page, size: p.size, countryId: p.countryId, subtypeId: p.subtypeId }
  if (selectType.value === '1') params.code = p.keyword
  else params.name = p.keyword
  return customsApi.list(params)
}
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, { keyword: '', countryId: '', subtypeId: '' })

const columns = [
  { prop: 'name', label: '服务名称', minWidth: 180, fixed: 'left' },
  { prop: 'csId', label: '服务编码', minWidth: 180, fixed: 'left' },
  { prop: 'abbr', label: '服务简称', minWidth: 160 },
  { prop: 'subtypeName', label: '服务类型', width: 120 },
  { prop: 'cost', label: '关联成本项目', width: 140 },
  { prop: 'customs', label: '关联海关', width: 120 },
  { prop: 'agent', label: '关联代理商', width: 130 },
  { prop: 'createTime', label: '添加时间', width: 180 },
  { prop: 'status', label: '启用状态', width: 150, align: 'center', fixed: 'right' }
]

/* 筛选下拉数据源 */
const countryList = ref([])
const subTypeList = ref([])
onMounted(async () => {
  countryList.value = (await getCountryList()).data
  subTypeList.value = (await getServiceSubtypeList('03')).data
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

/* 启用状态开关（源 modifyClearanceStatus 传目标值） */
const onStatus = (row, val) => {
  if (!row.status || row.status === val) return
  const text = val === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该报关服务，是否继续？`, '提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await customsApi.changeStatus(row.id, val); ElMessage.success('修改成功'); loadData() })
    .catch(() => loadData())
}

const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await customsApi.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

/* 关联代理商 */
const agentList = ref([])
const agentDlg = reactive({ visible: false, title: '', selected: [], id: null })
const openAgent = async row => {
  agentList.value = (await getAgentOptions()).data
  agentDlg.selected = (await customsApi.getAgentById(row.id)).data
  agentDlg.title = `关联代理商【${row.name}】`
  agentDlg.id = row.id
  agentDlg.visible = true
}
const saveAgent = async ids => { await customsApi.saveAgent(agentDlg.id, ids); ElMessage.success('保存成功'); loadData() }

/* 关联成本项目 */
const costItemList = ref([])
const costDlg = reactive({ visible: false, title: '', selected: [], id: null })
const openCost = async row => {
  costItemList.value = (await getCostItemList()).data
  costDlg.selected = (await customsApi.getCostById(row.id)).data
  costDlg.title = `关联成本项目【${row.countryName}-${row.subtypeName}-${row.csId}】`
  costDlg.id = row.id
  costDlg.visible = true
}
const saveCost = async ids => { await customsApi.saveCost(costDlg.id, ids); ElMessage.success('更新成功'); loadData() }

/* 关联海关（独立弹窗组件） */
const transferModal = ref()
const openCustoms = row => transferModal.value.show(row, `${row.countryName}-${row.subtypeName}-${row.csId}`)
</script>

<style scoped>
.cfg-dot { font-size: 30px; margin-right: 5px; font-weight: bold; line-height: 1; }
</style>
