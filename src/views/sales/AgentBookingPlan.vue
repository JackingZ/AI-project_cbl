<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="计划名称"><el-input v-model="query.keyWord" placeholder="计划名称/编号" clearable style="width: 200px" /></el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.type" clearable placeholder="全部" style="width: 120px">
          <el-option v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="目的国">
        <el-select v-model="query.countryId" clearable placeholder="全部" style="width: 140px">
          <el-option v-for="c in countryList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="160" @change="loadData">
        <template #col-type="{ row }">{{ lookup(BIZ_TYPE_LIST, row.type) }}</template>
        <template #col-orgType2="{ row }">{{ lookup(ORG_TYPE2_LIST, row.orgType2) }}</template>
        <template #col-planNum="{ row }">{{ row.planNum }} {{ row.unit }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <AgentPlanForm ref="formRef" :is-edit="isEdit" @save-success="loadData" />

    <!-- 查看 -->
    <Modal v-model="viewDlg.visible" title="查看发货计划" width="820px" :footer="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="计划名称">{{ viewDlg.row.name }}</el-descriptions-item>
        <el-descriptions-item label="计划编号">{{ viewDlg.row.code }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ lookup(BIZ_TYPE_LIST, viewDlg.row.type) }}</el-descriptions-item>
        <el-descriptions-item label="目的国">{{ viewDlg.row.countryName }}</el-descriptions-item>
        <el-descriptions-item label="服务商机构">{{ lookup(ORG_TYPE2_LIST, viewDlg.row.orgType2) }}</el-descriptions-item>
        <el-descriptions-item label="计划量">{{ viewDlg.row.planNum }} {{ viewDlg.row.unit }}</el-descriptions-item>
        <el-descriptions-item label="计划时间">{{ viewDlg.row.planTime }}</el-descriptions-item>
        <el-descriptions-item label="服务商">{{ viewDlg.row.providerNames }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewDlg.row.remark }}</el-descriptions-item>
      </el-descriptions>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import AgentPlanForm from './components/agent-plan-form.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { agentPlanApi, lookup, BIZ_TYPE_LIST, ORG_TYPE2_LIST, getCountryOptions } from '@/api/modules/sales'

defineOptions({ name: 'SalesAgentPlan' })
const { can } = usePagePerms()

const countryList = ref([])
onMounted(async () => { countryList.value = (await getCountryOptions()).data })

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(agentPlanApi.list, { keyWord: '', type: '', countryId: '' })
const columns = [
  { prop: 'code', label: '计划编号', width: 120 },
  { prop: 'name', label: '计划名称', minWidth: 160 },
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'countryName', label: '目的国', width: 100 },
  { prop: 'orgType2', label: '服务商机构', width: 120 },
  { prop: 'planNum', label: '计划量', width: 140, align: 'right' },
  { prop: 'providerNames', label: '服务商', minWidth: 200 },
  { prop: 'planTime', label: '计划时间', width: 120 }
]

const formRef = ref(null)
const isEdit = ref(false)
const openAdd = () => { isEdit.value = false; formRef.value.show() }
const openEdit = row => { isEdit.value = true; formRef.value.show(row) }

const viewDlg = reactive({ visible: false, row: {} })
const openView = row => { viewDlg.row = row; viewDlg.visible = true }

const handleDelete = row => {
  ElMessageBox.confirm('确定删除该发货计划吗？', '提示', { type: 'warning' })
    .then(async () => { await agentPlanApi.remove(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
</script>
