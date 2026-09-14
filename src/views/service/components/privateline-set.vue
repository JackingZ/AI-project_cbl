<template>
  <div>
    <el-row>
      <el-col :span="12">
        <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-select v-model="typeId" placeholder="服务类型" size="small" clearable filterable style="width: 130px" @change="getTableData(1)">
          <el-option v-for="item in subTypeList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="tableData" height="400px" style="width: 100%; margin: 10px 0" border>
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
    <el-pagination v-model:current-page="page" :page-size="size" layout="total, prev, pager, next" :total="total" style="text-align: right" @current-change="getTableData()" />

    <!-- 关联服务名称 -->
    <Modal v-model="isCodeShow" title="关联服务名称" width="960px" :footer="false" append-to-body @closed="cancelDialog">
      <div v-loading="isCodeLoading">
        <el-transfer
          v-model="selectForm.svcs"
          filterable
          :filter-method="filterMethod"
          :titles="['选择关联服务名称', '已关联服务名称']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="typeList"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="cancelDialog">取 消</el-button>
          <el-button type="primary" size="small" @click="isCodeShow = false">确 定</el-button>
        </div>
      </div>
    </Modal>

    <!-- 新增/编辑服务组合 -->
    <Modal v-model="isEditDialog" :title="isEdit ? '编辑服务组合' : '新增服务组合'" width="600px" append-to-body @confirm="save" @closed="cancel">
      <el-form ref="selectFormRef" v-loading="formLoading" :model="selectForm" :rules="formRules" label-width="120px" label-position="right" size="small" style="padding-right: 20px">
        <el-form-item label="服务组合名称" prop="name">
          <el-input v-model="selectForm.name" :maxlength="20" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="selectForm.subtypeId" placeholder="请选择" size="small" clearable style="width: 100%" @change="onType">
            <el-option v-for="item in subTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择服务名称" prop="svcs">
          <el-input :model-value="`已选择(${selectForm.svcs.length})`" size="small" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="onServiceName" /></template>
          </el-input>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus, Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { privatelineApi, privatelineSvcGroup, getServiceSubtypeList } from '@/api/modules/service'

defineOptions({ name: 'PrivatelineSet' })

const loading = ref(false)
const formLoading = ref(false)
const isEditDialog = ref(false)
const isEdit = ref(false)
const isCodeShow = ref(false)
const isCodeLoading = ref(false)
const typeId = ref('')
const tableData = ref([])
const typeList = ref([])
const typeOption = ref([])
const subTypeList = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const selectFormRef = ref()

const selectForm = reactive({ id: undefined, name: undefined, subtypeId: undefined, svcs: [] })
const formRules = {
  subtypeId: [required('请选择服务类型', 'change')],
  name: [required('服务组合名称不能为空')],
  svcs: [required('请选择服务名称', 'change')]
}

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const getSubtypeList = async () => { subTypeList.value = (await getServiceSubtypeList('05')).data }
const getPrivatelineList = async () => {
  isCodeLoading.value = true
  try {
    const data = (await privatelineApi.getComplicatedList({ subtypeId: selectForm.subtypeId, status: '1' })).data || []
    typeList.value = data
    typeOption.value = JSON.parse(JSON.stringify(data))
  } finally {
    isCodeLoading.value = false
  }
}
const getTableData = async val => {
  loading.value = true
  if (val) page.value = val
  try {
    const res = (await privatelineSvcGroup.query({ typeId: '05', subtypeId: typeId.value, page: page.value, size: size.value })).data || {}
    tableData.value = res.list || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => { isEditDialog.value = true; isEdit.value = false }
const handleEdit = row => {
  isEditDialog.value = true
  isEdit.value = true
  Object.assign(selectForm, { ...row, svcs: row.svcs.map(it => it.id) })
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await privatelineSvcGroup.res.remove(row.id); ElMessage.success('删除成功'); getTableData() })
    .catch(() => {})
}
const onType = () => { typeList.value = []; selectForm.svcs = [] }
const onServiceName = () => { isCodeShow.value = true; getPrivatelineList() }
const cancelDialog = () => { isCodeShow.value = false; typeList.value = [] }
const cancel = () => {
  isEditDialog.value = false
  Object.assign(selectForm, { id: undefined, name: undefined, subtypeId: undefined, svcs: [] })
  selectFormRef.value && selectFormRef.value.clearValidate()
}
const save = () => {
  selectFormRef.value.validate(async valid => {
    if (!valid) return false
    formLoading.value = true
    try {
      const params = { typeId: '05', typeName: '专线', subtypeId: selectForm.subtypeId, id: selectForm.id, name: selectForm.name, svcs: [] }
      subTypeList.value.forEach(it => { if (selectForm.subtypeId === it.id) params.subtypeName = it.name })
      params.svcs = selectForm.svcs
        .map(id => { const item = typeOption.value.find(ag => ag.id === id) || {}; return { id: item.id, name: item.name } })
        .filter(it => it.name && it.id)
      await privatelineSvcGroup.save(params)
      ElMessage.success('保存成功')
      getTableData()
      cancel()
    } finally {
      formLoading.value = false
    }
  })
}

onMounted(() => { getSubtypeList(); getTableData(1) })
</script>

<style lang="scss" scoped>
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
