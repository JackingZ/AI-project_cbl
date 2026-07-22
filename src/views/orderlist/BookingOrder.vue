<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="SO号/原单号" clearable style="width: 180px" />
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
        :action-width="260"
        @change="loadData"
      >
        <template #col-supplierName="{ row }">{{ row.supplierName || '未指派' }}</template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <template v-if="row.audit === '待审核' || row.audit === '审核中'">
            <el-button link type="success" size="small" @click="doAudit(row, '审核通过')">通过</el-button>
            <el-button link type="danger" size="small" @click="doAudit(row, '审核拒绝')">拒绝</el-button>
          </template>
          <el-button link type="primary" size="small" @click="openAssign(row)">指派</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignSupplierDialog v-model="assignVisible" :record="current" @saved="loadData" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AssignSupplierDialog from '@/components/Common/AssignSupplierDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmDelete, confirmThen } from '@/utils'
import { getBookingOrders, auditOrder, deleteOrder, ORDER_STATUS, AUDIT_STATUS, auditStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlBooking' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getBookingOrders, { keyword: '', status: '', audit: '' })

const columns = [
  { prop: 'soCode', label: 'SO号', width: 110 },
  { prop: 'code', label: '原单号', width: 100 },
  { prop: 'billNo', label: '提单号', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'supplierName', label: '供应商', width: 110 },
  { prop: 'portFrom', label: '起运港', width: 100 },
  { prop: 'portTo', label: '目的港', width: 100 },
  { prop: 'markNo', label: '柜号', width: 100 },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '下单时间', width: 170 }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }

const doAudit = (row, audit) =>
  confirmThen(`确定将订单「${row.soCode}」标记为「${audit}」吗？`, async () => {
    await auditOrder(row.id, audit)
    loadData()
  }, { title: '审核确认', success: '审核已更新' })

const handleDelete = row =>
  confirmDelete(async () => {
    await deleteOrder(row.id)
    loadData()
  }, `确定删除订舱订单「${row.soCode}」吗？`)
</script>
