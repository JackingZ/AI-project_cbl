<template>
  <div>
    <div style="margin-bottom: 10px">
      <el-button type="primary" size="small" :icon="CirclePlus" @click="handleAdd">新增</el-button>
    </div>
    <el-table v-loading="loading" :data="tableData" border style="width: 100%">
      <el-table-column label="生效日期" width="180">
        <template #default="scope">{{ scope.row.date }}</template>
      </el-table-column>
      <el-table-column label="燃油费率" width="150">
        <template #default="scope">{{ scope.row.rate }}</template>
      </el-table-column>
      <el-table-column label="操作" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" :page-size="size" layout="total, prev, pager, next" :total="total" style="text-align: right; margin-top: 10px" @current-change="getTableList()" />

    <!-- 新增/编辑燃油费率 -->
    <Modal v-model="isAddEditVisible" :title="title" width="600px" append-to-body :confirm-loading="dialogLoading" @confirm="saveConfirm" @closed="cancel">
      <el-form ref="editFormRef" :model="selectForm" :rules="formRules" size="small" label-width="120px">
        <el-form-item label="生效日期" prop="date">
          <el-date-picker v-model="selectForm.date" type="date" value-format="YYYY-MM-DD" placeholder="请选择生效日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="燃油费率(%)" prop="rate">
          <el-input v-model="selectForm.rate" :maxlength="50" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { getRateList, updateRate, deleteRate } from '@/api/modules/business'

defineOptions({ name: 'ExpressPortOil' })

const loading = ref(false)
const dialogLoading = ref(false)
const isAddEditVisible = ref(false)
const isEdit = ref(false)
const title = ref('')
const currentPort = ref({})
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const editFormRef = ref()

const selectForm = reactive({ id: undefined, date: undefined, rate: undefined })
const formRules = {
  date: [required('请选择生效日期', 'change')],
  rate: [required('燃油费率不能为空', 'blur')]
}

const setData = row => {
  currentPort.value = row || {}
  title.value = `${(row || {}).codes}/${(row || {}).interfaceCode}`
  page.value = 1
  getTableList()
}
const getTableList = async () => {
  loading.value = true
  try {
    const res = (await getRateList({ current: page.value, size: size.value, portId: currentPort.value.id })).data || {}
    tableData.value = res.result || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}
const handleAdd = () => { isEdit.value = false; isAddEditVisible.value = true }
const handleEdit = row => {
  isEdit.value = true
  Object.assign(selectForm, { id: row.id, date: row.date, rate: row.rate })
  isAddEditVisible.value = true
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', closeOnClickModal: false })
    .then(async () => { await deleteRate({ ids: [row.id] }); ElMessage.success('删除成功'); getTableList() })
    .catch(() => {})
}
const saveConfirm = () => {
  editFormRef.value.validate(async valid => {
    if (!valid) return
    dialogLoading.value = true
    try {
      await updateRate({ ...selectForm, portId: currentPort.value.id })
      ElMessage.success('操作成功')
      isAddEditVisible.value = false
      getTableList()
    } finally {
      dialogLoading.value = false
    }
  })
}
const cancel = () => {
  Object.assign(selectForm, { id: undefined, date: undefined, rate: undefined })
  editFormRef.value && editFormRef.value.clearValidate()
}

defineExpose({ setData })
</script>
