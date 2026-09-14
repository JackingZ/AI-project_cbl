<template>
  <div class="app-panel">
    <el-row>
      <el-col :span="6">
        <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="addServerCode">新增国际分区</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="pagedData" border style="width: 100%; margin: 10px 0">
      <el-table-column min-width="100" prop="name" label="国际分区" />
      <el-table-column label="关联国家/地区" min-width="160">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="relateCountry(scope.row)">关联国家</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" min-width="160" label="添加时间" />
      <el-table-column fixed="right" label="操作" width="160">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="editForm(scope.row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="deletData(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="size"
      layout="total, prev, pager, next"
      :total="total"
      style="text-align: right"
    />

    <!-- 新增/编辑国际分区 -->
    <Modal v-model="isAddEditVisible" :title="dialogTitle" width="550px" @confirm="saveConfirm" @closed="cancel">
      <el-form ref="editFormRef" :model="selectForm" :rules="formRules" label-width="100px" label-position="right">
        <el-form-item label="国际分区" prop="name">
          <el-input v-model="selectForm.name" :maxlength="50" size="small" placeholder="请输入" style="width: 90%" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 关联国家 -->
    <Modal v-model="isRelateVisible" :title="relativeDialogTitle" width="960px" :footer="false" @closed="cancelRelate">
      <div v-loading="countryLoading">
        <el-transfer
          v-model="destinations"
          filterable
          :filter-method="filterMethod"
          :titles="['选择国家/地区', '已选择关联']"
          :props="{ key: 'id', label: 'label' }"
          filter-placeholder="输入搜索"
          :data="allCountry"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="cancelRelate">取 消</el-button>
          <el-button type="primary" size="small" @click="saveRelateConfirm">确 定</el-button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { expressApi, getCountryList } from '@/api/modules/service'

defineOptions({ name: 'ExpressDistinct' })
const props = defineProps({
  localData: { type: Object, default: () => ({}) }
})

const loading = ref(false)
const escId = ref('')
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const currentId = ref('')

const pagedData = computed(() => {
  total.value = tableData.value.length
  const start = (page.value - 1) * size.value
  return tableData.value.slice(start, start + size.value)
})

const queryAll = async val => {
  if (val) page.value = val
  loading.value = true
  try {
    tableData.value = (await expressApi.getDistinctList(escId.value)).data
    total.value = tableData.value.length
  } finally {
    loading.value = false
  }
}

/* 新增/编辑分区 */
const isAddEditVisible = ref(false)
const isEdit = ref(false)
const editFormRef = ref()
const selectForm = reactive({ id: undefined, name: undefined })
const formRules = { name: [{ required: true, message: '服务名称不能为空', trigger: 'blur' }] }
const dialogTitle = computed(() => isEdit.value ? '编辑国际分区' : '新增国际分区')
const addServerCode = () => { isEdit.value = false; isAddEditVisible.value = true }
const editForm = row => { isEdit.value = true; Object.assign(selectForm, { id: undefined, name: undefined }, row); isAddEditVisible.value = true }
const cancel = () => { Object.assign(selectForm, { id: undefined, name: undefined }); editFormRef.value && editFormRef.value.clearValidate() }
const saveConfirm = () => {
  editFormRef.value.validate(async valid => {
    if (!valid) return
    await expressApi.saveDistinct(escId.value, { ...selectForm })
    ElMessage.success('保存成功')
    isAddEditVisible.value = false
    queryAll()
  })
}
const deletData = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await expressApi.removeDistinct(escId.value, row.id); ElMessage.success('删除成功'); queryAll() })
    .catch(() => {})
}

/* 关联国家 */
const isRelateVisible = ref(false)
const countryLoading = ref(false)
const allCountry = ref([])
const destinations = ref([])
const relateName = ref('')
const relativeDialogTitle = computed(() => `关联国家/地区【${relateName.value}】`)
const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1
const getAllCountry = async () => {
  allCountry.value = (await getCountryList()).data.map(ele => ({ ...ele, label: `${ele.name}-${ele.alias}`, key: ele.id, disabled: false }))
}
const relateCountry = async row => {
  relateName.value = row.name
  currentId.value = row.id
  isRelateVisible.value = true
  countryLoading.value = true
  try {
    destinations.value = (await expressApi.getDistinctRelate(row.id)).data.map(ele => ele.countryId)
  } finally {
    countryLoading.value = false
  }
}
const cancelRelate = () => { isRelateVisible.value = false; destinations.value = [] }
const saveRelateConfirm = async () => {
  const countries = allCountry.value
    .filter(ele => destinations.value.some(d => ele.id === d))
    .map(ele => ({ countryId: ele.id, countryName: ele.name }))
  await expressApi.saveDistinctRelate(currentId.value, countries)
  ElMessage.success('保存成功')
  queryAll()
  cancelRelate()
}

onMounted(() => {
  escId.value = props.localData?.id || ''
  if (escId.value) {
    queryAll(1)
    getAllCountry()
  }
})
</script>

<style scoped lang="scss">
.app-panel { padding: 0 10px; }
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
