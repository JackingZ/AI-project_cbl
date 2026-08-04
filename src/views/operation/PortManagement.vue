<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增港口</el-button>
        <div class="op-filters">
          <el-select v-model="query.type" placeholder="港口类型" clearable filterable style="width: 130px">
            <el-option v-for="t in PORT_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="query.countryName" placeholder="所在国家" clearable filterable style="width: 130px" @change="onSearchCountry">
            <el-option v-for="c in countryOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-select v-model="query.stateName" placeholder="州/省" clearable filterable :disabled="!query.countryName" style="width: 130px" @change="onSearchState">
            <el-option v-for="s in searchStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="query.cityName" placeholder="城市" clearable filterable :disabled="!query.stateName" style="width: 130px">
            <el-option v-for="c in searchCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 280px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option label="港口名称" value="1" />
                <el-option label="三字代码" value="2" />
              </el-select>
            </template>
          </el-input>
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
        :action-width="130"
        @change="loadData"
      >
        <template #col-type="{ row }">{{ portTypeLabel(row.type) }}</template>
        <template #col-region="{ row }">
          <span v-if="row.stateName">{{ row.stateName }}</span>
          <span v-if="row.cityName"> &gt; {{ row.cityName }}</span>
          <span v-if="row.countyName"> &gt; {{ row.countyName }}</span>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" title="机场港口" width="960px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="port-form">
        <el-form-item label="国家/地区" prop="countryName">
          <el-select v-model="form.countryName" filterable clearable placeholder="请选择" style="width: 100%" @change="onFormCountry">
            <el-option v-for="c in countryOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="stateName">
          <el-select v-model="form.stateName" filterable clearable :disabled="!form.countryName" placeholder="请选择" style="width: 100%" @change="onFormState">
            <el-option v-for="s in formStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="cityName">
          <el-select v-model="form.cityName" filterable clearable :disabled="!form.stateName" placeholder="请选择" style="width: 100%" @change="onFormCity">
            <el-option v-for="c in formCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="区/县" prop="countyName">
          <el-select v-model="form.countyName" filterable clearable :disabled="!form.cityName" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in formCountyOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="港口类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
            <el-option v-for="t in PORT_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="港口名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="三字代码" prop="code">
          <el-input v-model="form.code" :maxlength="8" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细邮编" prop="postal">
          <el-input v-model="form.postal" :maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="海关" prop="hsName">
          <el-select v-model="form.hsName" filterable clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="h in CUSTOMS_OPTIONS" :key="h" :label="h" :value="h" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required, noChineseRule } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import {
  portApi, PORT_TYPE_OPTIONS, CUSTOMS_OPTIONS,
  getCountryOpts, getStateOpts, getCityOpts, getCountyOpts
} from '@/api/modules/operation'

defineOptions({ name: 'OpPort' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(portApi.list, {
  type: '', countryName: '', stateName: '', cityName: '', keyword: '', selectType: '1'
})
const { can } = usePagePerms()

const columns = [
  { prop: 'type', label: '港口类型', width: 120 },
  { prop: 'name', label: '港口名称', minWidth: 180 },
  { prop: 'alias', label: '英文名称', minWidth: 180 },
  { prop: 'code', label: '三字代码', width: 120 },
  { prop: 'countryName', label: '国家/地区', width: 180 },
  { prop: 'region', label: '州省市区', width: 200 },
  { prop: 'hsName', label: '海关', width: 120 },
  { prop: 'createTime', label: '添加时间', width: 170 }
]
const portTypeLabel = v => PORT_TYPE_OPTIONS.find(t => t.value === v)?.label || v

// 三字代码校验：数字字母、不少于三位（文案对齐源）
const codeRule = {
  validator: (rule, value, cb) => {
    if (!value) return cb(new Error('三字代码不能为空'))
    if (!/^[a-zA-Z0-9]*$/.test(value)) return cb(new Error('三字代码只能是数字、字母'))
    if (value.length < 3) return cb(new Error('三字代码不能少于三位'))
    cb()
  },
  trigger: 'blur'
}
// 详细邮编校验：只能数字字母（对齐源）
const postalRule = {
  validator: (rule, value, cb) => {
    if (!value) return cb(new Error('详细邮编不能为空'))
    if (!/^[a-zA-Z0-9]*$/.test(value)) return cb(new Error('详细邮编只能是数字、字母'))
    cb()
  },
  trigger: 'blur'
}
const rules = {
  countryName: [required('请选择国家/地区', 'change')],
  stateName: [required('请选择州/省', 'change')],
  cityName: [required('请选择城市', 'change')],
  // countyId 源为非必填，故不设规则
  type: [{ required: true, message: '请选择港口类型' }],
  name: [required('港口名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能为中文')],
  code: [required('三字代码不能为空'), codeRule],
  address: [required('详细地址不能为空')],
  postal: [required('详细邮编不能为空'), postalRule]
}

// 筛选区地区联动
const countryOpts = getCountryOpts()
const searchStateOpts = computed(() => query.countryName ? getStateOpts(query.countryName) : [])
const searchCityOpts = computed(() => query.countryName && query.stateName ? getCityOpts(query.countryName, query.stateName) : [])
const onSearchCountry = () => { query.stateName = ''; query.cityName = '' }
const onSearchState = () => { query.cityName = '' }

// 表单地区联动
const formStateOpts = computed(() => form.countryName ? getStateOpts(form.countryName) : [])
const formCityOpts = computed(() => form.countryName && form.stateName ? getCityOpts(form.countryName, form.stateName) : [])
const formCountyOpts = computed(() => form.countryName && form.stateName && form.cityName ? getCountyOpts(form.countryName, form.stateName, form.cityName) : [])
const onFormCountry = () => { form.stateName = ''; form.cityName = ''; form.countyName = '' }
const onFormState = () => { form.cityName = ''; form.countyName = '' }
const onFormCity = () => { form.countyName = '' }

const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive({ type: '', name: '', alias: '', code: '', countryName: '', stateName: '', cityName: '', countyName: '', address: '', postal: '', hsName: '' })

const defaultForm = () => ({ type: '', name: '', alias: '', code: '', countryName: '', stateName: '', cityName: '', countyName: '', address: '', postal: '', hsName: '' })
const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    type: row.type, name: row.name, alias: row.alias, code: row.code,
    countryName: row.countryName, stateName: row.stateName, cityName: row.cityName, countyName: row.countyName,
    address: row.address, postal: row.postal, hsName: row.hsName
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { ...form, region: [form.countryName, form.stateName, form.cityName, form.countyName].filter(Boolean) }
    if (dialog.isEdit) {
      await portApi.update(dialog.id, payload)
      ElMessage.success('编辑成功')
    } else {
      await portApi.add(payload)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await portApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-sm;
  justify-content: flex-end;
}
.port-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.5%; }
}
</style>
