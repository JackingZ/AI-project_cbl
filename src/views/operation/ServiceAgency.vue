<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增机构</el-button>
        <div class="op-filters">
          <el-select v-model="query.type" placeholder="机构类型" clearable style="width: 120px">
            <el-option v-for="t in AGENCY_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="query.serviceCountry" placeholder="服务国家" clearable filterable style="width: 120px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
          <el-select v-model="query.countryName" placeholder="国家/地区" clearable filterable style="width: 120px" @change="onSearchCountry">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.name" />
          </el-select>
          <el-select v-model="query.stateName" placeholder="州/省" clearable filterable :disabled="!query.countryName" style="width: 130px" @change="onSearchState">
            <el-option v-for="s in searchStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="query.cityName" placeholder="城市" clearable filterable :disabled="!query.stateName" style="width: 130px">
            <el-option v-for="c in searchCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-input v-model="query.name" clearable placeholder="请输入机构名称关键字" style="width: 180px" />
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
        <template #col-type="{ row }">{{ typeLabel(row.type) }}</template>
        <template #col-serviceCountry="{ row }">
          <el-button link type="primary" size="small" @click="openCountry(row)">服务国家</el-button>
        </template>
        <template #col-region="{ row }">
          <span v-if="row.stateName">{{ row.stateName }}</span>
          <span v-if="row.cityName"> &gt; {{ row.cityName }}</span>
        </template>
        <template #col-url="{ row }">
          <a :href="row.url" target="_blank" style="color: var(--el-color-primary)">点击访问</a>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑机构 -->
    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑机构' : '新增机构'" width="960px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="agency-form">
        <el-form-item label="机构类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%">
            <el-option v-for="t in AGENCY_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="国家/地区" prop="countryName">
          <el-select v-model="form.countryName" filterable placeholder="请选择" style="width: 100%" @change="onFormCountry">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="stateName">
          <el-select v-model="form.stateName" filterable clearable :disabled="!form.countryName" placeholder="请选择" style="width: 100%" @change="onFormState">
            <el-option v-for="s in formStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="cityName">
          <el-select v-model="form.cityName" filterable clearable :disabled="!form.stateName" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in formCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务国家" prop="serviceIds">
          <el-input :model-value="`已选择(${form.serviceIds.length})`" readonly>
            <template #append><el-button :icon="Search" @click="openCountryForm" /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="机构名称" prop="name">
          <el-input v-model="form.name" clearable :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" clearable :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="全球代码" prop="code">
          <el-input v-model="form.code" clearable :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="链接网址" prop="url">
          <el-input v-model="form.url" clearable :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="logo">
          <el-upload
            class="agency-logo"
            :show-file-list="false"
            :auto-upload="false"
            :on-change="onLogoChange"
          >
            <img v-if="form.logo" :src="form.logo" class="agency-logo__img" />
            <el-icon v-else class="agency-logo__icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 服务国家穿梭（表单内 + 列内共用） -->
    <Modal v-model="countryDialog.visible" title="关联服务国家" width="720px" @confirm="confirmCountry">
      <el-transfer
        v-model="countryKeysTmp"
        :data="countryTransferData"
        :titles="['关联服务国家', '已选择']"
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
import { confirmThen } from '@/utils'
import {
  agencyApi, AGENCY_TYPE_OPTIONS, COUNTRY_OPTIONS, getStateOpts, getCityOpts
} from '@/api/modules/operation'

