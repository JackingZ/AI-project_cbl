<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
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
        <template #col-rating="{ row }">￥ {{ row.rating }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑评级' : '新增评级'" width="800px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="级别代码" prop="code">
          <el-input v-model="form.code" :disabled="dialog.isEdit" :maxlength="5" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="级别描述" prop="name">
          <el-input v-model="form.name" :maxlength="30" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="额度金额(￥)" prop="rating">
          <el-input-number v-model="form.rating" :controls="false" :min="0" :max="99999999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 3 }" :maxlength="30" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import { levelApi } from '@/api/modules/system'

defineOptions({ name: 'SysLevel' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData } = useListQuery(levelApi.list, {})

const columns = [
  { prop: 'code', label: '级别代码', width: 120 },
  { prop: 'name', label: '级别描述', minWidth: 150 },
  { prop: 'rating', label: '额度金额', width: 130 },
  { prop: 'remark', label: '备注', minWidth: 150 }
]

const rules = {
  code: [required('级别代码不能为空')],
  name: [required('级别描述不能为空')],
  rating: [required('额度金额不能为空')]
}
const defaultForm = () => ({ code: '', name: '', rating: undefined, remark: '' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { code: row.code, name: row.name, rating: row.rating, remark: row.remark })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) await levelApi.update(dialog.id, { ...form })
    else await levelApi.add({ ...form })
    ElMessage.success(dialog.isEdit ? '编辑成功!' : '新增成功!')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('删除评级将导致无法继续使用，确定要删除吗？', async () => { await levelApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功!' })
</script>

<style scoped lang="scss">
.op-toolbar { margin-bottom: $space-md; }
</style>
