<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增计划</el-button>
        <div class="op-filters">
          <el-select v-model="query.status" placeholder="计划状态" clearable style="width: 130px">
            <el-option v-for="(s, i) in DELIVERY_PLAN_STATUS" :key="i" :label="s" :value="i" />
          </el-select>
          <el-input v-model="query.bscName" placeholder="订舱服务" clearable style="width: 180px" />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="200"
        @change="loadData"
      >
        <template #col-dispatch="{ row }">{{ DISPATCH_WAYS[row.dispatch] }}</template>
        <template #col-loaded="{ row }">{{ row.loaded }} / {{ row.quantity }}</template>
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ DELIVERY_PLAN_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="row.ifBooking !== 1" link type="primary" size="small" :disabled="!can('edit')" @click="genBooking(row)">生成订舱</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑发货计划 -->
    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑发货计划' : '新增发货计划'" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="dp-form">
        <el-form-item label="订舱服务" prop="bscName"><el-input v-model="form.bscName" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="派件方式" prop="dispatch">
          <el-select v-model="form.dispatch" placeholder="请选择" style="width: 100%">
            <el-option v-for="(d, i) in DISPATCH_WAYS" :key="i" :label="d" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="装载容器" prop="containerName">
          <el-select v-model="form.containerName" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in ['PMC板', '40HQ', '20GP', '厢式货车']" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity"><el-input-number v-model="form.quantity" :controls="false" :min="1" :max="9999" style="width: 100%" /></el-form-item>
        <el-form-item label="最大限重" prop="loadLimit"><el-input-number v-model="form.loadLimit" :controls="false" :min="0" :max="999999" style="width: 100%" /></el-form-item>
        <el-form-item label="起运日期" prop="shipDate"><el-date-picker v-model="form.shipDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="截单日期" prop="cutoffDate"><el-date-picker v-model="form.cutoffDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="运输天数" prop="transTime"><el-input-number v-model="form.transTime" :controls="false" :min="1" :max="999" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
            <el-option v-for="(s, i) in DELIVERY_PLAN_STATUS" :key="i" :label="s" :value="i" />
          </el-select>
        </el-form-item>
        <el-form-item label="发起人" prop="createUser"><el-input v-model="form.createUser" :maxlength="30" placeholder="请输入" /></el-form-item>
      </el-form>
    </Modal>

    <!-- 详情弹窗（只读展示计划信息） -->
    <el-dialog v-model="detail.visible" title="发货计划详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订舱服务">{{ detail.row.bscName }}</el-descriptions-item>
        <el-descriptions-item label="派件方式">{{ DISPATCH_WAYS[detail.row.dispatch] }}</el-descriptions-item>
        <el-descriptions-item label="装载容器">{{ detail.row.containerName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detail.row.quantity }}</el-descriptions-item>
        <el-descriptions-item label="最大限重">{{ detail.row.loadLimit }} KG</el-descriptions-item>
        <el-descriptions-item label="已装载">{{ detail.row.loaded }} / {{ detail.row.quantity }}</el-descriptions-item>
        <el-descriptions-item label="起运日期">{{ detail.row.shipDate }}</el-descriptions-item>
        <el-descriptions-item label="截单日期">{{ detail.row.cutoffDate }}</el-descriptions-item>
        <el-descriptions-item label="运输天数">{{ detail.row.transTime }} 天</el-descriptions-item>
        <el-descriptions-item label="状态">{{ DELIVERY_PLAN_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="发起人">{{ detail.row.createUser }}</el-descriptions-item>
        <el-descriptions-item label="发起部门">{{ detail.row.createDept }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
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
import { deliveryApi, DELIVERY_PLAN_STATUS, DISPATCH_WAYS } from '@/api/modules/system'

defineOptions({ name: 'SysDelivery' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(deliveryApi.list, { status: '', bscName: '' })

const columns = [
  { prop: 'bscName', label: '订舱服务', minWidth: 150 },
  { prop: 'dispatch', label: '派件方式', width: 110 },
  { prop: 'containerName', label: '装载容器', width: 120 },
  { prop: 'quantity', label: '数量', width: 80, align: 'center' },
  { prop: 'loadLimit', label: '最大限重', width: 110 },
  { prop: 'loaded', label: '已装载', width: 100, align: 'center' },
  { prop: 'shipDate', label: '起运日期', width: 130 },
  { prop: 'cutoffDate', label: '截单日期', width: 130 },
  { prop: 'transTime', label: '运输天数', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'createUser', label: '发起人', width: 110 }
]
const statusTag = s => ['primary', 'success', 'info', 'danger', 'warning'][s] || 'info'

// 详情
const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }

// 新增/编辑
const rules = {
  bscName: [required('请输入订舱服务')],
  dispatch: [{ required: true, message: '请选择派件方式', trigger: 'change' }],
  quantity: [required('请输入数量')]
}
const defaultForm = () => ({ bscName: '', dispatch: 0, containerName: '', quantity: 1, loadLimit: 0, shipDate: '', cutoffDate: '', transTime: 1, status: 0, createUser: '' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    bscName: row.bscName, dispatch: row.dispatch, containerName: row.containerName, quantity: row.quantity,
    loadLimit: row.loadLimit, shipDate: row.shipDate, cutoffDate: row.cutoffDate, transTime: row.transTime,
    status: row.status, createUser: row.createUser
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) await deliveryApi.update(dialog.id, { ...form })
    else await deliveryApi.add({ ...form, loaded: 0, createDept: '运营部', ifBooking: 0 })
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

// 生成订舱：置 ifBooking=1
const genBooking = row =>
  confirmThen(`确认为「${row.bscName}」生成订舱单？`, async () => { await deliveryApi.update(row.id, { ifBooking: 1 }); loadData() },
    { title: '生成订舱', success: '已生成订舱单' })
</script>

<style scoped lang="scss">
.op-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-md; margin-bottom: $space-md; }
.op-filters { display: flex; gap: $space-sm; }
.dp-form { display: flex; flex-wrap: wrap; :deep(.el-form-item) { width: 50%; } }
</style>
