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
      <el-form-item label="报关类型">
        <el-select v-model="query.declareType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in DECLARE_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="报关单号/原单号" clearable style="width: 180px" />
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
        <el-form-item label="订单类别">
          <el-select v-model="query.ioType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in IO_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务国家">
          <el-select v-model="query.countryName" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
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
        :action-width="230"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="openAssign(row)">指定供应商</el-button>
          <el-button link type="primary" size="small" @click="demoAction('流转报关单')">流转报关单</el-button>
          <el-button v-if="row.status !== '已取消'" link type="warning" size="small" @click="doCancel(row)">取消</el-button>
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
import { confirmThen, demoAction } from '@/utils'
import {
  getCustomsOrders, cancelOrder,
  ORDER_TYPES, ORDER_STATUS, DECLARE_TYPES, COMPANY_TYPES, IO_TYPES, COUNTRIES, orderStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlCustoms' })

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCustomsOrders, {
    keyword: '', orderType: '', status: '', declareType: '',
    companyType: '', companyName: '', ioType: '', countryName: '', dateRange: []
  })

const columns = [
  { prop: 'declarationNo', label: '报关单号', width: 120, fixed: 'left' },
  { prop: 'code', label: '原单号', width: 100 },
  { prop: 'orderType', label: '订单类型', width: 100 },
  { prop: 'ioType', label: '进出口类型', width: 100, align: 'center' },
  { prop: 'declareType', label: '报关类型', width: 110 },
  { prop: 'countryName', label: '服务国家', width: 100 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'fileStatus', label: '文件状态', width: 100 },
  { prop: 'declareStatus', label: '报关状态', width: 100 },
  { prop: 'inspectionStatus', label: '报检状态', width: 100 },
  { prop: 'createTime', label: '下单日期', width: 160 }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }

const doCancel = row =>
  confirmThen(`确定取消报关单「${row.declarationNo}」吗？`, async () => { await cancelOrder(row.id); loadData() },
    { title: '取消报关单', success: '已取消' })
</script>
