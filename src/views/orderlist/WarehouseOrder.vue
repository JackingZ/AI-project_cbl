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
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in WH_BIZ_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单来源">
        <el-select v-model="query.orderSource" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in WH_SOURCES" :key="s" :label="s" :value="s" />
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
        <el-form-item label="装货方式">
          <el-select v-model="query.loadType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="m in LOAD_METHODS" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-input v-model="query.orderWarehouse" placeholder="仓库" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
        </el-form-item>
      </template>
      <template #actions>
        <el-button link type="primary" @click="showMore = !showMore">{{ showMore ? '收起筛选' : '更多筛选' }}</el-button>
        <el-button @click="demoAction('导出当前数据')">导出当前数据</el-button>
        <el-button @click="demoAction('打印入仓单')">打印入仓单</el-button>
        <el-button @click="demoAction('打印唛头')">打印唛头</el-button>
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
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          <el-button link type="primary" size="small" :disabled="!can('bill')" @click="openBill(row)">账单信息</el-button>
          <el-button link type="primary" size="small" @click="demoAction('流转订单')">流转订单</el-button>
          <el-dropdown trigger="click" @command="cmd => demoAction(cmd)">
            <el-button link type="primary" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="生成拆柜">生成拆柜</el-dropdown-item>
                <el-dropdown-item v-for="m in MORE_ITEMS" :key="m" :command="m">{{ m }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <BillDialog v-model="billVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import BillDialog from '@/components/Common/BillDialog.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete, demoAction } from '@/utils'
import {
  getWarehouseOrders, deleteOrder,
  WH_BIZ_TYPES, WH_SOURCES, ORDER_STATUS, ORDER_TYPES, COMPANY_TYPES, COMPANY_NAMES, LOAD_METHODS, orderStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlWarehouse' })

const { can } = usePagePerms()

// 关键字搜索字段（前置下拉，对齐源页：原单号/柜号）
const KEY_FIELDS = [
  { label: '原单号', value: 'code' },
  { label: '柜号', value: 'containerNo' }
]

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getWarehouseOrders, {
    keyword: '', keyField: 'code', orderType: '', status: '', businessType: '', orderSource: '',
    companyType: '', companyName: '', loadType: '', orderWarehouse: '', dateRange: []
  })

const columns = [
  { prop: 'code', label: '原单号', width: 120, fixed: 'left' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center' },
  { prop: 'businessType', label: '业务类型', width: 100 },
  { prop: 'source', label: '订单来源', width: 110 },
  { prop: 'channel', label: '渠道', width: 110 },
  { prop: 'createTime', label: '下单时间', width: 160 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'orderWarehouse', label: '下单仓库', width: 120 },
  { prop: 'loadType', label: '装货方式', width: 100 },
  { prop: 'totalBox', label: '箱数', width: 70, align: 'center' },
  { prop: 'volume', label: '体积', width: 90 },
  { prop: 'weight', label: '重量', width: 90 },
  { prop: 'remark', label: '备注', minWidth: 120 }
]

const MORE_ITEMS = ['下载快递标签ZIP', '下载快递标签PDF', '下载快递标签PDF(马赛克)', '下载指定快递标签']

const detailVisible = ref(false)
const billVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openBill = row => { current.value = row; billVisible.value = true }

const handleDelete = row =>
  confirmDelete(async () => { await deleteOrder(row.id); loadData() }, `确定删除订单「${row.orderNo}」吗？`)
</script>
