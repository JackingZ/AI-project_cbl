<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in SCHEDULE_STATUS" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="目的地">
        <el-select v-model="query.destinationCountry" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="下单时间">
        <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
      </el-form-item>
      <el-form-item label="原单号">
        <el-input v-model="query.keyword" placeholder="原单号" clearable style="width: 160px" />
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
        :action-width="200"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusName(row.status) }}</el-tag>
        </template>
        <template #col-deliveryWay="{ row }">{{ deliveryName(row.deliveryWay) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button v-if="row.status === '0'" link type="primary" size="small" :disabled="!can('vehicle')" @click="openVehicle(row)">分配车辆</el-button>
          <el-button v-if="row.status === '0'" link type="success" size="small" :disabled="!can('complete')" @click="doComplete(row)">完成调度</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignVehicleDialog v-model="vehicleVisible" :record="current" @saved="onAssigned" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AssignVehicleDialog from '@/components/Common/AssignVehicleDialog.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmThen } from '@/utils'
import {
  getScheduleTasks, assignScheduleCar, completeSchedule,
  SCHEDULE_STATUS, SCHEDULE_DELIVERY, COUNTRIES
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlAllocation' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getScheduleTasks, { keyword: '', status: '', destinationCountry: '', dateRange: [] })

const columns = [
  { prop: 'code', label: '原单号', width: 120, fixed: 'left' },
  { prop: 'status', label: '订单状态', width: 110, align: 'center' },
  { prop: 'createTime', label: '下单时间', width: 160 },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'deliveryWay', label: '提货方式', width: 100 },
  { prop: 'pickTime', label: '提货日期', width: 120 },
  { prop: 'destinationCountry', label: '目的地', width: 90 },
  { prop: 'planTime', label: '送货日期', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 110 }
]
const statusName = v => SCHEDULE_STATUS.find(s => s.id === v)?.name || v
const statusTag = v => ({ '0': 'warning', '3': 'danger', '60': 'success' }[v] || 'info')
const deliveryName = v => SCHEDULE_DELIVERY.find(d => d.id === v)?.name || v

const detailVisible = ref(false)
const vehicleVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openVehicle = row => { current.value = row; vehicleVisible.value = true }
const onAssigned = () => loadData()

const doComplete = row =>
  confirmThen(`确认完成订单「${row.code}」的调度吗？`, async () => { await completeSchedule(row.id); loadData() },
    { title: '完成调度', success: '已完成调度' })
</script>
