<template>
  <div>
    <div>
      <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="handleAdd">新增</el-button>
    </div>
    <el-table v-loading="loading" :data="pagedData" border height="400px" style="width: 100%; margin: 10px 0">
      <el-table-column label="服务组合名称" prop="name" />
      <el-table-column label="关联服务名称">
        <template #default="scope">{{ (scope.row.svcs || []).map(it => it.name).join(' , ') }}</template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="size" layout="total, prev, pager, next" :total="total" style="text-align: right" />

    <!-- 关联服务名称穿梭 -->
    <Modal v-model="isCodeShow" title="关联服务名称" width="960px" :footer="false" append-to-body>
      <el-transfer
        v-model="selectForm.svcs"
        filterable
        :filter-method="filterMethod"
        :titles="['选择关联服务名称', '已关联服务名称']"
        :props="{ key: 'id', label: 'name' }"
        filter-placeholder="输入搜索"
        :data="subTypeList"
        style="height: 500px"
      />
      <div style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="isCodeShow = false">取 消</el-button>
        <el-button type="primary" size="small" @click="isCodeShow = false">确 定</el-button>
      </div>
    </Modal>

    <!-- 新增/编辑服务组合 -->
    <Modal v-model="isEditDialog" :title="isEdit ? '编辑服务组合' : '新增服务组合'" width="600px" append-to-body @confirm="save" @closed="cancel">
      <el-form ref="editFormRef" v-loading="formLoading" :model="selectForm" :rules="formRules" label-width="120px" label-position="right" size="small" style="padding-right: 20px">
        <el-form-item label="服务组合名称" prop="name">
          <el-input v-model="selectForm.name" :maxlength="20" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="选择服务名称" prop="svcs">
          <el-input :model-value="`已选择(${selectForm.svcs.length})`" size="small" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="isCodeShow = true" /></template>
          </el-input>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { CirclePlus, Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { trailerSvcGroup } from '@/api/modules/service'

defineOptions({ name: 'TrailerSet' })
const props = defineProps({ subTypeData: { type: Array, default: () => [] } })
const subTypeList = computed(() => props.subTypeData || [])

const loading = ref(false)
const formLoading = ref(false)
const isEditDialog = ref(false)
const isEdit = ref(false)
const isCodeShow = ref(false)
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const editFormRef = ref()

const selectForm = reactive({ id: undefined, name: undefined, svcs: [] })
const formRules = {
  name: [required('服务组合名称不能为空')],
  svcs: [required('请选择服务名称', 'change')]
}

const pagedData = computed(() => {
  total.value = tableData.value.length
  const start = (page.value - 1) * size.value
  return tableData.value.slice(start, start + size.value)
})

const queryAll = async () => {
  loading.value = true
  try {
    tableData.value = trailerSvcGroup.res.list(() => true)
    total.value = tableData.value.length
  } finally {
    loading.value = false
  }
}
const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const handleAdd = () => {
  Object.assign(selectForm, { id: undefined, name: undefined, svcs: [] })
  isEditDialog.value = true
  isEdit.value = false
}
const handleEdit = row => {
  Object.assign(selectForm, { ...row, svcs: row.svcs.map(it => it.id) })
  isEditDialog.value = true
  isEdit.value = true
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await trailerSvcGroup.res.remove(row.id); ElMessage.success('删除成功'); queryAll() })
    .catch(() => {})
}
const cancel = () => {
  Object.assign(selectForm, { id: undefined, name: undefined, svcs: [] })
  editFormRef.value && editFormRef.value.clearValidate()
}
const save = () => {
  editFormRef.value.validate(async valid => {
    if (!valid) return
    formLoading.value = true
    try {
      const svcs = selectForm.svcs
        .map(id => { const it = subTypeList.value.find(ag => ag.id === id) || {}; return { id: it.id, name: it.name } })
        .filter(it => it.name && it.id)
      const params = { id: selectForm.id, typeName: '拖车', typeId: '06', name: selectForm.name, svcs }
      await trailerSvcGroup.save(params)
      ElMessage.success('保存成功')
      isEditDialog.value = false
      queryAll()
    } finally {
      formLoading.value = false
    }
  })
}

onMounted(() => queryAll())
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
