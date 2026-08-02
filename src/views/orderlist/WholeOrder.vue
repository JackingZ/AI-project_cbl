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
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 320px">
          <template #prepend>
            <el-select v-model="query.keyField" style="width: 110px">
              <el-option v-for="o in KEY_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </template>
          <template #append>
            <el-tooltip :content="query.exact ? '精准匹配（已开启）' : '精准匹配（已关闭）'" placement="top">
              <el-button :type="query.exact ? 'primary' : ''" :icon="Aim" @click="query.exact = !query.exact" />
            </el-tooltip>
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
        <el-button @click="demoAction('导出当前数据')">导出当前数据</el-button>
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
        <template #col-orderInfo="{ row }">
          <div class="ol-cell">
            <div><el-tag size="small" effect="plain">{{ row.businessType }}</el-tag> {{ row.serviceName }}</div>
            <div class="ol-cell__sub">原单号：{{ row.code }}</div>
          </div>
        </template>
        <template #col-curStatus="{ row }">
          <div class="ol-cell">
            <el-tag :type="orderStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
            <div class="ol-cell__sub">{{ row.createTime }}</div>
          </div>
        </template>
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #col-estimateFee="{ row }">{{ formatMoney(row.estimateFee) }}</template>
        <template #col-ifShip="{ row }">
          <el-tag size="small" :type="row.ifShip === '已发货' ? 'success' : 'info'">{{ row.ifShip }}</el-tag>
        </template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-billStatus="{ row }">
          <el-button link type="primary" size="small" @click="openBill(row)">{{ row.billStatus }}</el-button>
        </template>
        <template #col-overdueDays="{ row }">
          <span :class="{ 'ol-overdue': row.overdueDays > 0 }">{{ row.overdueDays || 0 }}</span>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
          <el-button v-if="row.status !== '已取消'" link type="warning" size="small" @click="openAudit(row)">订单审核</el-button>
          <el-dropdown trigger="click" @command="cmd => onCommand(cmd, row)">
            <el-button link type="primary" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
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
    <AuditDialog v-model="auditVisible" :record="current" @saved="loadData" />
    <BillDialog v-model="billVisible" :record="current" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowDown, Aim } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import AuditDialog from '@/components/Common/AuditDialog.vue'
import BillDialog from '@/components/Common/BillDialog.vue'
import { useListQuery } from '@/utils/hooks'
import { confirmThen, demoAction } from '@/utils'
import { formatMoney } from '@/utils/format'
import {
  getWholeOrders, cancelOrder, deleteOrder,
  BUSINESS_TYPES, ORDER_STATUS, AUDIT_STATUS, ORDER_TYPES, COMPANY_TYPES, COMPANY_NAMES,
  COUNTRIES, FBA_WAREHOUSES, SERVICES, orderStatusTag, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlWhole' })

// 关键字搜索字段（前置下拉，对齐源页：原单号/客户名称/快递单号）
const KEY_FIELDS = [
  { label: '原单号', value: 'code' },
  { label: '客户名称', value: 'customerName' },
  { label: '快递单号', value: 'expressNo' }
]

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getWholeOrders, {
    keyword: '', keyField: 'code', exact: false, orderType: '', status: '', audit: '', businessType: '',
    companyType: '', companyName: '', destinationCountry: '', fbaWarehouse: '', serviceName: '', dateRange: []
  })

const columns = [
  { prop: 'orderInfo', label: '订单信息', minWidth: 200, fixed: 'left' },
  { prop: 'curStatus', label: '当前状态', minWidth: 170 },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'createTime', label: '下单时间', width: 160 },
  { prop: 'orderWarehouse', label: '下单仓库', width: 120 },
  { prop: 'goodsWarehouse', label: '货物所在仓', width: 120 },
  { prop: 'declareMethod', label: '报关方式', width: 110 },
  { prop: 'pickMethod', label: '提货方式', width: 110 },
  { prop: 'deliverMethod', label: '派送方式', width: 110 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'ifShip', label: '是否发货', width: 90, align: 'center' },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'inStatus', label: '入库状态', width: 100 },
  { prop: 'outStatus', label: '出库状态', width: 100 },
  { prop: 'measureStatus', label: '计量状态', width: 100 },
  { prop: 'measureAudit', label: '计量审核', width: 100 },
  { prop: 'inspectStatus', label: '验货状态', width: 100 },
  { prop: 'declareStatus', label: '报关状态', width: 100 },
  { prop: 'expressNo', label: '快递单号', width: 130 },
  { prop: 'billStatus', label: '账单', width: 90, align: 'center' },
  { prop: 'estimateFee', label: '预估运费', width: 110 },
  { prop: 'payDeadline', label: '截止付款时间', width: 170 },
  { prop: 'overdueDays', label: '逾期天数', width: 90, align: 'center' }
]

const MORE_ITEMS = [
  '商品导出', '打印唛头10*15', '打印唛头10*10', '打印唛头10*15(新版)', '打印唛头10*10(新版)',
  '打印唛头A4-4', '打印入仓单', '生成快递单', '冻结订单', '申请解冻', '解冻审核',
  '申请出库', '订单修改', '申请退货', '删除订单', '取消订单'
]

const detailVisible = ref(false)
const auditVisible = ref(false)
const billVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }
const openAudit = row => { current.value = row; auditVisible.value = true }
const openBill = row => { current.value = row; billVisible.value = true }

const onCommand = (cmd, row) => {
  if (cmd === '取消订单') {
    return confirmThen(`确定取消订单「${row.orderNo}」吗？`, async () => { await cancelOrder(row.id); loadData() },
      { title: '取消订单', success: '订单已取消' })
  }
  if (cmd === '删除订单') {
    return confirmThen(`确定删除订单「${row.orderNo}」吗？`, async () => { await deleteOrder(row.id); loadData() },
      { title: '删除订单', success: '订单已删除' })
  }
  demoAction(cmd)
}
</script>

<style scoped lang="scss">
.ol-cell { line-height: 1.5; }
.ol-cell__sub { color: $text-secondary; font-size: $font-sm; }
.ol-overdue { color: var(--el-color-danger); font-weight: 600; }
</style>
