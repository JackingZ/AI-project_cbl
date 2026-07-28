<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单类型">
        <el-select v-model="query.orderType" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="t in ORDER_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="SO号/原单号" clearable style="width: 180px" />
      </el-form-item>
      <template v-if="showMore">
        <el-form-item label="公司类型">
          <el-select v-model="query.companyType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in COMPANY_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司">
          <el-input v-model="query.companyName" placeholder="所属公司" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="目的港">
          <el-select v-model="query.portTo" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="p in PORTS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务条款">
          <el-select v-model="query.serviceTerms" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in SERVICE_TERMS" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="放货条款">
          <el-select v-model="query.goodsClause" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="c in GOODS_CLAUSES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务商">
          <el-select v-model="query.serviceProvider" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in SUPPLIERS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="订舱时间">
          <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
        </el-form-item>
      </template>
      <template #actions>
        <el-button link type="primary" @click="showMore = !showMore">{{ showMore ? '收起筛选' : '更多筛选' }}</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="300"
        @change="loadData"
      >
        <template #col-supplierName="{ row }">{{ row.supplierName || '未指派' }}</template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button link type="warning" size="small" @click="openAudit(row)">审核</el-button>
          <el-button link type="primary" size="small" @click="openProgress(row)">订单进度</el-button>
          <el-button link type="primary" size="small" @click="openAssign(row)">指定供应商</el-button>
          <el-button link type="primary" size="small" @click="openBill(row)">账单信息</el-button>
          <el-button v-if="row.status !== '已取消'" link type="warning" size="small" @click="doCancel(row)">取消</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignSupplierDialog v-model="assignVisible" :record="current" @saved="loadData" />
    <AuditDialog v-model="auditVisible" :record="current" @saved="loadData" />
    <ProgressDialog v-model="progressVisible" :record="current" />
    <BillDialog v-model="billVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AssignSupplierDialog from '@/components/Common/AssignSupplierDialog.vue'
import AuditDialog from '@/components/Common/AuditDialog.vue'
import ProgressDialog from '@/components/Common/ProgressDialog.vue'
import BillDialog from '@/components/Common/BillDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmDelete, confirmThen } from '@/utils'
import {
  getBookingOrders, cancelOrder, deleteOrder,
  ORDER_STATUS, ORDER_TYPES, BUSINESS_TYPES, COMPANY_TYPES, PORTS,
  SERVICE_TERMS, GOODS_CLAUSES, SUPPLIERS, orderStatusTag, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlBooking' })

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getBookingOrders, {
    keyword: '', orderType: '', businessType: '', status: '',
    companyType: '', companyName: '', portTo: '', serviceTerms: '', goodsClause: '', serviceProvider: '', dateRange: []
  })

const columns = [
  { prop: 'code', label: '原单号', width: 110, fixed: 'left' },
  { prop: 'soCode', label: 'SO号', width: 110 },
  { prop: 'billNo', label: '提单号', width: 110 },
  { prop: 'airNo', label: '航空单号', width: 120 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'serviceName', label: '服务', width: 120 },
  { prop: 'portFrom', label: '起运港', width: 100 },
  { prop: 'portTo', label: '目的港', width: 100 },
  { prop: 'supplierName', label: '供应商名称', width: 120 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'createTime', label: '下单时间', width: 160 }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const auditVisible = ref(false)
const progressVisible = ref(false)
const billVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
const openAudit = row => { current.value = row; auditVisible.value = true }
const openProgress = row => { current.value = row; progressVisible.value = true }
const openBill = row => { current.value = row; billVisible.value = true }

const doCancel = row =>
  confirmThen(`确定取消订舱订单「${row.soCode}」吗？`, async () => { await cancelOrder(row.id); loadData() },
    { title: '取消订单', success: '订单已取消' })

const handleDelete = row =>
  confirmDelete(async () => { await deleteOrder(row.id); loadData() }, `确定删除订舱订单「${row.soCode}」吗？`)
</script>
