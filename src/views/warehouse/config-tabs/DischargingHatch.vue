<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增分拣口</el-button>
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
      <template #actions="{ row }">
        <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <Modal v-model="dialog.visible" :title="dialog.title" width="480px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="分拣口名称" prop="discharge"><el-input v-model="form.discharge" :maxlength="20" placeholder="请输入分拣口名称" /></el-form-item>
        <el-form-item label="分拣口编码" prop="code">
          <el-input-number v-model="form.code" :controls="false" :step="1" :min="1" :max="8" step-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks"><el-input v-model="form.remarks" :maxlength="50" placeholder="请输入备注" /></el-form-item>
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
import { wcDischargeApi } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const { query, list, total, loading, loadData } = useListQuery(
  p => wcDischargeApi.list({ ...p, warehouseId: props.wsId }), {}
)

const columns = [
  { prop: 'discharge', label: '分拣口名称', minWidth: 140 },
  { prop: 'code', label: '分拣口编码', width: 140 },
  { prop: 'remarks', label: '备注信息', minWidth: 160 }
]
// 校验：分拣口编码为数字或字母（对齐源正则 /^[0-9a-zA-Z]+$/）
const codeRule = { validator: (r, v, cb) => (/^[0-9a-zA-Z]+$/.test(String(v ?? '')) ? cb() : cb(new Error('分拣口编码不正确'))), trigger: 'blur' }
const rules = { discharge: [required('请输入分拣口名称')], code: [required('请输入分拣口编码'), codeRule] }
const defaultForm = () => ({ discharge: '', code: undefined, remarks: '', warehouseId: props.wsId })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: wcDischargeApi, defaultForm, reload: loadData, label: '分拣口' })
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; }
</style>
