<template>
  <div>
    <!-- express / order-tracking 内嵌视图 -->
    <OrderExpressView v-show="viewMode === 'express'" ref="expressRef" @back="viewMode = 'main'" />
    <OrderTrackingView v-show="viewMode === 'order-tracking'" ref="trackingRef" @back="viewMode = 'main'" />

    <div v-show="viewMode === 'main'">
      <!-- 统计头：订单数量 + 6 图标统计 -->
      <div class="os-stat">
        <div class="os-stat__main">
          <div class="os-stat__label">订单数量</div>
          <div class="os-stat__num">{{ stat.orderCount ?? 0 }}</div>
        </div>
        <div v-for="c in statCards" :key="c.key" class="os-stat__card">
          <div class="os-stat__label">{{ c.label }}</div>
          <div class="os-stat__value">{{ stat[c.key] ?? 0 }}</div>
        </div>
      </div>

      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="审核状态">
          <el-select v-model="query.audit" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="a in AUDIT_LIST" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 120px" @change="onTypeChange">
            <el-option v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的国家">
          <el-select v-model="query.countryId" clearable placeholder="全部" style="width: 140px" @change="onCountryChange">
            <el-option v-for="c in countryList" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 320px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option v-for="s in SELECT_TYPE_LIST" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button link type="primary" @click="moreShow = true">更多筛选</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
          <template #col-custName="{ row }">{{ (row.custName || {}).name }}</template>
          <template #col-custType="{ row }">{{ row.custType === '0' ? '直客' : '同行' }}</template>
          <template #col-orderStatus_name="{ row }">
            <el-link type="primary" @click="showOrderTracking(row)">{{ row.orderStatus_name }}</el-link>
            <div class="os-sub" :title="row.orderStatus_describe">{{ row.orderStatus_describe }}</div>
            <div class="os-sub">{{ row.orderStatus_updateAt }}</div>
          </template>
          <template #col-company="{ row }">{{ row.custType !== '0' ? (row.buyer || {}).name : (row.seller || {}).name }}</template>
          <template #col-addressType="{ row }">{{ lookup(ADDRESS_TYPE_LIST, row.addressType) }}</template>
          <template #col-country="{ row }">{{ (row.consignee || {}).country }}</template>
          <template #col-province="{ row }">{{ (row.consignee || {}).province }}</template>
          <template #col-city="{ row }">{{ (row.consignee || {}).city }}</template>
          <template #col-lsc="{ row }">{{ (row.lsc || {}).value }}</template>
          <template #col-type="{ row }">{{ lookup(BIZ_TYPE_LIST, row.type) }}</template>
          <template #col-customs0="{ row }">{{ lookup(CUSTOMS0_LIST, row.customs0) }}</template>
          <template #col-includeTax="{ row }">{{ row.includeTax ? '包税' : '不包税' }}</template>
          <template #col-deliveryWay="{ row }">{{ lookup(DELIVERY_WAY_LIST, row.deliveryWay) }}</template>
          <template #col-expressName="{ row }">{{ (row.express || {}).expressName || '--' }}</template>
          <template #col-trackingNos="{ row }">
            <template v-if="row.deliveryWay === '0'">
              <el-popover v-if="(row.express || {}).trackingNos && row.express.trackingNos.length" placement="top" width="240" trigger="hover">
                <template #reference><el-link type="primary" @click="showExpress(row)">已出</el-link></template>
                <div v-for="(no, i) in row.express.trackingNos" :key="i">{{ no }}</div>
              </el-popover>
              <span v-else>未出</span>
            </template>
            <span v-else>--</span>
          </template>
          <template #col-totalVolume="{ row }">{{ (row.measure || {}).totalVolume || 0 }} m³</template>
          <template #col-totalWight="{ row }">{{ (row.measure || {}).totalWight || 0 }} kg</template>
          <template #col-priceVolume="{ row }">{{ (row.measure || {}).priceVolume || '--' }}</template>
          <template #col-priceWight="{ row }">{{ (row.measure || {}).priceWight || '--' }}</template>
          <template #col-priceUnit="{ row }">{{ priceUnitLabel((row.measure || {}).priceUnit) }}</template>
          <template #col-amount="{ row }">{{ row.amount }} {{ row.amountUnit }}</template>
          <template #col-selfAmount="{ row }">{{ row.selfAmount }} {{ row.selfAmountUnit }}</template>
          <template #col-isPayment="{ row }">{{ row.isPayment ? '是' : '否' }}</template>
          <template #col-audit="{ row }">
            <el-tag size="small" :type="auditTag(row.audit)">{{ lookup(AUDIT_LIST, row.audit) }}</el-tag>
          </template>
        </ProTable>
      </PageCard>

      <!-- 更多筛选 右抽屉 (400px) -->
      <el-drawer v-model="moreShow" title="更多筛选" size="400px" append-to-body>
        <el-form :model="more" label-width="90px">
          <el-form-item label="是否发货">
            <el-radio-group v-model="more.ifLoading"><el-radio v-for="o in IF_LOADING_LIST" :key="o.id" :value="o.id">{{ o.name }}</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="地址类型">
            <el-radio-group v-model="more.addressType" @change="more.deliveryWay = ''"><el-radio v-for="o in ADDRESS_TYPE_LIST" :key="o.id" :value="o.id">{{ o.name }}</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="报关方式">
            <el-radio-group v-model="more.customs0"><el-radio v-for="o in CUSTOMS0_LIST" :key="o.id" :value="o.id">{{ o.name }}</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="关税方式">
            <el-radio-group v-model="more.includeTax"><el-radio :value="false">不包税</el-radio><el-radio :value="true">包税</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="派送方式">
            <!-- dispatchList 动态：addressType==='2'→[到仓4]；type∈['1','2']→[整柜直送3,自提2]；否则[卡派0,快递1,自提2] -->
            <el-radio-group v-model="more.deliveryWay"><el-radio v-for="o in dispatchList" :key="o.id" :value="o.id">{{ o.name }}</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="入库状态">
            <el-select v-model="more.inventoryStatus" clearable placeholder="全部" style="width: 100%"><el-option v-for="s in statusOf('WS_IN')" :key="s.id" :label="s.name" :value="s.id" /></el-select>
          </el-form-item>
          <el-form-item label="计量状态">
            <el-select v-model="more.measureStatus" clearable placeholder="全部" style="width: 100%"><el-option v-for="s in statusOf('MEASURE')" :key="s.id" :label="s.name" :value="s.id" /></el-select>
          </el-form-item>
          <el-form-item label="验货状态">
            <el-select v-model="more.examineStatus" clearable placeholder="全部" style="width: 100%"><el-option v-for="s in statusOf('EXAMINE')" :key="s.id" :label="s.name" :value="s.id" /></el-select>
          </el-form-item>
          <el-form-item label="报关状态">
            <el-select v-model="more.declartionStatus" clearable placeholder="全部" style="width: 100%"><el-option v-for="s in statusOf('CUSTOM_DECLARATION')" :key="s.id" :label="s.name" :value="s.id" /></el-select>
          </el-form-item>
          <el-form-item label="快递状态">
            <el-select v-model="more.expressNo" clearable placeholder="全部" style="width: 100%"><el-option v-for="o in EXPRESS_NO_LIST" :key="o.id" :label="o.name" :value="o.id" /></el-select>
          </el-form-item>
          <el-form-item label="付款状态">
            <el-checkbox-group v-model="more.payStatus"><el-checkbox v-for="o in PAY_STATUS_LIST" :key="o.id" :value="o.id">{{ o.name }}</el-checkbox></el-checkbox-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="resetMore">重置</el-button>
          <el-button type="primary" @click="applyMore">查询</el-button>
        </template>
      </el-drawer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderExpressView from './components/OrderExpressView.vue'
