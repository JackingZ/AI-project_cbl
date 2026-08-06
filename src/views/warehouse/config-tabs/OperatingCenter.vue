<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增操作中心</el-button>
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
      <!-- <template #col-wcId="{ row }">{{ row.wcId }}</template> 操作中心ID 源已注释 -->
      <template #col-efficiency="{ row }">{{ row.efficiency }}{{ umUnit(row.um) }}</template>
      <template #col-per="{ row }">{{ WC_PER[row.per] }}</template>
      <template #col-schedule="{ row }">{{ row.schedule ? '是' : '否' }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
        <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
      </template>
    </ProTable>

    <Modal v-model="dialog.visible" :title="dialog.title" width="600px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" :maxlength="50" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="排序" prop="sorted">
          <el-input-number v-model="form.sorted" :controls="false" :min="1" :max="99999" :step="1" step-strictly style="width: 100%" />
        </el-form-item>
        <el-form-item label="岗位" prop="job">
          <el-select v-model="form.job" multiple filterable clearable placeholder="请选择岗位" style="width: 100%" @change="onJob">
            <el-option v-for="p in WC_POSTS" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="工序" prop="taskType">
          <el-select v-model="form.taskType" filterable clearable placeholder="请选择工序" style="width: 100%" @change="onTask">
            <el-option v-for="t in WC_TASK_TYPES" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="效率数值" prop="efficiency">
          <el-input v-model="form.efficiency" :maxlength="100" placeholder="请输入效率数值">
            <template #append>
              <el-select v-model="form.um" style="width: 90px">
                <el-option v-for="u in umList" :key="u.id" :label="u.name" :value="u.id" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="效率单位" prop="per">
          <el-select v-model="form.per" filterable clearable placeholder="请选择效率单位" style="width: 100%">
            <el-option label="小时" value="2" />
            <el-option label="分钟" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否参与排程" prop="schedule">
          <el-radio-group v-model="form.schedule">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { wcCenterApi, WC_UM, WC_PER, WC_TASK_TYPES, WC_POSTS } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const { query, list, total, loading, loadData } = useListQuery(
  p => wcCenterApi.list({ ...p, warehouseId: props.wsId }), {}
)

const columns = [
  // { prop: 'wcId', label: '操作中心ID', minWidth: 150 }, // 源已注释
  { prop: 'name', label: '名称', minWidth: 130 },
  { prop: 'sorted', label: '排序', width: 80 },
  { prop: 'jobName', label: '岗位', minWidth: 120 },
  { prop: 'efficiency', label: '效率数值', width: 110 },
  { prop: 'per', label: '效率单位', width: 100 },
  { prop: 'schedule', label: '是否参与排程', width: 120 },
  { prop: 'updateTime', label: '最后更新时间', width: 180 }
]
const umUnit = v => WC_UM.find(u => u.id === v)?.name || ''

// 工序切换动态过滤效率单位（对齐源 onTask）：1/2卸货装载→m³；3/4上架分拣→件+箱；其它→全4项
const umList = ref([...WC_UM])
const onTask = val => {
  if (val === 1 || val === 2) { umList.value = WC_UM.filter(u => u.id === '2'); form.um = '2' }
  else if (val === 3 || val === 4) { umList.value = WC_UM.filter(u => u.id === '3' || u.id === '4'); form.um = '3' }
  else { umList.value = [...WC_UM] }
}
// 岗位多选变更时同步 jobIds/jobName（对齐源 onJob）
const onJob = ids => {
  const chosen = WC_POSTS.filter(p => ids.includes(p.id))
  form.jobIds = chosen.map(p => p.id).join(',')
  form.jobName = chosen.map(p => p.name).join(',') + (chosen.length ? ',' : '')
}

const effRule = { validator: (r, v, cb) => (/^[1-9]+[0-9]*$/.test(String(v ?? '')) ? cb() : cb(new Error('效率数值为正整数'))), trigger: 'blur' }
const rules = {
  name: [required('请输入名称')],
  sorted: [required('请输入排序')],
  job: [required('请选择岗位', 'change')],
  taskType: [required('请选择工序', 'change')],
  efficiency: [required('请输入效率数值'), effRule],
  per: [required('请选择效率单位', 'change')]
}
const defaultForm = () => ({ name: '', sorted: undefined, efficiency: '', taskType: undefined, job: [], um: '1', per: '2', schedule: true, jobIds: '', jobName: '', warehouseId: props.wsId })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: wcCenterApi, defaultForm, reload: loadData, label: '操作中心' })
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; }
</style>
