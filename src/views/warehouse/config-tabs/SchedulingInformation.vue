<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增班次信息</el-button>
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
      <template #col-transitTime="{ row }">{{ fmtTime(row) }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <Modal v-model="dialog.visible" :title="dialog.title" width="480px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="班次名称" prop="name"><el-input v-model="form.name" :maxlength="20" placeholder="请输入班次名称" /></el-form-item>
        <el-form-item label="班次开始时间" prop="startTime">
          <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" arrow-control placeholder="请选择" style="width: 100%" />
        </el-form-item>
        <el-form-item label="班次结束时间" prop="endTime">
          <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" arrow-control placeholder="请选择" style="width: 100%" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { wcSchedulApi } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const { query, list, total, loading, loadData } = useListQuery(
  p => wcSchedulApi.list({ ...p, warehouseId: props.wsId }), {}
)

const columns = [
  { prop: 'name', label: '班次名称', minWidth: 140 },
  { prop: 'transitTime', label: '班次时间', minWidth: 160 }
]
const fmtTime = row => (row.startTime && row.endTime ? `${row.startTime}~${row.endTime}` : '')

const rules = { name: [required('请输入班次名称')], startTime: [required('请选择开始时间')], endTime: [required('请选择结束时间')] }
const defaultForm = () => ({ name: '', startTime: '', endTime: '', warehouseId: props.wsId })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: wcSchedulApi, defaultForm, reload: loadData, label: '班次信息' })
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; }
</style>
