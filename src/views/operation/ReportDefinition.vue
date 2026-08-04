<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="报表名称">
        <el-input v-model="query.name" placeholder="请输入" clearable style="width: 260px">
          <template #prepend>报表名称</template>
        </el-input>
      </el-form-item>
      <template #actions><el-button type="primary" :icon="Plus" @click="openAdd">新增报表</el-button></template>
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
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="报表名称" prop="name">
          <el-input v-model="form.name" :maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="报表标识" prop="tag">
          <el-input v-model="form.tag" :maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="报表ip地址" prop="ip">
          <el-input v-model="form.ip" type="textarea" :rows="2" :maxlength="200" show-word-limit placeholder="请输入" />
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
import { reportApi } from '@/api/modules/operation'

defineOptions({ name: 'OpReport' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(reportApi.list, { name: '' })

const columns = [
  { prop: 'name', label: '报表名称', width: 230 },
  { prop: 'tag', label: '报表标识', width: 150 },
  { prop: 'ip', label: '报表地址', minWidth: 240 },
  { prop: 'createTime', label: '添加时间', width: 170 }
]

const rules = {
  name: [required('报表名称不能为空')],
  tag: [required('请输入报表标识', 'change')],
  ip: [required('报表ip地址不能为空')]
}

// 源页：新增 + 编辑（删除已注释，不提供）
const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const form = reactive({ name: '', tag: '', ip: '' })

const openAdd = () => {
  Object.assign(form, { name: '', tag: '', ip: '' })
  Object.assign(dialog, { visible: true, title: '新增报表', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { name: row.name, tag: row.tag, ip: row.ip })
  Object.assign(dialog, { visible: true, title: '编辑报表', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await reportApi.update(dialog.id, { ...form })
      ElMessage.success('编辑成功')
    } else {
      await reportApi.add({ ...form })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
</script>
