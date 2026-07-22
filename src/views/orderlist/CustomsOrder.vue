<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="订单号/柜号提单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="进出口">
        <el-select v-model="query.ioType" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="t in IO_TYPES" :key="t" :label="t" :value="t" />
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
import { getCustomsOrders, IO_TYPES, ORDER_STATUS, orderStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlCustoms' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCustomsOrders, { keyword: '', ioType: '', status: '' })

const columns = [
  { prop: 'declarationNo', label: '报关单号', width: 110 },
  { prop: 'code', label: '原单号', width: 100 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'ioType', label: '进出口', width: 80, align: 'center' },
  { prop: 'declareStatus', label: '报关状态', width: 100 },
  { prop: 'inspectionStatus', label: '报检状态', width: 100 },
  { prop: 'startCountry', label: '起运国', width: 90 },
  { prop: 'destinationCountry', label: '目的国', width: 90 },
  { prop: 'containerNo', label: '柜号/提单', width: 110 },
  { prop: 'supplierName', label: '供应商', width: 110 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
</script>
