<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增车型</el-button>
        <div class="op-filters">
          <el-select v-model="query.countryId" placeholder="国家/地区" filterable clearable style="width: 130px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
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
        <template #col-countries="{ row }">{{ (row.countries || []).map(c => c.countryName).join(', ') }}</template>
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

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑车型' : '新增车型'" width="900px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="unit-form">
        <el-form-item label="国家/地区" prop="area">
          <el-input :model-value="`已选择(${form.area.length})`" readonly>
            <template #append><el-button :icon="Search" @click="openCountry" /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="车型名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="20" placeholder="请输入" />
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
          <el-input-number v-model="form.length" :controls="false" :min="1" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="宽度" prop="width">
          <el-input-number v-model="form.width" :controls="false" :min="1" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="高度" prop="height">
          <el-input-number v-model="form.height" :controls="false" :min="1" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="装载体积" prop="volume">
          <el-input-number v-model="form.volume" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大限重" prop="loadLimit">
          <el-input-number v-model="form.loadLimit" :controls="false" :min="0" :max="999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="座位数" prop="seats">
          <el-input-number v-model="form.seats" :controls="false" :step="1" step-strictly :min="1" :max="100" placeholder="请输入" style="width: 100%" />
        </el-form-item>
      </el-form>
    </Modal>

    <Modal v-model="countryDialog.visible" title="国家/地区" width="720px" @confirm="confirmCountry">
      <el-transfer
        v-model="countryKeysTmp"
        :data="countryTransferData"
        :titles="['国家/地区', '已选择']"
        filterable
        filter-placeholder="输入搜索"
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import { required, noChineseRule } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import {
  vehicleApi, COUNTRY_OPTIONS, LENGTH_UNITS, VOLUME_UNITS, WEIGHT_UNITS, LENGTH_TO_VOLUME
} from '@/api/modules/operation'

defineOptions({ name: 'OpVehicle' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(vehicleApi.list, { name: '', countryId: '' })

const columns = [
  { prop: 'countries', label: '国家/地区', minWidth: 200 },
  { prop: 'name', label: '车型名称', minWidth: 120 },
  { prop: 'alias', label: '英文名称', minWidth: 120 },
  { prop: 'length', label: '车长', minWidth: 100 },
  { prop: 'width', label: '车宽', minWidth: 100 },
  { prop: 'height', label: '车高', minWidth: 100 },
  { prop: 'volume', label: '装载体积', minWidth: 100 },
  { prop: 'loadLimit', label: '最大限重', minWidth: 100 },
  { prop: 'seats', label: '座位数', width: 110 }
]
const withUnit = (val, unit, list) => {
  const t = list.find(u => u.value === unit)
  return t ? `${val} (${t.value})` : val
}

const rules = {
  area: [{ required: true, type: 'array', min: 1, message: '国家/地区不能为空', trigger: 'change' }],
  name: [required('车型名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')],
  umLength: [required('长度单位不能为空', 'change')],
  umVolume: [required('体积单位不能为空', 'change')],
  umWeight: [required('重量单位不能为空', 'change')],
  length: [required('长度不能为空')],
  width: [required('宽度不能为空')],
  height: [required('高度不能为空')],
  volume: [required('装载体积不能为空', 'change')],
  loadLimit: [required('载重不能为空')],
  seats: [required('座位数不能为空')]
}

const countryTransferData = computed(() => COUNTRY_OPTIONS.map(c => ({ key: c.id, label: `${c.name}-${c.alias}` })))

const defaultForm = () => ({
  name: '', alias: '', umLength: undefined, umVolume: undefined, umWeight: undefined,
  length: undefined, width: undefined, height: undefined, volume: undefined, loadLimit: undefined, seats: undefined, area: []
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

// 长度单位联动体积单位
const onLength = val => { form.umVolume = LENGTH_TO_VOLUME[val] || undefined }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, alias: row.alias, umLength: row.umLength, umVolume: row.umVolume, umWeight: row.umWeight,
    length: row.length, width: row.width, height: row.height, volume: row.volume, loadLimit: row.loadLimit, seats: row.seats,
    area: (row.countries || []).map(c => c.countryId)
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const countries = COUNTRY_OPTIONS
      .filter(c => form.area.includes(c.id))
      .map(c => ({ countryId: c.id, countryName: `${c.name}-${c.alias}` }))
    const { area, ...rest } = form
    const payload = { ...rest, countries }
    if (dialog.isEdit) {
      await vehicleApi.update(dialog.id, payload)
      ElMessage.success('操作成功')
    } else {
      await vehicleApi.add(payload)
      ElMessage.success('操作成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await vehicleApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')

// 国家/地区穿梭
const countryDialog = reactive({ visible: false })
const countryKeysTmp = ref([])
const openCountry = () => { countryKeysTmp.value = [...form.area]; countryDialog.visible = true }
const confirmCountry = () => { form.area = [...countryKeysTmp.value]; countryDialog.visible = false }
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
