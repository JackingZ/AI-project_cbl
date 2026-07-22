<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="订单号/原单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="240"
        @change="loadData"
      >
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <template v-if="row.audit === '待审核' || row.audit === '审核中'">
            <el-button link type="success" size="small" @click="doAudit(row, '审核通过')">通过</el-button>
            <el-button link type="danger" size="small" @click="doAudit(row, '审核拒绝')">拒绝</el-button>
          </template>
          <el-button v-if="row.status !== '已取消'" link type="warning" size="small" @click="doCancel(row)">取消</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmThen } from '@/utils'
import { formatMoney } from '@/utils/format'
import {
  getWholeOrders, auditOrder, cancelOrder,
  BUSINESS_TYPES, ORDER_STATUS, AUDIT_STATUS, orderStatusTag, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlWhole' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getWholeOrders, { keyword: '', businessType: '', status: '', audit: '' })

const columns = [
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'code', label: '原单号', width: 110 },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'destinationCountry', label: '目的国', width: 90 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'audit', label: '审核状态', width: 110, align: 'center' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '下单时间', width: 170 }
]

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

const doAudit = (row, audit) =>
  confirmThen(`确定将订单「${row.orderNo}」标记为「${audit}」吗？`, async () => {
    await auditOrder(row.id, audit)
    loadData()
  }, { title: '审核确认', success: '审核已更新' })

const doCancel = row =>
  confirmThen(`确定取消订单「${row.orderNo}」吗？`, async () => {
    await cancelOrder(row.id)
    loadData()
  }, { title: '取消订单', success: '订单已取消' })
</script>
