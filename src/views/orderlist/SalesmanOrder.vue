<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="订单号/原单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="录单状态">
        <el-select v-model="query.entryStatus" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in ENTRY_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" @click="goAdd">代客下单</el-button>
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
        :action-width="100"
        @change="loadData"
      >
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
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { formatMoney } from '@/utils/format'
import { getSalesmanOrders, BUSINESS_TYPES, ENTRY_STATUS, orderStatusTag, auditStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlSalesman' })

const router = useRouter()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getSalesmanOrders, { keyword: '', businessType: '', entryStatus: '' })

const columns = [
  { prop: 'code', label: '业务编码', width: 110 },
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'audit', label: '审核状态', width: 110, align: 'center' },
  { prop: 'entryStatus', label: '录单状态', width: 100, align: 'center' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' }
]

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

const goAdd = () => router.push({ name: 'OlSalesmanAdd' })
</script>
