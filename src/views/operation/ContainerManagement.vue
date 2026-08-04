<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增柜型</el-button>
        <div class="op-filters">
          <el-input v-model="query.name" placeholder="车型名称关键字" clearable style="width: 180px" />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="160"
        @change="loadData"
      >
        <template #col-length="{ row }">{{ withUnit(row.length, row.umLength, LENGTH_UNITS) }}</template>
        <template #col-width="{ row }">{{ withUnit(row.width, row.umLength, LENGTH_UNITS) }}</template>
        <template #col-height="{ row }">{{ withUnit(row.height, row.umLength, LENGTH_UNITS) }}</template>
        <template #col-volume="{ row }">{{ withUnit(row.volume, row.umVolume, VOLUME_UNITS) }}</template>
        <template #col-loadLimit="{ row }">{{ withUnit(row.loadLimit, row.umWeight, WEIGHT_UNITS) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑柜型' : '新增柜型'" width="900px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="unit-form">
        <el-form-item label="货柜名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="长度单位" prop="umLength">
          <el-select v-model="form.umLength" placeholder="请选择" style="width: 100%" @change="onLength">
            <el-option v-for="u in LENGTH_UNITS" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="体积单位" prop="umVolume">
          <el-select v-model="form.umVolume" placeholder="请选择" disabled style="width: 100%">
            <el-option v-for="u in VOLUME_UNITS" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="form.umWeight" placeholder="请选择" style="width: 100%">
            <el-option v-for="u in WEIGHT_UNITS" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度" prop="length">
          <el-input-number v-model="form.length" :controls="false" :min="0" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="宽度" prop="width">
          <el-input-number v-model="form.width" :controls="false" :min="0" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度" prop="height">
          <el-input-number v-model="form.height" :controls="false" :min="0" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="装载体积" prop="volume">
          <el-input-number v-model="form.volume" :controls="false" :min="0" :max="99999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大限重" prop="loadLimit">
          <el-input-number v-model="form.loadLimit" :controls="false" :min="0" :max="99999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import { required, noChineseRule } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { containerApi, LENGTH_UNITS, VOLUME_UNITS, WEIGHT_UNITS, LENGTH_TO_VOLUME } from '@/api/modules/operation'

defineOptions({ name: 'OpContainer' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(containerApi.list, { name: '' })

const columns = [
  { prop: 'name', label: '柜型名称', minWidth: 120 },
  { prop: 'alias', label: '英文名称', minWidth: 120 },
  { prop: 'length', label: '柜长', minWidth: 100 },
  { prop: 'width', label: '柜宽', minWidth: 100 },
  { prop: 'height', label: '柜高', minWidth: 100 },
  { prop: 'volume', label: '装载体积', minWidth: 100 },
  { prop: 'loadLimit', label: '最大限重', minWidth: 100 }
]
const withUnit = (val, unit, list) => {
  const t = list.find(u => u.value === unit)
  return t ? `${val} (${t.value})` : val
}

const rules = {
  name: [required('货柜名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')],
  umLength: [required('长度单位不能为空', 'change')],
  umVolume: [required('体积单位不能为空', 'change')],
  umWeight: [required('重量单位不能为空', 'change')],
  length: [required('长度不能为空')],
  width: [required('宽度不能为空')],
  height: [required('高度不能为空')],
  volume: [required('装载体积不能为空', 'change')],
  loadLimit: [required('载重不能为空')]
}

const defaultForm = () => ({
  name: '', alias: '', umLength: undefined, umVolume: undefined, umWeight: undefined,
  length: undefined, width: undefined, height: undefined, volume: undefined, loadLimit: undefined
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const onLength = val => { form.umVolume = LENGTH_TO_VOLUME[val] || undefined }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, alias: row.alias, umLength: row.umLength, umVolume: row.umVolume, umWeight: row.umWeight,
    length: row.length, width: row.width, height: row.height, volume: row.volume, loadLimit: row.loadLimit
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await containerApi.update(dialog.id, { ...form })
      ElMessage.success('操作成功')
    } else {
      await containerApi.add({ ...form })
      ElMessage.success('操作成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await containerApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
.unit-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 50%; }
}
</style>
