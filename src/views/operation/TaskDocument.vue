<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="任务单名称">
        <el-input v-model="query.name" placeholder="请输入" clearable style="width: 260px">
          <template #prepend>任务单名称</template>
        </el-input>
      </el-form-item>
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
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" title="编辑任务单" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="任务单名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="任务时间" prop="time">
          <el-input-number v-model="form.time" :controls="false" :min="0" :max="9999" :precision="2" placeholder="请输入" style="width: calc(100% - 60px)" />
          <span class="unit-suffix">分钟</span>
        </el-form-item>
        <el-form-item label="关联服务大类" prop="serviceTypeId">
          <el-select v-model="form.serviceTypeId" placeholder="请选择" style="width: 100%">
            <el-option v-for="s in SERVICE_TYPES" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :maxlength="100" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { docApi, SERVICE_TYPES } from '@/api/modules/operation'

defineOptions({ name: 'OpDoc' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(docApi.list, { name: '' })

const columns = [
  { prop: 'name', label: '任务单名称', minWidth: 180 },
  { prop: 'time', label: '任务时长(分钟)', width: 130 },
  { prop: 'serviceTypeName', label: '关联服务大类', minWidth: 150 },
  { prop: 'updateTime', label: '添加时间', width: 170 }
]

const rules = {
  name: [required('任务单名称不能为空')],
  time: [required('任务时间不能为空')],
  serviceTypeId: [required('请选择服务大类', 'change')]
}

// 源页仅编辑，无新增/删除；提交时回填 serviceTypeName
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, id: null })
const form = reactive({ name: '', time: undefined, serviceTypeId: undefined, remark: '' })

const openEdit = row => {
  Object.assign(form, { name: row.name, time: row.time, serviceTypeId: row.serviceTypeId, remark: row.remark || '' })
  dialog.id = row.id
  dialog.visible = true
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const serviceTypeName = SERVICE_TYPES.find(s => s.id === form.serviceTypeId)?.name || ''
    await docApi.update(dialog.id, { ...form, serviceTypeName })
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
</script>

<style scoped lang="scss">
.unit-suffix {
  display: inline-block;
  width: 52px;
  text-align: center;
  color: $text-secondary;
}
</style>
