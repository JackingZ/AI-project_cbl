<template>
  <div>
    <!-- 内嵌详情（对齐源 detailShow 切换，非路由跳转） -->
    <FinancialOrderDetail v-if="detail.show" :row-id="detail.id" @back="detail.show = false" />

    <template v-else>
      <!-- 统计卡片 -->
      <div class="fin-stat">
        <div v-for="c in statCards" :key="c.key" class="fin-stat__card" :class="`fin-stat__card--${c.color}`">
          <div class="fin-stat__label">{{ c.label }}</div>
          <div class="fin-stat__value">{{ stat[c.key] ?? 0 }}</div>
        </div>
      </div>

      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="审核状态">
          <el-select v-model="query.audit" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="a in ORDER_AUDIT_LIST" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="运输方式">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 300px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option label="原单号" value="1" />
                <el-option label="柜号" value="2" />
                <el-option label="运单号" value="3" />
                <el-option label="提单号" value="4" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button link type="primary" @click="moreDrawer.visible = true">更多筛选</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="120" @change="loadData">
          <template #col-type="{ row }">{{ lookup(BIZ_TYPE_LIST, row.type) }}</template>
          <template #col-priceUnit="{ row }">{{ row.priceUnit === '2' ? '按体积' : row.priceUnit === '3' ? '按重量' : '--' }}</template>
          <template #col-amount="{ row }">{{ row.amount }} {{ row.amountUnit }}</template>
          <template #col-selfAmount="{ row }">{{ row.selfAmount }} {{ row.selfAmountUnit }}</template>
          <template #col-isPayment="{ row }">
            <el-tag size="small" :type="row.isPayment ? 'success' : 'info'">{{ row.isPayment ? '已付款' : '未付款' }}</el-tag>
          </template>
          <template #col-audit="{ row }">
            <el-tag size="small" :type="auditTag(row.audit)">{{ lookup(ORDER_AUDIT_LIST, row.audit) }}</el-tag>
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看详情</el-button>
            <!-- 源页注释按钮，保持注释：编辑 / 审核 / 生成账单 / 冻结 -->
            <!-- <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="openAudit(row)">审核</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="genBill(row)">生成账单</el-button> -->
          </template>
        </ProTable>
      </PageCard>

      <!-- 更多筛选 抽屉 -->
      <el-drawer v-model="moreDrawer.visible" title="更多筛选" size="380px" append-to-body>
        <el-form :model="moreDrawer.form" label-width="90px">
          <el-form-item label="国家"><el-input v-model="moreDrawer.form.country" placeholder="请输入国家" clearable /></el-form-item>
          <el-form-item label="仓库"><el-input v-model="moreDrawer.form.warehouse" placeholder="请输入仓库" clearable /></el-form-item>
          <el-form-item label="客户名称"><el-input v-model="moreDrawer.form.custName" placeholder="请输入客户名称" clearable /></el-form-item>
          <el-form-item label="业务员"><el-input v-model="moreDrawer.form.salesman" placeholder="请输入业务员" clearable /></el-form-item>
          <el-form-item label="财务"><el-input v-model="moreDrawer.form.finances" placeholder="请输入财务" clearable /></el-form-item>
          <el-form-item label="派送方式">
            <el-select v-model="moreDrawer.form.deliveryWay" clearable placeholder="全部" style="width: 100%">
              <el-option v-for="d in DELIVERY_WAY_LIST" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否含税">
            <el-select v-model="moreDrawer.form.includeTax" clearable placeholder="全部" style="width: 100%">
              <el-option label="是" value="1" />
              <el-option label="否" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="发票时间">
            <el-date-picker v-model="moreDrawer.form.invoiceTime" type="daterange" range-separator="-" start-placeholder="起期" end-placeholder="止期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
          <el-form-item label="付款时间">
            <el-date-picker v-model="moreDrawer.form.payTime" type="daterange" range-separator="-" start-placeholder="起期" end-placeholder="止期" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="resetMore">重置</el-button>
          <el-button type="primary" @click="applyMore">查询</el-button>
        </template>
      </el-drawer>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import FinancialOrderDetail from './components/FinancialOrderDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { finOrderApi, BIZ_TYPE_LIST, DELIVERY_WAY_LIST, ORDER_AUDIT_LIST, lookup } from '@/api/modules/financial'

defineOptions({ name: 'FinLineOrder' })
const { can } = usePagePerms()
const auditTag = a => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[a] || 'info')

