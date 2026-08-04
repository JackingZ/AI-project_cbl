<template>
  <PageCard>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane v-for="t in TABS" :key="t.key" :label="t.label" :name="t.key" />
    </el-tabs>

    <div class="op-toolbar">
      <el-button type="primary" :icon="Plus" @click="openAdd">新增{{ curTab.label }}</el-button>
      <div class="op-filters">
        <el-input v-model="query.name" clearable placeholder="区域名称" style="width: 200px" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <ProTable
      v-model:page="query.page"
      v-model:size="query.size"
      :data="list"
      :columns="curTab.columns"
      :loading="loading"
      :total="total"
      :action-width="130"
      @change="loadData"
    >
      <template #col-relation="{ row }">{{ relationText(row) }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <!-- 新增/编辑（区域名 + 国家 + 关联多选穿梭 + 备注） -->
    <Modal v-model="dialog.visible" :title="`${dialog.isEdit ? '编辑' : '新增'}${curTab.label}`" width="600px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="curTab.needCountry" label="国家" prop="countryName">
          <el-select v-model="form.countryName" filterable placeholder="请选择" style="width: 100%" @change="onFormCountry">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item :label="curTab.relationLabel" prop="relationKeys">
          <el-input :model-value="`已选择(${form.relationKeys.length})`" readonly>
            <template #append><el-button :icon="Search" :disabled="curTab.needCountry && !form.countryName" @click="openTransfer" /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :maxlength="100" :rows="2" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 关联多选穿梭 -->
    <Modal v-model="transferDialog.visible" :title="curTab.relationLabel" width="720px" @confirm="confirmTransfer">
      <el-transfer
        v-model="transferKeysTmp"
        :data="transferData"
        :titles="[curTab.relationLabel, '已选择']"
        filterable
        filter-placeholder="输入搜索"
      />
    </Modal>
  </PageCard>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useActivatedRefresh } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import {
  dInternalApi, dCityApi, dCountryApi, dWarehouseApi,
  COUNTRY_OPTIONS, getStateOpts, getCityOpts, fbaApi
} from '@/api/modules/operation'

defineOptions({ name: 'OpDomesticArea' })

// 4 tab 配置：关联对象/列/穿梭选项各异
const baseCols = key => [
  { prop: 'name', label: '区域名称', minWidth: 120 },
  ...(key === 'country' ? [] : [{ prop: 'countryName', label: '国家', minWidth: 120 }]),
  { prop: 'relation', label: { internal: '区内省份', city: '城市', country: '国家', warehouse: 'fba仓库' }[key], minWidth: 250 },
  { prop: 'createTime', label: '添加时间', width: 170 }
]
const TABS = [
  { key: 'internal', label: '国内区域', api: dInternalApi, needCountry: true, relationLabel: '区内省份', relField: 'states', relName: 'stateName', columns: baseCols('internal') },
  { key: 'city', label: '城市分区', api: dCityApi, needCountry: true, relationLabel: '城市', relField: 'result', relName: 'cityName', columns: baseCols('city') },
  { key: 'country', label: '国家分区', api: dCountryApi, needCountry: false, relationLabel: '国家', relField: 'result', relName: 'countryName', columns: baseCols('country') },
  { key: 'warehouse', label: '仓库分区', api: dWarehouseApi, needCountry: true, relationLabel: 'fba仓库', relField: 'result', relName: 'warehouseName', columns: baseCols('warehouse') }
]

const activeTab = ref('internal')
const curTab = computed(() => TABS.find(t => t.key === activeTab.value))

// 列表
const query = reactive({ page: 1, size: 10, name: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const loadData = async () => {
  loading.value = true
  try {
    const res = await curTab.value.api.list(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}
const handleSearch = () => { query.page = 1; loadData() }
const onTabChange = () => { query.page = 1; query.name = ''; loadData() }

// 关联列展示
const relationText = row => {
  const t = curTab.value
  return (row[t.relField] || []).map(x => x[t.relName]).filter(Boolean).join(', ')
}

// 新增/编辑
const rules = {
  name: [required('区域名称不能为空')],
  countryName: [required('请选择国家', 'change')],
  relationKeys: [{ required: true, type: 'array', min: 1, message: '请选择关联项', trigger: 'change' }]
}
const defaultForm = () => ({ name: '', countryName: '', relationKeys: [], remark: '' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())
const onFormCountry = () => { form.relationKeys = [] }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  const t = curTab.value
  Object.assign(form, {
    name: row.name,
    countryName: row.countryName || '',
    relationKeys: (row[t.relField] || []).map(x => x[t.relName]),
    remark: row.remark || ''
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const t = curTab.value
    const relation = form.relationKeys.map(k => ({ [t.relName]: k }))
    const payload = { name: form.name, remark: form.remark, [t.relField]: relation }
    if (t.needCountry) payload.countryName = form.countryName
    if (dialog.isEdit) await t.api.update(dialog.id, payload)
    else await t.api.add(payload)
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('请确认是否删除该条数据?', async () => { await curTab.value.api.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })

// 穿梭
const transferDialog = reactive({ visible: false })
const transferKeysTmp = ref([])
const transferData = computed(() => {
  const key = activeTab.value
  if (key === 'internal') {
    return (form.countryName ? getStateOpts(form.countryName) : []).map(s => ({ key: s.name, label: s.name }))
  }
  if (key === 'city') {
    // 城市：取该国家下全部城市（跨省州汇总）
    const states = form.countryName ? getStateOpts(form.countryName) : []
    const cities = states.flatMap(s => getCityOpts(form.countryName, s.name))
    return cities.map(c => ({ key: c.name, label: c.name }))
  }
  if (key === 'country') {
    return COUNTRY_OPTIONS.map(c => ({ key: c.name, label: `${c.name}-${c.alias}` }))
  }
  // warehouse: FBA 仓库
  return fbaApi.res.raw().map(w => ({ key: `FBA${w.countryName}仓`, label: `FBA${w.countryName}仓 (${w.code})` }))
})
const openTransfer = () => { transferKeysTmp.value = [...form.relationKeys]; transferDialog.visible = true }
const confirmTransfer = () => { form.relationKeys = [...transferKeysTmp.value]; transferDialog.visible = false }

useActivatedRefresh(loadData)
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
</style>
