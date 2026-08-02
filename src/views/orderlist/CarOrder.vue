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
      <el-form-item label="目的地">
        <el-select v-model="query.destinationCountry" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="原单号">
        <el-input v-model="query.keyword" placeholder="原单号" clearable style="width: 160px" />
      </el-form-item>
      <template v-if="showMore">
        <el-form-item label="公司类型">
          <el-select v-model="query.companyType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in COMPANY_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="query.companyName" placeholder="全部" clearable filterable style="width: 140px">
            <el-option v-for="n in COMPANY_NAMES" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务">
          <el-select v-model="query.serviceName" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in SERVICES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
        </el-form-item>
      </template>
      <template #actions>
        <el-button link type="primary" @click="showMore = !showMore">{{ showMore ? '收起筛选' : '更多筛选' }}</el-button>
        <el-button type="success" @click="goSchedule">调度任务</el-button>
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
        :action-width="200"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #col-supplierName="{ row }">{{ row.supplierName || '未指派' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="openVehicle(row)">分配车辆</el-button>
          <el-button link type="primary" size="small" @click="openDriver(row)">司机信息</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <AssignVehicleDialog v-model="vehicleVisible" :record="current" @saved="loadData" />
    <DriverDialog v-model="driverVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AssignVehicleDialog from '@/components/Common/AssignVehicleDialog.vue'
import DriverDialog from '@/components/Common/DriverDialog.vue'
import { useListQuery } from '@/utils/hooks'
import {
  getCarOrders, ORDER_TYPES, ORDER_STATUS, COMPANY_TYPES, COMPANY_NAMES, BUSINESS_TYPES, COUNTRIES, SERVICES, orderStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlCar' })

const router = useRouter()
const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCarOrders, {
    keyword: '', orderType: '', status: '', destinationCountry: '',
    companyType: '', companyName: '', businessType: '', serviceName: '', dateRange: []
  })

const columns = [
  { prop: 'code', label: '原单号', width: 120, fixed: 'left' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '下单时间', width: 160 },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'serviceName', label: '服务', width: 120 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'supplierName', label: '供应商', width: 110 },
  { prop: 'serviceProvider', label: '服务提供商', width: 110 },
  { prop: 'pickMethod', label: '提货方式', width: 100 },
  { prop: 'pickTime', label: '提货日期', width: 120 },
  { prop: 'destinationCountry', label: '目的地', width: 90 },
  { prop: 'planTime', label: '送货日期', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 110 }
]

const detailVisible = ref(false)
const vehicleVisible = ref(false)
const driverVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openVehicle = row => { current.value = row; vehicleVisible.value = true }
const openDriver = row => { current.value = row; driverVisible.value = true }
const goSchedule = () => router.push({ name: 'OlAllocation' })
</script>