import OrderTrackingView from './components/OrderTrackingView.vue'
import { useListQuery } from '@/utils/hooks'
import {
  statApi, managerApi, lookup, BIZ_TYPE_LIST, AUDIT_LIST, ADDRESS_TYPE_LIST, CUSTOMS0_LIST,
  DELIVERY_WAY_LIST, EXPRESS_NO_LIST, IF_LOADING_LIST, PAY_STATUS_LIST, SELECT_TYPE_LIST,
  getCountryOptions
} from '@/api/modules/sales'

defineOptions({ name: 'SalesStat' })

const viewMode = ref('main')
const expressRef = ref(null)
const trackingRef = ref(null)
const auditTag = a => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[a] || 'info')
// 计费单位 priceUnit：'2'重量计费 / '3'体积计费
const priceUnitLabel = u => (u === '2' ? '重量计费' : u === '3' ? '体积计费' : '--')

/* 统计头 */
const stat = reactive({})
const statCards = [
  { key: 'paymentCount', label: '总件数' },
  { key: 'unpaymentCount', label: '总重量' },
  { key: 'overDueCount', label: '总体积' },
  { key: 'shippedCount', label: '应收款' },
  { key: 'deliveringCount', label: '实收款' },
  { key: 'receiverCount', label: '已签收' }
]

const countryList = ref([])
const statusList = ref([])
onMounted(async () => {
  Object.assign(stat, (await statApi.statistics()).data)
  countryList.value = (await getCountryOptions()).data
  statusList.value = (await managerApi.getStatusList()).data
})

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(statApi.list, {
  audit: '', type: '', countryId: '', keyWord: '', selectType: '1', lscId: '',
  ifLoading: '', addressType: '', customs0: '', includeTax: '', deliveryWay: '',
  inventoryStatus: '', measureStatus: '', examineStatus: '', declartionStatus: '', expressNo: '', payStatus: []
})
const onTypeChange = () => { query.deliveryWay = ''; query.lscId = '' }
const onCountryChange = () => { query.lscId = '' }

