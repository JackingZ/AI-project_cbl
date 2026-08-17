<template>
  <div>
    <OutInvoiceDetail v-if="detail.show" :mode="detail.mode" :row-id="detail.id" @back="detail.show = false" @saved="onSaved" />

    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="服务大类">
          <el-select v-model="query.serviceTypeId" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in SERVICE_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in INV_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否税务开票">
          <el-select v-model="query.ifBill" clearable placeholder="全部" style="width: 100px">
            <el-option label="否" value="0" /><el-option label="是" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票时间">
          <el-date-picker v-model="query.time" type="daterange" range-separator="-" start-placeholder="起期" end-placeholder="止期" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 240px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 100px">
                <el-option label="原单号" value="1" /><el-option label="客户名称" value="2" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增开票</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="220" @change="loadData">
          <!-- 发票编号 code 源列注释，保持注释 -->
          <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ lookup(INV_STATUS_LIST, row.status) }}</el-tag></template>
          <template #col-ifBill="{ row }">{{ row.ifBill === '1' ? '是' : '否' }}</template>
          <template #actions="{ row }">
            <el-button v-if="row.status !== '3'" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
            <el-button v-if="row.status !== '1'" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
            <el-button v-if="query.serviceTypeId === '05'" link type="primary" size="small" :disabled="!can('export')" @click="handleExport">导出</el-button>
            <!-- 删除 源按钮注释，保持注释 -->
          </template>
        </ProTable>
      </PageCard>
    </template>

    <Modal v-model="audit.visible" title="开票审核" width="440px" :confirm-loading="audit.loading" @confirm="confirmAudit">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="audit.status">
            <el-radio value="1">通过</el-radio>
            <el-radio value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import OutInvoiceDetail from './components/OutInvoiceDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { outInvoiceApi, INV_STATUS_LIST, SERVICE_LIST, lookup } from '@/api/modules/financial'

defineOptions({ name: 'FinOut' })
const { can } = usePagePerms()
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(outInvoiceApi.list, { serviceTypeId: '', status: '', ifBill: '', time: [], keyWord: '', selectType: '1' })
const columns = [
  { prop: 'clientName', label: '客户名称', minWidth: 150 },
  { prop: 'invDate', label: '开票日期', width: 130 },
  { prop: 'status', label: '审核状态', width: 100, align: 'center' },
  { prop: 'auditTime', label: '审核时间', width: 160 },
  { prop: 'amount', label: '本币总金额', width: 130 },
  { prop: 'ifBill', label: '是否税务开票', width: 120, align: 'center' }
]

const detail = reactive({ show: false, mode: 'add', id: null })
const openAdd = () => Object.assign(detail, { show: true, mode: 'add', id: null })
const openEdit = row => Object.assign(detail, { show: true, mode: 'edit', id: row.id })
const openView = row => Object.assign(detail, { show: true, mode: 'view', id: row.id })
const onSaved = () => { detail.show = false; loadData() }

const audit = reactive({ visible: false, loading: false, id: null, status: '1' })
const openAudit = row => Object.assign(audit, { visible: true, id: row.id, status: '1' })
const confirmAudit = async () => {
  audit.loading = true
  try { await outInvoiceApi.audit(audit.id, audit.status); ElMessage.success('审核成功'); audit.visible = false; loadData() }
  finally { audit.loading = false }
}
const handleExport = () => ElMessage.success('已导出')
</script>
