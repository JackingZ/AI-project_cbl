<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="原单号">
        <el-input v-model="query.keyword" placeholder="订单号/原单号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库状态">
        <el-select v-model="query.warehouseStatus" placeholder="全部" clearable style="width: 130px">
          <el-option label="在库" value="在库" />
          <el-option label="部分出库" value="部分出库" />
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
        :action-width="140"
        @change="loadData"
      >
        <template #col-warehouseStatus="{ row }">
          <el-tag size="small" :type="row.warehouseStatus === '在库' ? 'success' : 'warning'">{{ row.warehouseStatus }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
import { confirmDelete } from '@/utils'
import { getWarehouseOrders, deleteOrder, BUSINESS_TYPES } from '@/api/modules/orderlist'

defineOptions({ name: 'OlWarehouse' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getWarehouseOrders, { keyword: '', businessType: '', warehouseStatus: '' })

const columns = [
  { prop: 'code', label: '原单号', width: 110 },
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'loadType', label: '装货方式', width: 90 },
  { prop: 'channel', label: '渠道', width: 110 },
  { prop: 'containerNo', label: '柜号', width: 100 },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'totalBox', label: '箱数', width: 70, align: 'center' },
  { prop: 'weight', label: '重量(kg)', width: 90 },
  { prop: 'volume', label: '体积(m³)', width: 90 },
  { prop: 'warehouseStatus', label: '仓库状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '下单时间', width: 170 }
]

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

const handleDelete = row =>
  confirmDelete(async () => {
    await deleteOrder(row.id)
    loadData()
  }, `确定删除订单「${row.orderNo}」吗？`)
</script>
