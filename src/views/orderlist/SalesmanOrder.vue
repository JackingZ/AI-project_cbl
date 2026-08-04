<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="所属客户">
        <el-input v-model="query.customerName" placeholder="所属客户" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="录单状态">
        <el-select v-model="query.entryStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in ENTRY_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 280px">
          <template #prepend>
            <el-select v-model="query.keyField" style="width: 100px">
              <el-option v-for="o in KEY_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <template v-if="showMore">
        <el-form-item label="业务类型">
          <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in SALESMAN_TRANSPORT" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的国家">
          <el-select v-model="query.destinationCountry" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="FBA仓库">
          <el-select v-model="query.fbaWarehouse" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="w in FBA_WAREHOUSES" :key="w" :label="w" :value="w" />
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
        :action-width="120"
        @change="loadData"
      >
        <template #col-orderInfo="{ row }">
          <div class="ol-cell">
            <div><el-tag size="small" effect="plain">{{ row.businessType }}</el-tag> {{ row.serviceName }}</div>
            <div class="ol-cell__sub">原单号：{{ row.code }}</div>
          </div>
        </template>
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-entryStatus="{ row }">
          <el-tag size="small" :type="row.entryStatus === '已录单' ? 'success' : 'info'">{{ row.entryStatus }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #col-billStatus="{ row }">
          <el-button link type="primary" size="small" @click="openBill(row)">{{ row.billStatus }}</el-button>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button v-if="row.entryStatus !== '已录单'" link type="primary" size="small" :disabled="!can('entry')" @click="goEntry(row)">录单</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <BillDialog v-model="billVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import BillDialog from '@/components/Common/BillDialog.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { formatMoney } from '@/utils/format'
import {
  getSalesmanOrders,
  SALESMAN_TRANSPORT, ORDER_STATUS, AUDIT_STATUS, ENTRY_STATUS,
  COUNTRIES, FBA_WAREHOUSES, SERVICES, orderStatusTag, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlSalesman' })

const { can } = usePagePerms()
const router = useRouter()
// 关键字搜索字段（前置下拉，对齐源页：原单号）
const KEY_FIELDS = [
  { label: '原单号', value: 'code' }
]

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getSalesmanOrders, {
    keyword: '', keyField: 'code', customerName: '', status: '', entryStatus: '', audit: '',
    businessType: '', destinationCountry: '', fbaWarehouse: '', serviceName: '', dateRange: []
  })

const columns = [
  { prop: 'orderInfo', label: '订单信息', minWidth: 200, fixed: 'left' },
  { prop: 'entryStatus', label: '录单状态', width: 100, align: 'center' },
  { prop: 'declareMethod', label: '报关方式', width: 110 },
  { prop: 'pickMethod', label: '提货方式', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'inStatus', label: '入库状态', width: 100 },
  { prop: 'outStatus', label: '出库状态', width: 100 },
  { prop: 'measureStatus', label: '计量状态', width: 100 },
  { prop: 'inspectStatus', label: '验货状态', width: 100 },
  { prop: 'declareStatus', label: '报关状态', width: 100 },
  { prop: 'expressNo', label: '快递单号', width: 130 },
  { prop: 'billStatus', label: '账单', width: 90, align: 'center' }
]

const detailVisible = ref(false)
const billVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openBill = row => { current.value = row; billVisible.value = true }
const goEntry = () => router.push({ name: 'OlSalesmanAdd' })
</script>

<style scoped lang="scss">
.ol-cell { line-height: 1.5; }
.ol-cell__sub { color: $text-secondary; font-size: $font-sm; }
</style>