/* 宽表列（40+，逐列保真） */
const columns = [
  { prop: 'custName', label: '客户名称', minWidth: 150, fixed: 'left' },
  { prop: 'custType', label: '客户类型', width: 100 },
  { prop: 'code', label: '原单号', minWidth: 150 },
  { prop: 'orderStatus_name', label: '当前状态', minWidth: 200 },
  { prop: 'createTime', label: '下单日期', width: 170 },
  { prop: 'wsInTime', label: '入库日期', width: 170 },
  { prop: 'wareHouseAt', label: '货物所在仓', width: 170 },
  { prop: 'company', label: '所属公司', minWidth: 150 },
  { prop: 'salesman', label: '所属业务员', width: 130 },
  { prop: 'finances', label: '财务人员', width: 130 },
  { prop: 'customers', label: '客服人员', width: 130 },
  { prop: 'addressType', label: '地址类型', width: 120 },
  { prop: 'country', label: '目的国', width: 120 },
  { prop: 'province', label: '目的省份', width: 120 },
  { prop: 'city', label: '目的城市', width: 120 },
  { prop: 'warehouse', label: '目的仓', width: 120 },
  { prop: 'lsc', label: '专线服务', width: 150 },
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'customs0', label: '报关方式', width: 100 },
  { prop: 'includeTax', label: '关税方式', width: 100 },
  { prop: 'deliveryWay', label: '派送方式', width: 100 },
  { prop: 'expressName', label: '快递公司', minWidth: 150 },
  { prop: 'trackingNos', label: '快递单号', width: 100 },
  { prop: 'containerNo', label: '柜号', width: 130 },
  { prop: 'billNo', label: '提单号', width: 130 },
  { prop: 'batch', label: '发货批次', width: 120 },
  { prop: 'packages', label: '总件数', width: 100, align: 'right' },
  { prop: 'totalVolume', label: '实际总体积', minWidth: 120, align: 'right' },
  { prop: 'totalWight', label: '实际总重量', minWidth: 120, align: 'right' },
  { prop: 'priceVolume', label: '收费体积', width: 120, align: 'right' },
  { prop: 'priceWight', label: '收费重量', width: 120, align: 'right' },
  { prop: 'priceUnit', label: '计费单位', width: 100 },
  { prop: 'bulky', label: '分泡比', width: 100 },
  { prop: 'creditRating', label: '公司信用', width: 100, align: 'center' },
  { prop: 'invoiceTime', label: '开票日期', width: 170 },
  { prop: 'amount', label: '应收金额', minWidth: 150, align: 'right' },
  { prop: 'selfAmount', label: '本币金额', minWidth: 150, align: 'right' },
  { prop: 'payTime', label: '结算日期', width: 170 },
  { prop: 'isPayment', label: '是否付款', width: 100, align: 'center' },
  { prop: 'overDay', label: '逾期天数', width: 100, align: 'center' },
  { prop: 'audit', label: '审核状态', width: 110, align: 'center' },
  { prop: 'remarks', label: '备注', minWidth: 120 }
]

/* 更多筛选抽屉 */
const moreShow = ref(false)
const defaultMore = () => ({
  ifLoading: '', addressType: '', customs0: '', includeTax: '', deliveryWay: '',
  inventoryStatus: '', measureStatus: '', examineStatus: '', declartionStatus: '', expressNo: '', payStatus: []
})
const more = reactive(defaultMore())
// dispatchList 动态（注意：searchMore 中 卡派=0/快递=1，与主表格列语义相反，逐处保真勿统一）
const dispatchList = computed(() => {
  if (more.addressType === '2') return [{ id: '4', name: '到仓' }]
  if (['1', '2'].includes(query.type)) return [{ id: '3', name: '整柜直送' }, { id: '2', name: '自提' }]
  return [{ id: '0', name: '卡派' }, { id: '1', name: '快递' }, { id: '2', name: '自提' }]
})
const statusOf = type => statusList.value.filter(s => s.type === type && s.id !== '99')
const applyMore = () => { Object.assign(query, more); query.page = 1; moreShow.value = false; loadData() }
const resetMore = () => { Object.assign(more, defaultMore()); Object.assign(query, more); query.page = 1; loadData() }

/* 内嵌视图切换 */
const showExpress = row => { viewMode.value = 'express'; expressRef.value.show(row) }
const showOrderTracking = row => { viewMode.value = 'order-tracking'; trackingRef.value.show(row) }
</script>

<style scoped lang="scss">
.os-stat {
  display: grid;
  grid-template-columns: 200px repeat(6, 1fr);
  gap: $space-md;
  margin-bottom: $space-md;
  &__main {
    background: $primary-color; color: #fff; border-radius: $card-radius;
    padding: $space-md; display: flex; flex-direction: column; justify-content: center;
  }
  &__card {
    background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md;
  }
  &__label { font-size: $font-sm; opacity: .85; }
  &__num { font-size: 30px; font-weight: 700; margin-top: $space-xs; }
  &__value { font-size: $font-xl; font-weight: 700; color: $text-primary; margin-top: $space-xs; }
}
.os-sub { color: $text-secondary; font-size: $font-sm; }
@media (max-width: 1440px) {
  .os-stat { grid-template-columns: 160px repeat(3, 1fr); }
}
</style>
