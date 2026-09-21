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
      <el-form-item label="快递公司">
        <el-select v-model="query.expressCompany" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="c in EXPRESS_COMPANIES" :key="c" :label="c" :value="c" />
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
        <el-form-item label="快递类型">
          <el-select v-model="query.expressType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in EXPRESS_TYPES" :key="t" :label="t" :value="t" />
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
        :action-width="260"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('resubmit')" @click="demoAction('重新提交')">重新提交</el-button>
          <el-button link type="warning" size="small" :disabled="!can('revoke')" @click="doRevoke(row)">撤单</el-button>
          <el-button link type="primary" size="small" :disabled="!can('swap')" @click="openSwap(row)">换单</el-button>
          <el-dropdown trigger="click" @command="cmd => demoAction(cmd)">
            <el-button link type="primary" size="small" :disabled="!can('export')">更多<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="m in MORE_ITEMS" :key="m" :command="m">{{ m }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />
    <SwapDialog v-model="swapVisible" :record="current" @saved="loadData" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import SwapDialog from '@/components/Common/SwapDialog.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmThen, demoAction } from '@/utils'
import {
  getExpressOrders, cancelOrder,
  EXPRESS_COMPANIES, ORDER_STATUS, ORDER_TYPES, COMPANY_TYPES, COMPANY_NAMES, EXPRESS_TYPES, orderStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlExpress' })

// 关键字搜索字段（前置下拉，对齐源页：原单号/快递单号）
const KEY_FIELDS = [
  { label: '原单号', value: 'code' },
  { label: '快递单号', value: 'expressNo' }
]

const { can } = usePagePerms()
const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getExpressOrders, {
    keyword: '', keyField: 'code', orderType: '', status: '', expressCompany: '',
    companyType: '', companyName: '', expressType: '', dateRange: []
  })

const columns = [
  { prop: 'expressNo', label: '快递单号', width: 130, fixed: 'left' },
  { prop: 'code', label: '原单号', minWidth: 130, fixed: 'left' },
  { prop: 'status', label: '订单状态', width: 100, align: 'center', fixed: 'left' },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'packageType', label: '包裹类型', width: 90, align: 'center' },
  { prop: 'packages', label: '包裹数量', width: 90, align: 'center' },
  { prop: 'weight', label: '总重量', width: 90 },
  { prop: 'volume', label: '总体积', width: 90 },
  { prop: 'expressCompany', label: '快递公司', minWidth: 120 },
  { prop: 'consignee', label: '收件人', minWidth: 120 },
  { prop: 'consigneeZip', label: '收件人邮编', width: 110 },
  { prop: 'createTime', label: '下单时间', width: 160 }
]

const MORE_ITEMS = [
  '下载快递标签ZIP', '下载快递标签PDF', '下载快递标签PDF(马赛克)', '下载指定快递标签', '导出', '操作日志'
]

const detailVisible = ref(false)
const swapVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openSwap = row => { current.value = row; swapVisible.value = true }

const doRevoke = row =>
  confirmThen(`确定撤销快递订单「${row.orderNo}」吗？`, async () => { await cancelOrder(row.id); loadData() },
    { title: '撤单', success: '已撤单' })
</script>