/* 统计卡片 */
const stat = reactive({})
const statCards = [
  { key: 'orderCount', label: '订单总数', color: 'primary' },
  { key: 'paymentCount', label: '已付款', color: 'success' },
  { key: 'unpaymentCount', label: '未付款', color: 'warning' },
  { key: 'overDueCount', label: '逾期', color: 'danger' },
  { key: 'shippedCount', label: '已发货', color: 'primary' },
  { key: 'deliveringCount', label: '运输中', color: 'primary' },
  { key: 'receiverCount', label: '已签收', color: 'success' },
  { key: 'billNotPaidCount', label: '账单未付', color: 'warning' },
  { key: 'abnormalCount', label: '异常', color: 'danger' }
]
onMounted(async () => { Object.assign(stat, (await finOrderApi.statistics()).data) })

/* 列表查询（mock .list 仅处理 audit/type/keyWord，更多筛选字段一并入 query，mock 忽略额外字段） */
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(finOrderApi.list, {
  audit: '', type: '', keyWord: '', selectType: '1',
  country: '', warehouse: '', custName: '', salesman: '', finances: '', deliveryWay: '', includeTax: '', invoiceTime: [], payTime: []
})

const columns = [
  { prop: 'code', label: '原单号', minWidth: 120, fixed: 'left' },
  { prop: 'type', label: '运输方式', minWidth: 90 },
  { prop: 'lscValue', label: '专线', minWidth: 110 },
  { prop: 'orderStatusName', label: '订单状态', minWidth: 100 },
  { prop: 'custName', label: '客户名称', minWidth: 130 },
  { prop: 'buyerName', label: '收货人', minWidth: 120 },
  { prop: 'sellerName', label: '发货人', minWidth: 120 },
  { prop: 'salesman', label: '业务员', minWidth: 90 },
  { prop: 'finances', label: '财务', minWidth: 90 },
  { prop: 'customers', label: '客服', minWidth: 90 },
  { prop: 'country', label: '国家', minWidth: 90 },
  { prop: 'warehouse', label: '仓库', minWidth: 90 },
  { prop: 'containerNo', label: '柜号', minWidth: 110 },
  { prop: 'billNo', label: '提单号', minWidth: 110 },
  { prop: 'trackingNos', label: '运单号', minWidth: 110 },
  { prop: 'batch', label: '批次', minWidth: 90 },
  { prop: 'packages', label: '件数', minWidth: 80, align: 'right' },
  { prop: 'totalVolume', label: '体积', minWidth: 90, align: 'right' },
  { prop: 'totalWeight', label: '重量', minWidth: 90, align: 'right' },
  { prop: 'priceUnit', label: '计费方式', minWidth: 100 },
  { prop: 'bulky', label: '泡比', minWidth: 90 },
  { prop: 'credit', label: '信用', minWidth: 110, align: 'right' },
  { prop: 'creditRating', label: '信用等级', minWidth: 90, align: 'center' },
  { prop: 'invoiceTime', label: '发票时间', minWidth: 120 },
  { prop: 'amount', label: '金额', minWidth: 130, align: 'right' },
  { prop: 'selfAmount', label: '本币金额', minWidth: 130, align: 'right' },
  { prop: 'payTime', label: '付款时间', minWidth: 120 },
  { prop: 'isPayment', label: '是否付款', minWidth: 100, align: 'center' },
  { prop: 'overDay', label: '逾期天数', minWidth: 90, align: 'center' },
  { prop: 'audit', label: '审核状态', minWidth: 100, align: 'center' },
  { prop: 'remarks', label: '备注', minWidth: 120 }
]

/* 更多筛选抽屉 */
const moreDrawer = reactive({
  visible: false,
  form: { country: '', warehouse: '', custName: '', salesman: '', finances: '', deliveryWay: '', includeTax: '', invoiceTime: [], payTime: [] }
})
const applyMore = () => {
  Object.assign(query, moreDrawer.form)
  moreDrawer.visible = false
  query.page = 1
  loadData()
}
const resetMore = () => {
  moreDrawer.form = { country: '', warehouse: '', custName: '', salesman: '', finances: '', deliveryWay: '', includeTax: '', invoiceTime: [], payTime: [] }
  Object.assign(query, moreDrawer.form)
  query.page = 1
  loadData()
}

/* 内嵌详情 */
const detail = reactive({ show: false, id: null })
const openView = row => Object.assign(detail, { show: true, id: row.id })
</script>

<style scoped lang="scss">
.fin-stat {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: $space-md;
  margin-bottom: $space-md;
  &__card {
    background: $bg-card;
    border-radius: $card-radius;
    box-shadow: $shadow-sm;
    padding: $space-md;
    border-left: 3px solid $primary-color;
    &--primary { border-left-color: $primary-color; }
    &--success { border-left-color: $success-color; }
    &--warning { border-left-color: $warning-color; }
    &--danger { border-left-color: $danger-color; }
  }
  &__label { font-size: $font-sm; color: $text-secondary; }
  &__value { font-size: $font-xl; font-weight: 700; color: $text-primary; margin-top: $space-xs; }
}
@media (max-width: 1440px) {
  .fin-stat { grid-template-columns: repeat(5, 1fr); }
}
</style>
