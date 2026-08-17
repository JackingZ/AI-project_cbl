<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <!-- 公司类型/所属公司 源页注释，保持注释 -->
      <!-- <el-form-item label="公司类型"><el-select v-model="query.comType" clearable style="width: 120px"><el-option v-for="c in COMPANY_TYPE_LIST" :key="c.id" :label="c.name" :value="c.id" /></el-select></el-form-item> -->
      <!-- <el-form-item label="所属公司"><el-select v-model="query.comId" clearable filterable style="width: 160px" /></el-form-item> -->
      <el-form-item label="年度">
        <el-date-picker v-model="query.year" type="year" value-format="YYYY" placeholder="选择年度" clearable style="width: 140px" />
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
      </template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="150" @change="loadData">
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit') || row.status === '1'" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del') || row.status === '1'" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" title="会计期间" width="600px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="年度" prop="year">
          <el-date-picker v-model="form.year" type="year" value-format="YYYY" placeholder="请选择年度" style="width: 100%" @change="onYear" />
        </el-form-item>
        <el-form-item label="会计期间" prop="fiscalPeriod">
          <el-input v-model="form.fiscalPeriod" :maxlength="50" placeholder="请输入会计期间" />
        </el-form-item>
        <el-form-item label="时间区间" prop="time">
          <el-date-picker v-model="form.time" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
            value-format="YYYY-MM-DD" :disabled="!form.year" :disabled-date="disabledByYear" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" :maxlength="100" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete } from '@/utils/index'
import { required } from '@/utils/validate'
import { fiscalApi } from '@/api/modules/financial'

defineOptions({ name: 'FinPeriod' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(fiscalApi.list, { year: '' })
const columns = [
  { prop: 'year', label: '年度', width: 120 },
  { prop: 'fiscalPeriod', label: '会计期间', minWidth: 160 },
  { prop: 'startTime', label: '开始时间', width: 180 },
  { prop: 'endTime', label: '结束时间', width: 180 },
  { prop: 'remarks', label: '备注', minWidth: 160, showOverflowTooltip: true }
]

const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const defaultForm = () => ({ year: '', fiscalPeriod: '', time: [], remarks: '' })
const form = reactive(defaultForm())
const rules = {
  year: [required('请选择年度', 'change')],
  fiscalPeriod: [required('请输入会计期间')],
  time: [required('请选择时间区间', 'change')]
}
// 年度变化清空时间区间（对齐源 @change 清空 form.time）
const onYear = () => { form.time = [] }
// 时间区间限制在所选年度内
const disabledByYear = date => {
  if (!form.year) return false
  return date.getFullYear() !== Number(form.year)
}

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { year: row.year, fiscalPeriod: row.fiscalPeriod, time: [row.startTime, row.endTime], remarks: row.remarks })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { year: form.year, fiscalPeriod: form.fiscalPeriod, startTime: form.time[0], endTime: form.time[1], remarks: form.remarks }
    if (dialog.isEdit) await fiscalApi.update(dialog.id, payload)
    else await fiscalApi.add({ ...payload, status: '0' })
    ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally { dialog.loading = false }
}
const remove = row => confirmDelete(async () => { await fiscalApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')
</script>
