<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="公司类型">
        <el-select v-model="query.type" placeholder="公司类型" clearable style="width: 120px">
          <el-option v-for="t in ORG_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="岗位名称">
        <el-input v-model="query.name" placeholder="请输入" clearable style="width: 240px">
          <template #prepend>岗位名称</template>
        </el-input>
      </el-form-item>
      <template #actions><el-button type="primary" :icon="Plus" @click="openAdd">新增岗位</el-button></template>
    </SearchBar>
    <PageCard>
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
        <template #col-postType="{ row }">{{ postLabel(row.postType) }}</template>
        <template #col-type="{ row }">{{ typeLabels(row.type) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="企业类型" prop="type">
          <el-select v-model="form.type" multiple collapse-tags filterable clearable style="width: 100%" placeholder="请选择" @change="onType">
            <el-option v-for="t in ORG_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务大类" prop="subtypeId">
          <el-select v-model="form.subtypeId" multiple collapse-tags filterable clearable :disabled="!form.type.length" style="width: 100%" placeholder="请选择">
            <el-option v-for="s in SERVICE_TYPES" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位类别" prop="postType">
          <el-select v-model="form.postType" filterable clearable style="width: 100%" placeholder="请选择">
            <el-option v-for="p in POST_TYPES" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { jobApi, ORG_TYPE_OPTIONS, POST_TYPES, SERVICE_TYPES } from '@/api/modules/operation'

defineOptions({ name: 'OpJob' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(jobApi.list, { name: '', type: '' })

const columns = [
  { prop: 'name', label: '岗位名称', minWidth: 160 },
  { prop: 'postType', label: '岗位类型', width: 150 },
  { prop: 'type', label: '公司类型', minWidth: 120 },
  { prop: 'subtypeName', label: '服务大类', minWidth: 150 },
  { prop: 'createTime', label: '添加时间', width: 170 }
]
const postLabel = v => POST_TYPES.find(p => p.value === v)?.label || v
const typeLabels = arr => (arr || []).map(v => ORG_TYPE_OPTIONS.find(t => t.value === v)?.label || v).join('、')

const rules = {
  name: [required('岗位名称不能为空')],
  type: [{ required: true, type: 'array', min: 1, message: '请选择企业类型', trigger: 'change' }],
  subtypeId: [{ required: true, type: 'array', min: 1, message: '请选择服务大类', trigger: 'change' }]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const form = reactive({ name: '', type: [], subtypeId: [], postType: '' })

const onType = () => { form.subtypeId = [] }

const openAdd = () => {
  Object.assign(form, { name: '', type: [], subtypeId: [], postType: '' })
  Object.assign(dialog, { visible: true, title: '新增岗位', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, type: [...(row.type || [])], subtypeId: [...(row.subtypeId || [])], postType: row.postType || ''
  })
  Object.assign(dialog, { visible: true, title: '编辑岗位', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const subtypeName = SERVICE_TYPES.filter(s => form.subtypeId.includes(s.id)).map(s => s.name).join('、')
    const payload = { name: form.name, type: [...form.type], subtypeId: [...form.subtypeId], subtypeName, postType: form.postType }
    if (dialog.isEdit) {
      await jobApi.update(dialog.id, payload)
      ElMessage.success('编辑成功')
    } else {
      await jobApi.add(payload)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
</script>
