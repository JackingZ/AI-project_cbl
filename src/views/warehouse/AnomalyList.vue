<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="异常单号"><el-input v-model="query.anomalyNo" placeholder="请输入异常单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="原单号"><el-input v-model="query.originalNo" placeholder="请输入原单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="所属环节">
        <el-select v-model="query.stage" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in ANOMALY_STAGES" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <el-form-item label="异常类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="width: 130px"><el-option v-for="t in ANOMALY_TYPES" :key="t" :label="t" :value="t" /></el-select>
      </el-form-item>
      <el-form-item label="处理状态">
        <el-select v-model="query.handle" placeholder="全部" clearable style="width: 130px"><el-option v-for="h in ANOMALY_HANDLE" :key="h" :label="h" :value="h" /></el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
    </SearchBar>
    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        selectable
        :action-width="160"
        @change="loadData"
      >
        <template #batch="{ selection }">
          <el-button size="small" type="primary" @click="notifyCustomers(selection)">批量通知客户</el-button>
        </template>
        <template #col-handle="{ row }">
          <el-tag :type="row.handle === '待处理' ? 'warning' : 'success'" size="small">{{ row.handle }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.handle === '待处理'" link type="warning" size="small" :disabled="!can('handle')" @click="openHandle(row)">处理</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="detail.visible" title="异常详情" width="620px">
      <el-descriptions v-if="detail.row" :column="2" border size="small">
        <el-descriptions-item label="异常单号">{{ detail.row.anomalyNo }}</el-descriptions-item>
        <el-descriptions-item label="原单号">{{ detail.row.originalNo }}</el-descriptions-item>
        <el-descriptions-item label="所属环节">{{ detail.row.stage }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">{{ detail.row.type }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ detail.row.handle }}</el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">{{ detail.row.description }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>
      <div class="anomaly-photos">
        <span class="anomaly-photos__label">异常照片：</span>
        <el-button link type="primary" @click="demoAction('查看异常照片')">查看照片</el-button>
      </div>
      <template #footer><el-button type="primary" @click="detail.visible = false">关闭</el-button></template>
    </Modal>

    <Modal v-model="handleDialog.visible" title="异常处理" width="560px" :confirm-loading="handleDialog.loading" @confirm="submitHandle">
      <el-form ref="handleFormRef" :model="handleForm" label-width="90px">
        <el-form-item label="处理方式">
          <el-radio-group v-model="handleForm.method">
            <el-radio value="退件">退件</el-radio>
            <el-radio value="增值服务">增值服务</el-radio>
            <el-radio value="拒绝">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="handleForm.method === '退件'">
          <el-form-item label="退货数量"><el-input-number v-model="handleForm.returnQty" :min="0" :controls="false" style="width: 100%" /></el-form-item>
          <el-form-item label="退货原因"><el-input v-model="handleForm.returnReason" placeholder="请输入退货原因" /></el-form-item>
          <el-form-item label="退货方式">
            <el-select v-model="handleForm.returnMethod" style="width: 100%"><el-option v-for="m in RETURN_METHODS" :key="m" :label="m" :value="m" /></el-select>
          </el-form-item>
        </template>
        <template v-else-if="handleForm.method === '增值服务'">
          <el-form-item label="服务类型">
            <el-select v-model="handleForm.serviceType" style="width: 100%"><el-option v-for="s in SERVICE_TYPES" :key="s" :label="s" :value="s" /></el-select>
          </el-form-item>
          <el-form-item label="备注"><el-input v-model="handleForm.remark" type="textarea" :rows="2" placeholder="请输入备注" /></el-form-item>
        </template>
        <template v-else>
          <el-form-item label="拒绝理由"><el-input v-model="handleForm.rejectReason" type="textarea" :rows="2" placeholder="请输入拒绝理由" /></el-form-item>
        </template>
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
import { demoAction } from '@/utils'
import { anomalyApi, ANOMALY_TYPES, ANOMALY_STAGES, ANOMALY_HANDLE } from '@/api/modules/warehouse'

defineOptions({ name: 'WhAnomaly' })

const { can } = usePagePerms()
const RETURN_METHODS = ['自提', '快递', '送货上门']
const SERVICE_TYPES = ['分箱', '合箱', '贴标', '贴唛']
const HANDLE_MAP = { 退件: '已退件', 增值服务: '已增值处理', 拒绝: '已拒绝' }

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(anomalyApi.list, { anomalyNo: '', originalNo: '', stage: '', type: '', handle: '', warehouseName: '' })

const columns = [
  { prop: 'anomalyNo', label: '异常单号', width: 130 },
  { prop: 'originalNo', label: '原单号', width: 120 },
  { prop: 'stage', label: '所属环节', width: 100, align: 'center' },
  { prop: 'type', label: '异常类型', width: 110 },
  { prop: 'warehouseName', label: '仓库', width: 110 },
  { prop: 'description', label: '异常描述', minWidth: 160 },
  { prop: 'handle', label: '处理状态', width: 110, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const detail = reactive({ visible: false, row: null })
const openDetail = row => { detail.row = row; detail.visible = true }

const handleFormRef = ref(null)
const handleDialog = reactive({ visible: false, loading: false, id: null })
const handleForm = reactive({ method: '退件', returnQty: 0, returnReason: '', returnMethod: '自提', serviceType: '分箱', remark: '', rejectReason: '' })
const openHandle = row => {
  Object.assign(handleForm, { method: '退件', returnQty: 0, returnReason: '', returnMethod: '自提', serviceType: '分箱', remark: '', rejectReason: '' })
  handleDialog.id = row.id
  handleDialog.visible = true
}
const submitHandle = async () => {
  handleDialog.loading = true
  try {
    await anomalyApi.update(handleDialog.id, { handle: HANDLE_MAP[handleForm.method] })
    ElMessage.success('处理成功')
    handleDialog.visible = false
    loadData()
  } finally {
    handleDialog.loading = false
  }
}

const notifyCustomers = selection => {
  if (!selection.length) return ElMessage.warning('请先选择异常记录')
  demoAction('批量通知客户')
}
</script>

<style scoped lang="scss">
.anomaly-photos {
  margin-top: $space-md;
  display: flex;
  align-items: center;
  &__label { color: $text-secondary; font-size: $font-base; }
}
</style>
