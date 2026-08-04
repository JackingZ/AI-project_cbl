<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增国际航线</el-button>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="120"
        @change="loadData"
      >
        <template #col-type="{ row }">{{ typeLabel(row.type) }}</template>
        <template #col-country="{ row }">
          {{ (row.countries || []).map(c => c.countryName).join('、') || '—' }}
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="航线类型" prop="type">
          <el-select v-model="form.type" style="width: 100%" placeholder="请选择">
            <el-option v-for="t in ROUTE_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="国际航线名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="关联国家/地区" prop="countryKeys">
          <el-input :model-value="`已选择(${form.countryKeys.length})`" readonly>
            <template #append>
              <el-button :icon="Search" @click="openCountry">选择</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" :maxlength="100" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <Modal v-model="countryDialog.visible" title="关联国家/地区" width="720px" @confirm="confirmCountry">
      <el-transfer
        v-model="countryKeysTmp"
        :data="countryTransferData"
        :titles="['关联国家/地区', '已选择']"
        filterable
        filter-placeholder="输入名称查找"
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
import { required } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { flightApi, ROUTE_TYPES, COUNTRY_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpFlight' })
const { query, list, total, loading, loadData } = useListQuery(flightApi.list, {})

const columns = [
  { prop: 'type', label: '航线类型', width: 100 },
  { prop: 'name', label: '国际航线名称', minWidth: 240 },
  { prop: 'country', label: '关联国家/地区', minWidth: 260 },
  { prop: 'createTime', label: '添加时间', width: 170 }
]
const typeLabel = v => ROUTE_TYPES.find(t => t.value === v)?.label || v

const rules = {
  type: [required('国际航线类型不能为空', 'change')],
  name: [required('国际航线名称不能为空')],
  countryKeys: [{ required: true, type: 'array', min: 1, message: '请选择国家/地区', trigger: 'change' }]
}

const countryTransferData = computed(() => COUNTRY_OPTIONS.map(c => ({ key: c.id, label: `${c.name}-${c.alias}` })))

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const form = reactive({ type: '0', name: '', countryKeys: [], remark: '' })

const openAdd = () => {
  Object.assign(form, { type: '0', name: '', countryKeys: [], remark: '' })
  Object.assign(dialog, { visible: true, title: '新增国际航线', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    type: row.type, name: row.name, remark: row.remark || '',
    countryKeys: (row.countries || []).map(c => c.countryId)
  })
  Object.assign(dialog, { visible: true, title: '编辑国际航线', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const buildCountries = keys => COUNTRY_OPTIONS
  .filter(c => keys.includes(c.id))
  .map(c => ({ countryId: c.id, countryName: `${c.name}-${c.alias}` }))
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { type: form.type, name: form.name, remark: form.remark, countries: buildCountries(form.countryKeys) }
    if (dialog.isEdit) {
      await flightApi.update(dialog.id, payload)
      ElMessage.success('编辑成功')
    } else {
      await flightApi.add(payload)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await flightApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')

const countryDialog = reactive({ visible: false })
const countryKeysTmp = ref([])
const openCountry = () => { countryKeysTmp.value = [...form.countryKeys]; countryDialog.visible = true }
const confirmCountry = () => { form.countryKeys = [...countryKeysTmp.value]; countryDialog.visible = false }
</script>

<style scoped lang="scss">
.op-toolbar { margin-bottom: $space-md; }
</style>
