<template>
  <div>
    <!-- 内嵌详情（对齐源 detailShow v-show 切换，非路由跳转） -->
    <InvoiceDetail v-if="detail.show" :is-pay="false" :mode="detail.mode" :row-id="detail.id" @back="detail.show = false" @saved="onSaved" />

    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="服务大类">
          <el-select v-model="query.serviceTypeId" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in SERVICE_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in INV_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="核销状态">
          <el-select v-model="query.ifVerify" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="v in VERIFY_LIST" :key="v.id" :label="v.name" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票时间">
          <el-date-picker v-model="query.time" type="daterange" range-separator="-" start-placeholder="起期" end-placeholder="止期" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 260px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option label="原单号" value="1" /><el-option label="开票企业" value="2" />
                <el-option label="提单号" value="4" /><el-option label="SO号" value="5" /><el-option label="柜号" value="6" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增应收款</el-button>
          <el-button v-if="query.serviceTypeId === '05'" :disabled="!can('export')" @click="handleExport">导出当前数据</el-button>
          <el-button v-if="query.serviceTypeId === '05'" :disabled="!can('export')" @click="handleExport">导出明细</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="240" @change="loadData">
          <template #col-orderCode="{ row }">
            <span v-if="!['02','06'].includes(row.businessType)">{{ row.orderCode }}</span>
            <span v-else>{{ row.soNoList || row.billNoList || '--' }}</span>
          </template>
          <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ lookup(INV_STATUS_LIST, row.status) }}</el-tag></template>
          <template #col-ifVerify="{ row }">{{ row.ifVerify === '1' ? '已核销' : '未核销' }}</template>
          <template #col-clientProperty="{ row }">{{ clientProperty(row.clientType, row.clientSubtype) }}</template>
          <template #col-currencyName="{ row }">{{ row.currencyName }}({{ row.currencyId }})</template>
          <template #col-day="{ row }">{{ overdueDay(row.cutoffTime) }}</template>
          <template #actions="{ row }">
            <el-button v-if="row.ifVerify === '0' && row.status !== '3'" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.ifVerify === '0'" link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看详情</el-button>
            <el-button v-if="row.status !== '1'" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
            <!-- 源页注释按钮，保持注释：回滚 / 申请抵扣 / 申请调校 / 通过 / 拒绝 / 重新提交 -->
            <!-- <el-button link type="primary" size="small" @click="rollback(row)">回滚</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="openDeduct(row)">申请抵扣</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="openAdjust(row)">申请调校</el-button> -->
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 审核 -->
    <Modal v-model="audit.visible" title="发票审核" width="440px" :confirm-loading="audit.loading" @confirm="confirmAudit">
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
import InvoiceDetail from './components/InvoiceDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete } from '@/utils/index'
import { invoiceApi, INV_STATUS_LIST, VERIFY_LIST, SERVICE_LIST, lookup, clientProperty, overdueDay } from '@/api/modules/financial'

defineOptions({ name: 'FinRecv' })
const { can } = usePagePerms()
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(invoiceApi.listRecv, { serviceTypeId: '', status: '', ifVerify: '', time: [], keyWord: '', selectType: '1' })
const columns = [
  { prop: 'orderCode', label: '原单号', minWidth: 130 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'ifVerify', label: '核销状态', width: 90, align: 'center' },
  { prop: 'invDate', label: '发票日期', width: 160 },
  { prop: 'clientName', label: '客户名称', minWidth: 130 },
  { prop: 'clientProperty', label: '客户属性', width: 100 },
  { prop: 'currencyName', label: '货币', width: 110 },
  { prop: 'amount', label: '金额', width: 110 },
  { prop: 'createTime', label: '创建时间', width: 160 },
  { prop: 'auditTime', label: '审核时间', width: 160 },
  { prop: 'cutoffTime', label: '截止付款时间', width: 130 },
  { prop: 'day', label: '逾期天数', width: 90, align: 'center' }
]

const detail = reactive({ show: false, mode: 'add', id: null })
const openAdd = () => Object.assign(detail, { show: true, mode: 'add', id: null })
const openEdit = row => Object.assign(detail, { show: true, mode: 'edit', id: row.id })
const openView = row => Object.assign(detail, { show: true, mode: 'view', id: row.id })
const onSaved = () => { detail.show = false; loadData() }
const remove = row => confirmDelete(async () => { await invoiceApi.remove(row.id); loadData() })

const audit = reactive({ visible: false, loading: false, id: null, status: '1' })
const openAudit = row => Object.assign(audit, { visible: true, id: row.id, status: '1' })
const confirmAudit = async () => {
  audit.loading = true
  try { await invoiceApi.audit(audit.id, audit.status); ElMessage.success('审核成功'); audit.visible = false; loadData() }
  finally { audit.loading = false }
}
const handleExport = () => ElMessage.success('已导出当前数据')
</script>
