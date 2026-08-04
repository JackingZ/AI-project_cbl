<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增</el-button>
        <div class="op-filters">
          <el-input v-model="query.name" placeholder="规格名称" style="width: 180px" />
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
        <template #col-umLength="{ row }">{{ unitLabel(row.umLength, LENGTH_UNITS) }}</template>
        <template #col-umWeight="{ row }">{{ unitLabel(row.umWeight, WEIGHT_UNITS) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑航空板' : '新增航空板'" width="900px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="unit-form">
        <el-form-item label="规格名称" prop="name">
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
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="form.umWeight" placeholder="请选择" style="width: 100%">
            <el-option v-for="u in WEIGHT_UNITS" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度" prop="length">
          <el-input-number v-model="form.length" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="宽度" prop="width">
          <el-input-number v-model="form.width" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度" prop="height">
          <el-input-number v-model="form.height" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支持最大体积" prop="volume">
          <el-input-number v-model="form.volume" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支持最大重量" prop="loadLimit">
          <el-input-number v-model="form.loadLimit" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
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
import { plateApi, LENGTH_UNITS, WEIGHT_UNITS, LENGTH_TO_VOLUME } from '@/api/modules/operation'

defineOptions({ name: 'OpPlate' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(plateApi.list, { name: '' })

const columns = [
  { prop: 'name', label: '规格名称', minWidth: 140 },
  { prop: 'alias', label: '英文名称', minWidth: 120 },
  { prop: 'length', label: '长', minWidth: 100 },
  { prop: 'width', label: '宽', minWidth: 100 },
  { prop: 'height', label: '高', minWidth: 100 },
  { prop: 'volume', label: '支持最大体积', minWidth: 110 },
  { prop: 'loadLimit', label: '支持最大重量', minWidth: 110 },
  { prop: 'umLength', label: '长度单位', minWidth: 100 },
  { prop: 'umWeight', label: '重量单位', minWidth: 100 }
]
const unitLabel = (v, list) => list.find(u => u.value === v)?.label || v

// umVolume 界面无控件（源保留字段但无下拉，onLength 仍联动赋值）；故不设 umVolume 校验
const rules = {
  name: [required('规格名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')],
  umLength: [required('长度单位不能为空', 'change')],
  umWeight: [required('重量单位不能为空', 'change')],
  length: [required('长度不能为空')],
  width: [required('宽度不能为空')],
  height: [required('高度不能为空')],
  volume: [required('体积不能为空', 'change')],
  loadLimit: [required('重量不能为空')]
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
      await plateApi.update(dialog.id, { ...form })
      ElMessage.success('操作成功')
    } else {
      await plateApi.add({ ...form })
      ElMessage.success('操作成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await plateApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')
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
