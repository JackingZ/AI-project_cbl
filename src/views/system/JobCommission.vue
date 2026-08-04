<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="岗位名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="120" @change="loadData">
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑岗位提成' : '新增岗位提成'" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="岗位名称" prop="name"><el-input v-model="form.name" :maxlength="30" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="计量方式" prop="measure">
          <el-select v-model="form.measure" placeholder="请选择" style="width: 100%"><el-option v-for="m in MEASURE_TYPES" :key="m" :label="m" :value="m" /></el-select>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%"><el-option v-for="u in MEASURE_UNITS" :key="u" :label="u" :value="u" /></el-select>
        </el-form-item>
        <el-form-item label="版本" prop="version"><el-input v-model="form.version" placeholder="如 v1.0" /></el-form-item>
        <el-form-item label="区间阶梯" prop="sections">
          <div v-for="(item, index) in form.sections" :key="index" class="section-row">
            <el-input-number v-model="item.lower" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="下限" style="width: 130px" />
            <span class="section-row__sep">~</span>
            <el-input-number v-model="item.upper" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="上限" style="width: 130px" />
            <el-input-number v-model="item.amount" :controls="false" :min="0" :max="999999" :precision="2" placeholder="单位金额" style="width: 130px" />
            <el-icon v-if="index === 0" class="section-row__icon" @click="addRange"><CirclePlus /></el-icon>
            <el-icon v-else class="section-row__icon" @click="removeRange(index)"><Remove /></el-icon>
          </div>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, CirclePlus, Remove } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { commissionApi, MEASURE_TYPES, MEASURE_UNITS } from '@/api/modules/system'

defineOptions({ name: 'SysCommission' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(commissionApi.list, { name: '' })

const columns = [
  { prop: 'name', label: '岗位名称', minWidth: 160 },
  { prop: 'measure', label: '计量方式', width: 120 },
  { prop: 'unit', label: '计量单位', width: 110, align: 'center' },
  { prop: 'version', label: '版本', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const rules = {
  name: [required('请输入岗位名称')],
  measure: [required('请选择计量方式', 'change')],
  unit: [required('请选择计量单位', 'change')]
}
const defaultForm = () => ({ name: '', measure: '按重量', unit: 'KG', version: 'v1.0', sections: [{ lower: undefined, upper: undefined, amount: undefined }] })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, measure: row.measure, unit: row.unit, version: row.version,
    sections: (row.sections && row.sections.length) ? row.sections.map(s => ({ ...s })) : [{ lower: undefined, upper: undefined, amount: undefined }]
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const addRange = () => form.sections.push({ lower: undefined, upper: undefined, amount: undefined })
const removeRange = i => form.sections.splice(i, 1)
const submit = async () => {
  await formRef.value.validate()
  const secs = form.sections
  if (!secs.every(s => s.lower != null && s.upper != null && s.amount != null)) {
    return ElMessage.error('请完整填写区间下限/上限/单位金额')
  }
  if (secs.some(s => s.upper <= s.lower)) {
    return ElMessage.error('下限值不能大于等于上限值')
  }
  const overlap = secs.some((it, index) =>
    secs.some((r, i) => i !== index &&
      ((r.lower <= it.lower && it.lower < r.upper) || (r.lower < it.upper && it.upper <= r.upper))))
  if (overlap) return ElMessage.error('区间范围不能重叠')
  dialog.loading = true
  try {
    const payload = { name: form.name, measure: form.measure, unit: form.unit, version: form.version, sections: secs.map(s => ({ ...s })) }
    if (dialog.isEdit) await commissionApi.update(dialog.id, payload)
    else await commissionApi.add(payload)
    ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await commissionApi.remove(row.id); loadData() }, `确定删除岗位提成「${row.name}」吗？`)
</script>

<style scoped lang="scss">
.section-row {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-sm;
  &__sep { color: $text-secondary; }
  &__icon { font-size: 20px; cursor: pointer; color: var(--el-color-primary); }
}
</style>
