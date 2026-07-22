<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="原单号">
        <el-input v-model="query.keyword" placeholder="订单号/原单号" clearable style="width: 180px" />
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
        :action-width="150"
        @change="loadData"
      >
        <template #col-driverName="{ row }">{{ row.driverName || '未派车' }}</template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button link type="primary" size="small" @click="openAssign(row)">派车</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignVehicleDialog v-model="assignVisible" :record="current" @saved="loadData" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AssignVehicleDialog from '@/components/Common/AssignVehicleDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { getCarOrders, ORDER_STATUS, orderStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlCar' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCarOrders, { keyword: '', status: '' })

const columns = [
  { prop: 'code', label: '原单号', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'goodsName', label: '货物', width: 110 },
  { prop: 'destinationCountry', label: '目的地', width: 90 },
  { prop: 'pickTime', label: '提货日期', width: 120 },
  { prop: 'planTime', label: '送货日期', width: 120 },
  { prop: 'driverName', label: '司机', width: 100 },
  { prop: 'cardId', label: '车牌号', width: 110 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
</script>
