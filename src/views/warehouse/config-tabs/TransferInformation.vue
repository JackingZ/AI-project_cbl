<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增转仓信息</el-button>
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
      <template #col-priceWeight="{ row }">{{ row.priceWeight }} RMB/{{ row.umWeight }}</template>
      <template #col-priceVolume="{ row }">{{ row.priceVolume }} RMB/{{ row.umVolume }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <Modal v-model="dialog.visible" :title="dialog.title" width="520px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="目的仓" prop="targetId">
          <el-select v-model="form.targetId" filterable placeholder="请选择目的仓" style="width: 100%" @change="onTarget">
            <el-option v-for="w in WC_PURPOSE_WH" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="转仓时间" prop="transitTime">
          <el-input-number v-model="form.transitTime" :controls="false" :min="0" :max="999" :step="1" step-strictly style="width: calc(100% - 50px)" />
          <span class="wc-unit">小时</span>
        </el-form-item>
        <el-form-item label="重量单价" prop="priceWeight">
          <el-input v-model="form.priceWeight" :maxlength="20" placeholder="请输入重量单价">
            <template #append>
              <el-select v-model="form.umWeight" style="width: 100px">
                <el-option v-for="u in TRANSIT_UM_W" :key="u" :label="`RMB/${u}`" :value="u" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="体积单价" prop="priceVolume">
          <el-input v-model="form.priceVolume" :maxlength="20" placeholder="请输入体积单价">
            <template #append>
              <el-select v-model="form.umVolume" style="width: 100px">
                <el-option v-for="u in TRANSIT_UM_V" :key="u" :label="`RMB/${u}`" :value="u" />
              </el-select>
            </template>
          </el-input>
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
import { wcTransitApi, WC_PURPOSE_WH, TRANSIT_UM_W, TRANSIT_UM_V } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const { query, list, total, loading, loadData } = useListQuery(
  p => wcTransitApi.list({ ...p, warehouseId: props.wsId }), {}
)

const columns = [
  { prop: 'targetName', label: '目的仓', minWidth: 120 },
  { prop: 'transitTime', label: '转仓时间(小时)', width: 130 },
  { prop: 'priceWeight', label: '重量单价', minWidth: 140 },
  { prop: 'priceVolume', label: '体积单价', minWidth: 140 }
]
const onTarget = id => { form.targetName = WC_PURPOSE_WH.find(w => w.id === id)?.name || '' }

// 单价为正数且最多两位小数（对齐源 validateNums）
const numRule = { validator: (r, v, cb) => (/^\d+(\.\d{0,2})?$/.test(String(v ?? '')) ? cb() : cb(new Error('单价为正数且最多为两位小数'))), trigger: 'blur' }
const rules = {
  targetId: [required('请选择目的仓', 'change')],
  transitTime: [required('请输入转仓时间')],
  priceWeight: [required('请输入重量单价'), numRule],
  priceVolume: [required('请输入体积单价'), numRule]
}
const defaultForm = () => ({ targetId: '', targetName: '', transitTime: undefined, priceWeight: '', umWeight: 'KGS', priceVolume: '', umVolume: 'CBM', warehouseId: props.wsId })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: wcTransitApi, defaultForm, reload: loadData, label: '转仓信息' })
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; }
.wc-unit { margin-left: 8px; color: $text-secondary; }
</style>