defineOptions({ name: 'OpAgency' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(agencyApi.list, {
  type: '', serviceCountry: '', countryName: '', stateName: '', cityName: '', name: ''
})

const columns = [
  { prop: 'type', label: '机构类型', width: 100 },
  { prop: 'name', label: '机构名称', minWidth: 150 },
  { prop: 'alias', label: '英文名称', minWidth: 150 },
  { prop: 'code', label: '全球代码', width: 120 },
  { prop: 'serviceCountry', label: '服务国家', width: 100 },
  { prop: 'countryName', label: '国家/地区', width: 180 },
  { prop: 'region', label: '州省市区', width: 200 },
  { prop: 'url', label: '网址链接', width: 100 }
]
const typeLabel = v => AGENCY_TYPE_OPTIONS.find(t => t.value === v)?.label || v

// URL 校验（http/https 开头，非必填）
const urlRule = {
  validator: (r, v, cb) => (v && !/^https?:\/\/.+/.test(v)) ? cb(new Error('请输入以http(s)://开头的正确格式网址')) : cb(),
  trigger: 'blur'
}
const codeRule = {
  validator: (r, v, cb) => (v && !/^[a-zA-Z0-9\s]*$/.test(v)) ? cb(new Error('全球代码只能包含数字、字母')) : cb(),
  trigger: 'blur'
}
const rules = {
  type: [required('请选择机构类型', 'change')],
  countryName: [required('请选择国家或地区', 'change')],
  stateName: [required('请选择州/省', 'change')],
  cityName: [required('请选择城市', 'change')],
  serviceIds: [{ required: true, type: 'array', min: 1, message: '请选择服务国家或地区', trigger: 'change' }],
  name: [required('机构名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')],
  code: [required('全球代码不能为空'), codeRule],
  url: [urlRule]
}

// 筛选区地区联动
const searchStateOpts = computed(() => query.countryName ? getStateOpts(query.countryName) : [])
const searchCityOpts = computed(() => query.countryName && query.stateName ? getCityOpts(query.countryName, query.stateName) : [])
const onSearchCountry = () => { query.stateName = ''; query.cityName = '' }
const onSearchState = () => { query.cityName = '' }

// 表单地区联动
const formStateOpts = computed(() => form.countryName ? getStateOpts(form.countryName) : [])
const formCityOpts = computed(() => form.countryName && form.stateName ? getCityOpts(form.countryName, form.stateName) : [])
const onFormCountry = () => { form.stateName = ''; form.cityName = '' }
const onFormState = () => { form.cityName = '' }

const defaultForm = () => ({
  type: '', countryName: '', stateName: '', cityName: '',
  serviceIds: [], serviceNames: [], name: '', alias: '', code: '', url: '', logo: ''
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

// logo 读为 base64（原型无 OSS，本地预览存储）
const onLogoChange = file => {
  const raw = file.raw
  if (!raw || !raw.type.startsWith('image/')) return ElMessage.error('请上传图片格式文件')
  if (raw.size / 1024 / 1024 > 2) return ElMessage.error('图片大小不能超过 2MB')
  const reader = new FileReader()
  reader.onload = e => { form.logo = e.target.result }
  reader.readAsDataURL(raw)
}

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    type: row.type, countryName: row.countryName, stateName: row.stateName, cityName: row.cityName,
    serviceIds: [...(row.serviceIds || [])], serviceNames: [...(row.serviceNames || [])],
    name: row.name, alias: row.alias, code: row.code, url: row.url, logo: row.logo || ''
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const serviceNames = COUNTRY_OPTIONS.filter(c => form.serviceIds.includes(c.id)).map(c => c.name)
    const payload = { ...form, serviceNames }
    if (dialog.isEdit) await agencyApi.update(dialog.id, payload)
    else await agencyApi.add(payload)
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('请确认是否删除该条数据?', async () => { await agencyApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })

// ===== 服务国家穿梭（表单内 + 列内直接编辑共用） =====
const countryTransferData = computed(() => COUNTRY_OPTIONS.map(c => ({ key: c.id, label: `${c.name}-${c.alias}` })))
const countryDialog = reactive({ visible: false, mode: 'form', rowId: null }) // form=表单内 / row=列内直接保存
const countryKeysTmp = ref([])
const openCountryForm = () => { countryDialog.mode = 'form'; countryKeysTmp.value = [...form.serviceIds]; countryDialog.visible = true }
const openCountry = row => { countryDialog.mode = 'row'; countryDialog.rowId = row.id; countryKeysTmp.value = [...(row.serviceIds || [])]; countryDialog.visible = true }
const confirmCountry = async () => {
  if (countryDialog.mode === 'form') {
    form.serviceIds = [...countryKeysTmp.value]
  } else {
    const serviceNames = COUNTRY_OPTIONS.filter(c => countryKeysTmp.value.includes(c.id)).map(c => c.name)
    await agencyApi.update(countryDialog.rowId, { serviceIds: [...countryKeysTmp.value], serviceNames })
    ElMessage.success('操作成功')
    loadData()
  }
  countryDialog.visible = false
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; flex-wrap: wrap; gap: $space-sm; justify-content: flex-end; }
.agency-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.5%; }
}
.agency-logo {
  &__img { width: 80px; height: 80px; object-fit: contain; border: 1px solid var(--el-border-color); border-radius: 4px; }
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 4px;
    width: 80px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  &__icon { font-size: 24px; color: #8c939d; }
}
</style>
