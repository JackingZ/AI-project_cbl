<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="车牌号"><el-input v-model="query.plateNo" placeholder="请输入车牌号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="车型">
        <el-select v-model="query.vehicleType" placeholder="全部" clearable style="width: 120px"><el-option v-for="t in CAR_TYPES" :key="t" :label="t" :value="t" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="120" @change="loadData">
        <template #col-tailBoard="{ row }">{{ row.tailBoard === '有' ? '√' : '×' }}</template>
        <template #col-gps="{ row }">{{ row.gps === '有' ? '√' : '×' }}</template>
        <template #col-status="{ row }">
          <el-switch :model-value="normalizeSwitchValue(row.status, '启用', '禁用')" active-value="启用" inactive-value="禁用" :disabled="!can('edit')" @change="v => toggle(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑车辆' : '新增车辆'" width="760px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="car-form">
        <el-form-item label="车牌号" prop="plateNo"><el-input v-model="form.plateNo" :maxlength="12" placeholder="请输入车牌号" /></el-form-item>
        <el-form-item label="关联车型" prop="vehicleType">
          <el-select v-model="form.vehicleType" placeholder="请选择" style="width: 100%"><el-option v-for="t in CAR_TYPES" :key="t" :label="t" :value="t" /></el-select>
        </el-form-item>
        <el-form-item label="车况" prop="condition">
          <el-select v-model="form.condition" placeholder="请选择" style="width: 100%"><el-option v-for="c in CAR_CONDITIONS" :key="c" :label="c" :value="c" /></el-select>
        </el-form-item>
        <el-form-item label="保险到期" prop="insureExpire">
          <el-date-picker v-model="form.insureExpire" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="三者险保额" prop="thirdInsure"><el-input v-model="form.thirdInsure" placeholder="如 100万" /></el-form-item>
        <el-form-item label="上牌时间" prop="regDate">
          <el-date-picker v-model="form.regDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否有尾板" prop="tailBoard">
          <el-radio-group v-model="form.tailBoard"><el-radio v-for="o in HAVE_OPTIONS" :key="o" :value="o">{{ o }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="是否有GPS" prop="gps">
          <el-radio-group v-model="form.gps"><el-radio v-for="o in HAVE_OPTIONS" :key="o" :value="o">{{ o }}</el-radio></el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { required } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { carApi, CAR_TYPES, CAR_CONDITIONS, STATUS_OPTIONS } from '@/api/modules/system'

defineOptions({ name: 'SysCar' })
const { can } = usePagePerms()
const HAVE_OPTIONS = ['有', '无']
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(carApi.list, { plateNo: '', vehicleType: '', status: '' })

const columns = [
  { prop: 'plateNo', label: '车牌号', minWidth: 120 },
  { prop: 'vehicleType', label: '关联车型', width: 100 },
  { prop: 'condition', label: '车况', width: 100 },
  { prop: 'insureExpire', label: '保险到期', width: 120 },
  { prop: 'thirdInsure', label: '三者险保额', width: 110 },
  { prop: 'tailBoard', label: '尾板', width: 70, align: 'center' },
  { prop: 'gps', label: 'GPS', width: 70, align: 'center' },
  { prop: 'regDate', label: '上牌时间', width: 120 },
  { prop: 'status', label: '状态', width: 90, align: 'center', fixed: 'right' }
]

const rules = {
  plateNo: [required('请输入车牌号')],
  vehicleType: [required('请选择关联车型', 'change')]
}
const defaultForm = () => ({ plateNo: '', vehicleType: '厢式', condition: '良好', insureExpire: '', thirdInsure: '', tailBoard: '有', gps: '有', regDate: '' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, defaultForm())
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) await carApi.update(dialog.id, { ...form })
    else await carApi.add({ ...form, status: '启用' })
    ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const toggle = async (row, v) => {
  await carApi.update(row.id, { status: v })
  row.status = v
  ElMessage.success(`已${v}`)
}
const remove = row =>
  confirmDelete(async () => { await carApi.remove(row.id); loadData() }, `确定删除车辆「${row.plateNo}」吗？`)
</script>

<style scoped lang="scss">
.car-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.9%; }
}
</style>
