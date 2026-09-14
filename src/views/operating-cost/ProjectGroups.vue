<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <template #actions>
        <el-button v-if="can('wAdd')" type="primary" :icon="CirclePlus" @click="openAdd">新增项目组</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
        <template #col-type="{ row }">{{ findGroupType(row.type) }}</template>
        <template #col-projects="{ row }">
          <el-button link type="primary" @click="showProjects(row.id)">成本项目</el-button>
        </template>
        <template #actions="{ row }">
          <el-button v-if="can('wEdit')" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="can('wDel')" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑项目组 -->
    <Modal v-model="dialog.visible" :title="isEdit ? '编辑项目组' : '新增项目组'" width="600px" :confirm-loading="dialog.loading" @confirm="saveConfirm" @closed="cancel">
      <el-form ref="formRef" :model="form" :rules="formRules" size="small" label-width="110px">
        <el-form-item label="项目组名称" prop="name">
          <el-input v-model="form.name" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" clearable filterable placeholder="请选择" style="width: 100%">
            <el-option v-for="item in GROUP_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :maxlength="100" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 关联成本项目 -->
    <Modal v-model="itemDialog.visible" title="关联成本项目" width="960px" :footer="false" @closed="itemDialogClose">
      <div v-loading="itemDialog.loading">
        <div style="margin-bottom: 10px">
          <el-select v-model="serviceType" :loading="selectLoading" filterable size="small" style="width: 200px" @change="onServiceType">
            <el-option v-for="item in serviceList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <el-transfer
          v-model="itemValue"
          filterable
          :filter-method="filterMethod"
          :titles="['成本项目组', '已选择']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="itemData"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="itemDialogClose">取 消</el-button>
          <el-button :disabled="!can('wProjects')" type="primary" size="small" @click="saveItem">确 定</el-button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import {
  getCostgroupList, saveCostgroup, deleteCostgroup, getCostmemberList, saveCostItems, getCostList,
  getServiceTypeList, GROUP_TYPE_LIST
} from '@/api/modules/operatingCost'

defineOptions({ name: 'CostGroups' })

const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCostgroupList, {})

const columns = [
  { prop: 'name', label: '成本项目组名称', minWidth: 280 },
  { prop: 'type', label: '类型', width: 280 },
  { prop: 'projects', label: '成本项目', width: 180 }
]

const findGroupType = type => {
  const item = GROUP_TYPE_LIST.find(it => parseInt(it.id, 10) === parseInt(type, 10)) || {}
  return item.name || ''
}

/* 新增/编辑项目组 */
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref()
const dialog = reactive({ visible: false, loading: false })
const initForm = () => ({ name: undefined, type: undefined, remark: undefined })
const form = reactive(initForm())
const formRules = {
  name: [{ required: true, message: '项目中文名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '类型不能为空', trigger: 'change' }]
}

const openAdd = () => { isEdit.value = false; Object.assign(form, initForm()); dialog.visible = true }
const openEdit = row => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, initForm(), { name: row.name, type: row.type, remark: row.remark })
  dialog.visible = true
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', closeOnClickModal: false })
    .then(async () => { await deleteCostgroup(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
const saveConfirm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    dialog.loading = true
    try {
      const params = { ...form }
      if (isEdit.value) params.id = currentId.value
      await saveCostgroup(params)
      ElMessage.success('操作成功')
      dialog.visible = false
      loadData()
    } finally {
      dialog.loading = false
    }
  })
}
const cancel = () => { Object.assign(form, initForm()); formRef.value && formRef.value.clearValidate() }

/* 关联成本项目穿梭 */
const itemDialog = reactive({ visible: false, loading: false })
const selectLoading = ref(false)
const currentCostId = ref('')
const serviceType = ref('')
const serviceList = ref([])
const itemData = ref([])
const itemValue = ref([])
let itemJson = []

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const showProjects = async id => {
  itemDialog.visible = true
  currentCostId.value = id
  itemDialog.loading = true
  try {
    await getServiceTypeData()
    await getMemberList(id)
  } finally {
    itemDialog.loading = false
  }
}
const getServiceTypeData = async () => {
  selectLoading.value = true
  try {
    serviceList.value = (await getServiceTypeList()).data || []
    serviceType.value = (serviceList.value[0] || {}).id
    await getItemData()
  } finally {
    selectLoading.value = false
  }
}
const getItemData = async () => {
  itemData.value = (await getCostList({ serviceTypeId: serviceType.value })).data || []
}
const getMemberList = async costgroupId => {
  const list = (await getCostmemberList({ costgroupId })).data || []
  itemValue.value = list.map(item => item.costitemId)
  itemJson = JSON.parse(JSON.stringify(itemValue.value))
}
// 切换服务类型时恢复原始已选（源逻辑：以服务端原始选择为准）
const onServiceType = async () => {
  itemValue.value = JSON.parse(JSON.stringify(itemJson))
  await getItemData()
}
const saveItem = async () => {
  await saveCostItems({ costgroupId: currentCostId.value, costmembers: itemValue.value.map(item => ({ costitemId: item })) })
  ElMessage.success('操作成功')
  currentCostId.value = ''
  itemDialogClose()
}
const itemDialogClose = () => {
  itemDialog.visible = false
  itemData.value = []
  itemValue.value = []
}
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
