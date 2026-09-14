<template>
  <div>
    <!-- 仓储服务：列表视图 / 内嵌编辑表单（源 v-show 同页切换，非路由跳转） -->
    <div v-show="!editShow">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
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
          <template #col-agent="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openAgent(row)">关联代理商</el-button>
          </template>
          <!--
            源含「关联成本项目类型」列（associatedProject）与其穿梭弹窗（关联成本项目类型），
            整块被注释，入口失效，此处保留说明不放开。
          -->
          <template #col-status="{ row }">
            <el-switch :model-value="row.status" active-value="1" inactive-value="0" active-text="启用" inactive-text="禁用" :disabled="!can('edit')" @change="v => onStatus(row, v)" />
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
    <WarehousingForm v-if="editShow" :is-edit="isEdit" :is-copy="isCopy" :row="editRow" @back="editShow = false" @save-success="onSaved" />

    <!-- 关联代理商穿梭框 -->
    <RelevanceTransfer v-model="agentDlg.visible" :title="agentDlg.title" :company-list="agentList" :selected="agentDlg.selected" @save="saveAgent" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import WarehousingForm from './components/warehousing-form.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { warehousingApi, getAgentOptions, SELECT_TYPE_LIST } from '@/api/modules/service'

defineOptions({ name: 'SvcWarehousing' })
const { can } = usePagePerms()

// selectType：1 服务编码 / 2 服务名称（源 keyword 单框 + 前置下拉）
const selectType = ref('1')
const fetchList = (p = {}) => {
  const params = { page: p.page, size: p.size }
  if (selectType.value === '1') params.code = p.keyword
  else params.name = p.keyword
  return warehousingApi.list(params)
}
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fetchList, { keyword: '' })

const columns = [
  { prop: 'name', label: '服务名称', minWidth: 160, fixed: 'left' },
  { prop: 'serviceCode', label: '服务编码', minWidth: 200, fixed: 'left' },
  { prop: 'abbr', label: '服务简称', minWidth: 120 },
  { prop: 'agent', label: '关联代理商', width: 130 },
  { prop: 'createTime', label: '添加时间', width: 180 },
  { prop: 'status', label: '启用状态', width: 130, align: 'center' }
]

/* 内嵌编辑表单切换 */
const editShow = ref(false)
const isEdit = ref(false)
const isCopy = ref(false)
const editRow = ref(null)
const openAdd = () => { isEdit.value = false; isCopy.value = false; editRow.value = null; editShow.value = true }
const openEdit = row => { isEdit.value = true; isCopy.value = false; editRow.value = { ...row }; editShow.value = true }
// 复制：源去掉 id/name/abbr/serviceCode
const openCopy = row => {
  isEdit.value = true; isCopy.value = true
  const { id, name, abbr, serviceCode, ...rest } = row
  editRow.value = { ...rest }
  editShow.value = true
}
const onSaved = () => { editShow.value = false; loadData() }

/* 启用状态开关（源 onStatus 守卫：!row.status || row.status===value 不触发） */
const onStatus = (row, val) => {
  if (!row.status || row.status === val) return
  const text = val === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该仓储服务，是否继续？`, '提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await warehousingApi.changeStatus(row.id, val); ElMessage.success('修改成功'); loadData() })
    .catch(() => loadData())
}

const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await warehousingApi.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

/* 关联代理商穿梭框 */
const agentList = ref([])
const agentDlg = reactive({ visible: false, title: '', selected: [], id: null })
const openAgent = async row => {
  agentList.value = (await getAgentOptions()).data
  agentDlg.selected = (await warehousingApi.getAgentById(row.id)).data
  agentDlg.title = `关联代理商【${row.name}】`
  agentDlg.id = row.id
  agentDlg.visible = true
}
const saveAgent = async ids => { await warehousingApi.saveAgent(agentDlg.id, ids); ElMessage.success('保存成功'); loadData() }
</script>
