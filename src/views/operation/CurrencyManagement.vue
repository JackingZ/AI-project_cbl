<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增货币</el-button>
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
        <template #col-country="{ row }">
          {{ (row.countries || []).map(c => c.countryName).join('、') || '—' }}
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="中文名称" prop="name">
          <el-input v-model="form.name" :maxlength="20" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="货币编码" prop="ccode">
          <el-input v-model="form.ccode" :maxlength="3" show-word-limit :disabled="dialog.isEdit" placeholder="3 位字母，如 USD" />
        </el-form-item>
        <el-form-item label="货币符号" prop="sign">
          <el-input v-model="form.sign" :maxlength="3" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="通用国家" prop="countryKeys">
          <el-input :model-value="`已选择(${form.countryKeys.length})`" readonly>
            <template #append>
              <el-button :icon="Search" @click="openCountry">选择</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </Modal>

    <Modal v-model="countryDialog.visible" title="关联货币通用国家/地区" width="720px" @confirm="confirmCountry">
      <el-transfer
        v-model="countryKeysTmp"
        :data="countryTransferData"
        :titles="['可选', '已选择']"
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
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required, noChineseRule, letterRule } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { currencyApi, COUNTRY_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpCurrency' })
const { query, list, total, loading, loadData } = useListQuery(currencyApi.list, {})
const { can } = usePagePerms()

const columns = [
  { prop: 'name', label: '中文名称', minWidth: 120 },
  { prop: 'alias', label: '英文名称', minWidth: 140 },
  { prop: 'ccode', label: '货币编码', width: 110 },
  { prop: 'sign', label: '货币符号', width: 100, align: 'center' },
  { prop: 'country', label: '通用国家', minWidth: 200 }
]

const rules = {
  name: [required('中文名称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')],
  ccode: [required('货币编码不能为空'), letterRule('货币编码只能包含字母', { length: 3 })],
  sign: [required('货币符号不能为空'), noChineseRule('货币符号不能是中文')],
  countryKeys: [{ required: true, type: 'array', min: 1, message: '通用国家不能为空', trigger: 'change' }]
}

const countryTransferData = computed(() => COUNTRY_OPTIONS.map(c => ({ key: c.id, label: `${c.name}-${c.alias}` })))

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const form = reactive({ name: '', alias: '', ccode: '', sign: '', countryKeys: [] })

const openAdd = () => {
  Object.assign(form, { name: '', alias: '', ccode: '', sign: '', countryKeys: [] })
  Object.assign(dialog, { visible: true, title: '新增货币', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, alias: row.alias, ccode: row.ccode, sign: row.sign,
    countryKeys: (row.countries || []).map(c => c.countryId)
  })
  Object.assign(dialog, { visible: true, title: '编辑货币', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const buildCountries = keys => COUNTRY_OPTIONS
  .filter(c => keys.includes(c.id))
  .map(c => ({ countryId: c.id, countryName: `${c.name}-${c.alias}` }))
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { name: form.name, alias: form.alias, ccode: form.ccode, sign: form.sign, countries: buildCountries(form.countryKeys) }
    if (dialog.isEdit) {
      await currencyApi.update(dialog.id, payload)
      ElMessage.success('编辑成功')
    } else {
      await currencyApi.add(payload)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await currencyApi.remove(row.id); loadData() },
    '删除货币将导致无法继续使用，确定要删除吗？')

// 通用国家穿梭（在新增/编辑弹窗内二次选择）
const countryDialog = reactive({ visible: false })
const countryKeysTmp = ref([])
const openCountry = () => { countryKeysTmp.value = [...form.countryKeys]; countryDialog.visible = true }
const confirmCountry = () => { form.countryKeys = [...countryKeysTmp.value]; countryDialog.visible = false }
</script>

<style scoped lang="scss">
.op-toolbar { margin-bottom: $space-md; }
</style>
