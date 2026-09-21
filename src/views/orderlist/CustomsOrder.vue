<template>
  <div>
    <!-- 按订单/按柜 双模式切换 -->
    <div class="mode-switch">
      <el-radio-group v-model="mode" @change="onModeChange">
        <el-radio-button label="order">按订单</el-radio-button>
        <el-radio-button label="cabinet">按柜</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ========== 按订单模式 ========== -->
    <template v-if="mode === 'order'">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="订单类型">
          <el-select v-model="query.orderType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in ORDER_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in CUSTOMS_ORDER_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类别">
          <el-select v-model="query.category" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in CUSTOMS_CATEGORIES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="报关类型">
          <el-select v-model="query.declareType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in CUSTOMS_DECLARE_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 300px">
            <template #prepend>
              <el-select v-model="query.keyField" style="width: 110px">
                <el-option v-for="o in KEY_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </template>
          </el-input>
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
          :action-width="220"
          @change="loadData"
        >
          <template #col-status="{ row }">
            <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" size="small" :disabled="!can('assign')" @click="openAssign(row)">指定供应商</el-button>
            <el-button link type="primary" size="small" @click="demoAction('流转报关单')">流转报关单</el-button>
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- ========== 按柜模式 ========== -->
    <template v-else>
      <SearchBar :model="cabQuery" @search="handleCabSearch" @reset="handleCabReset">
        <el-form-item label="供应商">
          <el-select v-model="cabQuery.supplierName" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in SUPPLIERS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="起运国">
          <el-select v-model="cabQuery.startCountry" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的国">
          <el-select v-model="cabQuery.destinationCountry" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="进出口类型">
          <el-select v-model="cabQuery.ioType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in IO_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="报关状态">
          <el-select v-model="cabQuery.declareStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in ['待报关', '报关中', '已放行']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="报检状态">
          <el-select v-model="cabQuery.inspectionStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in ['待报检', '已报检']" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="柜号/提单号">
          <el-input v-model="cabQuery.keyword" placeholder="请输入柜号/提单号" clearable style="width: 180px" />
        </el-form-item>
      </SearchBar>

      <PageCard>
        <ProTable
          v-model:page="cabQuery.page"
          v-model:size="cabQuery.size"
          :data="cabList"
          :columns="cabColumns"
          :loading="cabLoading"
          :total="cabTotal"
          :action-width="90"
          @change="loadCab"
        >
          <template #col-declareStatus="{ row }"><el-tag size="small">{{ row.declareStatus }}</el-tag></template>
          <template #col-inspectionStatus="{ row }"><el-tag size="small" effect="plain">{{ row.inspectionStatus }}</el-tag></template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          </template>
        </ProTable>
      </PageCard>
    </template>

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
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import {
  getCustomsOrders, getCustomsCabinets,
  ORDER_TYPES, CUSTOMS_ORDER_STATUS, CUSTOMS_CATEGORIES, CUSTOMS_DECLARE_TYPES,
  COMPANY_TYPES, COMPANY_NAMES, IO_TYPES, COUNTRIES, SUPPLIERS, orderStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlCustoms' })
const { can } = usePagePerms()

const mode = ref('order')
const onModeChange = () => { mode.value === 'cabinet' ? loadCab() : loadData() }

// 关键字搜索字段（前置下拉，对齐源页：订舱单SO/柜号/原单号）
const KEY_FIELDS = [
  { label: '订舱单(SO)', value: 'soCode' },
  { label: '柜号', value: 'containerNo' },
  { label: '原单号', value: 'code' }
]

// ===== 按订单模式 =====
const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCustomsOrders, {
    keyword: '', keyField: 'soCode', orderType: '', status: '', category: '', declareType: '',
    companyType: '', companyName: '', countryName: '', dateRange: []
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

// ===== 按柜模式 =====
const { query: cabQuery, list: cabList, total: cabTotal, loading: cabLoading, loadData: loadCab, handleSearch: handleCabSearch, handleReset: handleCabReset } =
  useListQuery(getCustomsCabinets, {
    supplierName: '', startCountry: '', destinationCountry: '', ioType: '', declareStatus: '', inspectionStatus: '', keyword: ''
  })
const cabColumns = [
  { prop: 'containerNo', label: '柜号', width: 130, fixed: 'left' },
  { prop: 'billNo', label: '提单号', width: 130 },
  { prop: 'ioType', label: '进出口', width: 90, align: 'center' },
  { prop: 'supplierName', label: '供应商', minWidth: 120 },
  { prop: 'startCountry', label: '起运国', width: 100 },
  { prop: 'destinationCountry', label: '目的国', width: 100 },
  { prop: 'declareStatus', label: '报关状态', width: 110 },
  { prop: 'inspectionStatus', label: '报检状态', width: 110 },
  { prop: 'warehouseTime', label: '起运时间', width: 160 },
  { prop: 'planTime', label: '到港时间', width: 130 }
]

const detailVisible = ref(false)
const assignVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAssign = row => { current.value = row; assignVisible.value = true }
</script>

<style scoped lang="scss">
.mode-switch { margin-bottom: $space-md; }
</style>
