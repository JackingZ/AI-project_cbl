<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增禁忌词语</el-button>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="150"
        @change="loadData"
      >
        <template #col-country="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openCountry(row)">关联国家</el-button>
        </template>
        <template #col-degree="{ row }">{{ row.degree === '0' ? '禁止运输' : '需提供证书' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="禁忌词语" prop="words">
          <el-input v-model="form.words" type="textarea" :rows="3"
            placeholder="请输入禁忌词语，用英语括号表示英文名称，多个词语请用英文逗号,间隔" />
        </el-form-item>
        <el-form-item label="禁忌程度" prop="degree">
          <el-radio-group v-model="form.degree">
            <el-radio value="0">禁止运输</el-radio>
            <el-radio value="1">需提供证书</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>

    <Modal v-model="countryDialog.visible" title="关联国家" width="720px" :confirm-loading="countryDialog.loading" @confirm="submitCountry">
      <el-transfer
        v-model="countryKeys"
        :data="countryTransferData"
        :titles="['选择国家/地区', '已关联国家/地区']"
        filterable
        filter-placeholder="输入名称查找"
      />
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
import { required } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { tabooApi, COUNTRY_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpTaboo' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData } = useListQuery(tabooApi.list, {})

const columns = [
  { prop: 'words', label: '禁忌词语', minWidth: 250 },
  { prop: 'country', label: '禁忌国家', minWidth: 150 },
  { prop: 'degree', label: '禁忌程度', minWidth: 150 }
]

const rules = {
  words: [required('禁忌词语不能为空')],
  degree: [required('请选择禁忌程度', 'change')]
}

// 新增/编辑
const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const form = reactive({ words: '', degree: '0' })

const openAdd = () => {
  Object.assign(form, { words: '', degree: '0' })
  Object.assign(dialog, { visible: true, title: '新增禁忌词语', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { words: row.words, degree: row.degree })
  Object.assign(dialog, { visible: true, title: '编辑禁忌词语', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await tabooApi.update(dialog.id, { words: form.words, degree: form.degree })
      ElMessage.success('编辑成功')
    } else {
      await tabooApi.add({ words: form.words, degree: form.degree, countries: [] })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmDelete(async () => { await tabooApi.remove(row.id); loadData() },
    '删除禁忌词语将导致无法继续使用，确定要删除吗？')

// 关联国家穿梭
const countryTransferData = computed(() => COUNTRY_OPTIONS.map(c => ({ key: c.id, label: `${c.name}-${c.alias}` })))
const countryDialog = reactive({ visible: false, loading: false, id: null })
const countryKeys = ref([])
const openCountry = row => {
  countryDialog.id = row.id
  countryKeys.value = (row.countries || []).map(c => c.countryId)
  countryDialog.visible = true
}
const submitCountry = async () => {
  countryDialog.loading = true
  try {
    const countries = COUNTRY_OPTIONS
      .filter(c => countryKeys.value.includes(c.id))
      .map(c => ({ countryId: c.id, countryName: `${c.name}-${c.alias}` }))
    await tabooApi.update(countryDialog.id, { countries })
    ElMessage.success('提交成功')
    countryDialog.visible = false
    loadData()
  } finally {
    countryDialog.loading = false
  }
}
</script>

<style scoped lang="scss">
.op-toolbar { margin-bottom: $space-md; }
</style>
