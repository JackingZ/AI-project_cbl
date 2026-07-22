<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单号">
        <el-input v-model="query.keyword" placeholder="订单号/原单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="签收状态">
        <el-select v-model="query.signStatus" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in SIGN_STATUS" :key="s" :label="s" :value="s" />
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
        :action-width="150"
        @change="loadData"
      >
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #col-signStatus="{ row }">
          <el-tag size="small" :type="row.signStatus === '已签收' ? 'success' : 'warning'">{{ row.signStatus }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="row.signStatus === '待签收'"
            link type="success" size="small"
            @click="doSign(row)"
          >签收</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmThen } from '@/utils'
import { formatMoney } from '@/utils/format'
import { getSignOrders, signOrder, SIGN_STATUS, ORDER_STATUS, orderStatusTag } from '@/api/modules/orderlist'

defineOptions({ name: 'OlSign' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getSignOrders, { keyword: '', signStatus: '', status: '' })

const columns = [
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'destinationCountry', label: '目的国', width: 90 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'signStatus', label: '签收状态', width: 100, align: 'center' },
  { prop: 'signTime', label: '签收时间', width: 170 },
  { prop: 'createTime', label: '下单时间', width: 170 },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' }
]

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

const doSign = row =>
  confirmThen(`确认订单「${row.orderNo}」已签收？`, async () => {
    await signOrder(row.id)
    loadData()
  }, { title: '订单签收', success: '签收成功' })
</script>
