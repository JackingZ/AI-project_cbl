<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="订单号/快递单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="快递公司">
        <el-select v-model="query.expressCompany" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="c in EXPRESS_COMPANIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
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
        :action-width="170"
        @change="loadData"
      >
        <template #col-supplierName="{ row }">{{ row.supplierName || '未指派' }}</template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" size="small" @click="openAssign(row)">指派供应商</el-button>
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
import { getExpressOrders, EXPRESS_COMPANIES, ORDER_STATUS, orderStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlExpress' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getExpressOrders, { keyword: '', expressCompany: '', status: '' })

const columns = [
  { prop: 'orderNo', label: '订单号', minWidth: 150 },
  { prop: 'expressNo', label: '快递单号', width: 140 },
  { prop: 'expressCompany', label: '快递公司', width: 100 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'consignee', label: '收件人', width: 110 },
  { prop: 'consigneeZip', label: '邮编', width: 90 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'weight', label: '重量(kg)', width: 90 },
  { prop: 'supplierName', label: '供应商', width: 110 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
</script>
