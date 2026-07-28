<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单类型">
        <el-select v-model="query.orderType" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="t in ORDER_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="拖车类型">
        <el-select v-model="query.trailerType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in TRAILER_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="SO号">
        <el-input v-model="query.keyword" placeholder="SO号/原单号" clearable style="width: 160px" />
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
        <el-form-item label="起运港">
          <el-select v-model="query.portFrom" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="p in PORTS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="取货时间">
          <el-date-picker v-model="query.pickRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
        </el-form-item>
        <el-form-item label="进仓时间">
          <el-date-picker v-model="query.warehouseRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
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
        :action-width="240"
        @change="loadData"
      >
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #col-supplierName="{ row }">{{ row.supplierName || '未指派' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="openAssign(row)">指定供应商</el-button>
          <el-button link type="primary" size="small" @click="openVehicle(row)">分配车辆</el-button>
          <el-button link type="primary" size="small" @click="openBill(row)">账单信息</el-button>
          <el-button v-if="row.status !== '已取消'" link type="warning" size="small" @click="doCancel(row)">取消</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignSupplierDialog v-model="assignVisible" :record="current" @saved="loadData" />
    <AssignVehicleDialog v-model="vehicleVisible" :record="current" @saved="loadData" />
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
import AssignVehicleDialog from '@/components/Common/AssignVehicleDialog.vue'
import BillDialog from '@/components/Common/BillDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmThen } from '@/utils'
import {
  getTrailerOrders, cancelOrder, ORDER_TYPES, ORDER_STATUS, COMPANY_TYPES,
  TRAILER_TYPES, PORTS, orderStatusTag, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlTrailer' })

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getTrailerOrders, {
    keyword: '', orderType: '', status: '', trailerType: '',
    companyType: '', companyName: '', portFrom: '', pickRange: [], warehouseRange: []
  })

const columns = [
  { prop: 'portFrom', label: '起运港', width: 110, fixed: 'left' },
  { prop: 'soCode', label: 'SO号', width: 120 },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'trailerType', label: '拖车类型', width: 110 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'supplierName', label: '供应商', width: 110 },
  { prop: 'serviceProvider', label: '服务提供商', width: 110 },
  { prop: 'warehouseTime', label: '进仓时间', width: 160 },
  { prop: 'pickTime', label: '取货时间', width: 120 },
  { prop: 'createTime', label: '创建时间', width: 160 }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const vehicleVisible = ref(false)
const billVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
const openVehicle = row => { current.value = row; vehicleVisible.value = true }
const openBill = row => { current.value = row; billVisible.value = true }

const doCancel = row =>
  confirmThen(`确定取消订单「${row.orderNo}」吗？`, async () => { await cancelOrder(row.id); loadData() },
    { title: '取消订单', success: '订单已取消' })
</script>
