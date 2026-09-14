<template>
  <div>
    <!-- express / order-tracking 内嵌视图 -->
    <OrderExpressView v-show="viewMode === 'express'" ref="expressRef" @back="viewMode = 'main'" />
    <OrderTrackingView v-show="viewMode === 'order-tracking'" ref="trackingRef" @back="viewMode = 'main'" />

    <div v-show="viewMode === 'main'" class="mo-wrap">
      <!-- 左侧 200px 订单状态菜单树 -->
      <div class="mo-menu">
        <div class="mo-menu__all">全部订单 <span>{{ stat.orderCount ?? 0 }}</span></div>
        <el-menu @select="handleSelect">
          <template v-for="m in menuList" :key="m.id">
            <el-sub-menu v-if="m.children" :index="String(m.id)">
              <template #title>{{ m.name }} <span class="mo-menu__num">{{ m.number }}</span></template>
              <el-menu-item v-for="c in m.children" :key="c.id" :index="String(c.id)">{{ c.name }}</el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="String(m.id)">{{ m.name }} <span class="mo-menu__num">{{ m.number }}</span></el-menu-item>
          </template>
        </el-menu>
      </div>

      <!-- 右侧内容区 -->
      <div class="mo-content">
        <!-- 统计头：订单数量 + 5 图标统计（label 与字段错位，按源保真） -->
        <div class="mo-stat">
          <div class="mo-stat__main">
            <div class="mo-stat__label">订单数量</div>
            <div class="mo-stat__num">{{ stat.orderCount ?? 0 }}</div>
          </div>
          <div v-for="c in statCards" :key="c.key" class="mo-stat__card">
            <div class="mo-stat__label">{{ c.label }}</div>
            <div class="mo-stat__value">{{ stat[c.key] ?? 0 }}</div>
          </div>
          <div class="mo-stat__export">
            <el-button type="primary" plain @click="handleExport">导出当前数据</el-button>
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
          <el-form-item label="下单时间">
            <el-date-picker v-model="query.orderTime" type="daterange" range-separator="-" start-placeholder="起" end-placeholder="止" value-format="YYYY-MM-DD" :clearable="false" style="width: 240px" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 300px">
              <template #prepend>
                <el-select v-model="query.selectType" style="width: 110px">
                  <el-option v-for="s in SELECT_TYPE_LIST" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </template>
              <template #append>
                <el-tooltip content="精准匹配" placement="top">
                  <el-button :icon="query.isVague ? Aim : Search" @click="query.isVague = !query.isVague" />
                </el-tooltip>
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
              <div class="mo-sub" :title="row.orderStatus_describe">{{ row.orderStatus_describe }}</div>
              <div class="mo-sub">{{ row.orderStatus_updateAt }}</div>
            </template>
            <template #col-company="{ row }">{{ row.custType !== '0' ? (row.buyer || {}).name : (row.seller || {}).name }}</template>
            <template #col-addressType="{ row }">{{ lookup(ADDRESS_TYPE_LIST, row.addressType) }}</template>
            <template #col-country="{ row }">{{ (row.consignee || {}).country }}</template>
            <template #col-province="{ row }">{{ (row.consignee || {}).province }}</template>
            <template #col-city="{ row }">{{ (row.consignee || {}).city }}</template>
            <template #col-lsc="{ row }">{{ (row.lsc || {}).value }}</template>
            <template #col-type="{ row }">{{ lookup(BIZ_TYPE_LIST, row.type) }}</template>
            <!-- 报关方式：customs0 普通报关0/出口退税1 -->
            <template #col-customs0="{ row }">
              {{ lookup(CUSTOMS0_LIST, row.customs0) }}
              <!-- 源注释保留：自有进口商报关(customs1==='0') / 无进口商(customs1==='1') -->
            </template>
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
            <template #col-containerNo="{ row }">
              <div>{{ row.containerNo || '--' }}</div>
              <div>{{ row.billNo || '--' }}</div>
            </template>
            <template #col-totalVolume="{ row }">{{ (row.measure || {}).totalVolume || 0 }} m³</template>
            <template #col-totalWight="{ row }">{{ (row.measure || {}).totalWight || 0 }} kg</template>
            <template #col-priceVolume="{ row }">{{ (row.measure || {}).priceVolume || '--' }}</template>
            <template #col-priceWight="{ row }">{{ (row.measure || {}).priceWight || '--' }}</template>
            <template #col-priceUnit="{ row }">{{ priceUnitLabel((row.measure || {}).priceUnit) }}</template>
            <template #col-credit="{ row }">
              <div>{{ row.credit }}</div>
              <div>{{ row.creditRating }}</div>
            </template>
            <template #col-cutoffTime="{ row }">{{ row.cutoffTime ? '已出' : '未出' }}</template>
            <template #col-amount="{ row }">
              <div>{{ row.amount }} {{ row.amountUnit }}</div>
              <div>{{ row.selfAmount }} {{ row.selfAmountUnit }}</div>
            </template>
            <template #col-isPayment="{ row }">{{ row.isPayment ? '是' : '否' }}</template>
          </ProTable>
        </PageCard>

        <!-- 更多筛选 抽屉 (400px) -->
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
              <!-- dispatchList：卡派=0/快递=1（与主表格列语义相反，逐处保真勿统一） -->
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
            <el-form-item label="所属业务员">
              <el-select v-model="more.includeCust" clearable placeholder="全部" style="width: 100%"><el-option v-for="u in salerOptions" :key="u.id" :label="`${u.realName} - ${u.deptName}`" :value="u.id" /></el-select>
            </el-form-item>
            <el-form-item label="所属财务">
              <el-select v-model="more.includeFinance" clearable placeholder="全部" style="width: 100%"><el-option v-for="u in financeOptions" :key="u.id" :label="`${u.realName} - ${u.deptName}`" :value="u.id" /></el-select>
            </el-form-item>
            <el-form-item label="所属客服">
              <el-select v-model="more.includeService" clearable placeholder="全部" style="width: 100%"><el-option v-for="u in serviceOptions" :key="u.id" :label="`${u.realName} - ${u.deptName}`" :value="u.id" /></el-select>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Aim } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderExpressView from './components/OrderExpressView.vue'
import OrderTrackingView from './components/OrderTrackingView.vue'
import { useListQuery } from '@/utils/hooks'
import {
  managerApi, lookup, BIZ_TYPE_LIST, AUDIT_LIST, ADDRESS_TYPE_LIST, CUSTOMS0_LIST,
  DELIVERY_WAY_LIST, EXPRESS_NO_LIST, IF_LOADING_LIST, PAY_STATUS_LIST, SELECT_TYPE_LIST,
  getCountryOptions
} from '@/api/modules/sales'

defineOptions({ name: 'SalesManager' })

const viewMode = ref('main')
const expressRef = ref(null)
const trackingRef = ref(null)
const priceUnitLabel = u => (u === '2' ? '重量计费' : u === '3' ? '体积计费' : '--')

// 近30天默认区间
const recent30 = () => {
  const p = n => String(n).padStart(2, '0')
  const fmt = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  const end = new Date(); const start = new Date(end.getTime() - 29 * 86400000)
  return [fmt(start), fmt(end)]
}

/* 左侧菜单（handleSelect 空实现，对齐源） */
const menuList = ref([])
const handleSelect = () => {}

/* 统计头（5 图标 label 与字段错位，按源保真） */
const stat = reactive({})
const statCards = [
  { key: 'paymentCount', label: '总件数' },
  { key: 'unpaymentCount', label: '总重量' },
  { key: 'overDueCount', label: '总体积' },
  { key: 'shippedCount', label: '应收款' },
  { key: 'deliveringCount', label: '实收款' }
]

const countryList = ref([])
const statusList = ref([])
const userList = ref([])
const salerOptions = computed(() => userList.value.filter(u => u.postType === 0))
const financeOptions = computed(() => userList.value.filter(u => u.postType === 1))
const serviceOptions = computed(() => userList.value.filter(u => u.postType === 2))

onMounted(async () => {
  menuList.value = (await managerApi.getMenuList()).data
  statusList.value = (await managerApi.getStatusList()).data
  userList.value = (await managerApi.getUserList()).data
  countryList.value = (await getCountryOptions()).data
  Object.assign(stat, (await managerApi.statistics()).data)
})

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(managerApi.list, {
  audit: '', type: '', countryId: '', keyWord: '', selectType: '1', isVague: false, orderTime: recent30(), lscId: '',
  ifLoading: '', addressType: '', customs0: '', includeTax: '', deliveryWay: '',
  inventoryStatus: '', measureStatus: '', examineStatus: '', declartionStatus: '', expressNo: '',
  includeCust: '', includeFinance: '', includeService: '', payStatus: []
})
const onTypeChange = () => { query.deliveryWay = ''; query.lscId = '' }
const onCountryChange = () => { query.fbastoreId = ''; query.lscId = '' }

const columns = [
  { prop: 'custName', label: '客户名称', minWidth: 150, fixed: 'left' },
  { prop: 'custType', label: '客户类型', width: 100 },
  { prop: 'code', label: '原单号', minWidth: 150 },
  { prop: 'orderStatus_name', label: '当前状态', minWidth: 200 },
  { prop: 'createTime', label: '下单日期', width: 170 },
  { prop: 'wsInTime', label: '入库日期', width: 170 },
  { prop: 'wareHouseAt', label: '货物所在仓', width: 170 },
  { prop: 'company', label: '所属公司', minWidth: 150 },
  { prop: 'salesman', label: '所属业务员', width: 170 },
  { prop: 'finances', label: '财务人员', width: 170 },
  { prop: 'customers', label: '客服人员', width: 170 },
  { prop: 'addressType', label: '地址类型', width: 120 },
  { prop: 'country', label: '目的国', width: 170 },
  { prop: 'province', label: '目的省份', width: 170 },
  { prop: 'city', label: '目的城市', width: 170 },
  { prop: 'warehouse', label: '目的仓', width: 120 },
  { prop: 'lsc', label: '专线服务', width: 170 },
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'customs0', label: '报关方式', width: 100 },
  { prop: 'includeTax', label: '关税方式', width: 100 },
  { prop: 'deliveryWay', label: '派送方式', width: 100 },
  { prop: 'expressName', label: '快递公司', minWidth: 150 },
  { prop: 'trackingNos', label: '快递单号', width: 100 },
  { prop: 'containerNo', label: '柜号/提单号', width: 160 },
  { prop: 'batch', label: '发货批次', width: 120 },
  { prop: 'packages', label: '总件数', width: 100, align: 'right' },
  { prop: 'totalVolume', label: '实际总体积', minWidth: 120, align: 'right' },
  { prop: 'totalWight', label: '实际总重量', minWidth: 120, align: 'right' },
  { prop: 'priceVolume', label: '收费体积', width: 120, align: 'right' },
  { prop: 'priceWight', label: '收费重量', width: 120, align: 'right' },
  { prop: 'priceUnit', label: '计费单位', width: 100 },
  { prop: 'bulky', label: '分泡比', width: 100 },
  { prop: 'method', label: '结算方式', width: 110 },
  { prop: 'credit', label: '公司信用', width: 150 },
  { prop: 'cutoffTime', label: '账单', width: 100 },
  { prop: 'invoiceTime', label: '开票日期', width: 170 },
  { prop: 'amount', label: '应收金额', minWidth: 150, align: 'right' },
  { prop: 'payTime', label: '结算日期', width: 170 },
  { prop: 'isPayment', label: '是否付款', width: 100, align: 'center' },
  { prop: 'overDay', label: '逾期天数', width: 100, align: 'center' },
  { prop: 'remarks', label: '备注', minWidth: 120 }
]

/* 更多筛选抽屉 */
const moreShow = ref(false)
const defaultMore = () => ({
  ifLoading: '', addressType: '', customs0: '', includeTax: '', deliveryWay: '',
  inventoryStatus: '', measureStatus: '', examineStatus: '', declartionStatus: '', expressNo: '',
  includeCust: '', includeFinance: '', includeService: '', payStatus: []
})
const more = reactive(defaultMore())
const dispatchList = computed(() => {
  if (more.addressType === '2') return [{ id: '4', name: '到仓' }]
  if (['1', '2'].includes(query.type)) return [{ id: '3', name: '整柜直送' }, { id: '2', name: '自提' }]
  return [{ id: '0', name: '卡派' }, { id: '1', name: '快递' }, { id: '2', name: '自提' }]
})
const statusOf = type => statusList.value.filter(s => s.type === type && s.id !== '99')
const applyMore = () => { Object.assign(query, more); query.page = 1; moreShow.value = false; loadData() }
const resetMore = () => { Object.assign(more, defaultMore()); Object.assign(query, more); query.page = 1; loadData() }

const handleExport = () => { ElMessage.success('导出当前数据（mock）') }

/* 内嵌视图切换 */
const showExpress = row => { viewMode.value = 'express'; expressRef.value.show(row) }
const showOrderTracking = row => { viewMode.value = 'order-tracking'; trackingRef.value.show(row) }
</script>

<style scoped lang="scss">
.mo-wrap { display: flex; gap: $space-md; }
.mo-menu {
  width: 200px; flex-shrink: 0; background: $bg-card; border-radius: $card-radius; padding: $space-sm;
  &__all { font-weight: 600; padding: $space-sm; span { color: $primary-color; } }
  &__num { color: $text-secondary; font-size: $font-sm; }
  :deep(.el-menu) { border-right: none; }
}
.mo-content { flex: 1; min-width: 0; }
.mo-stat {
  display: grid;
  grid-template-columns: 180px repeat(5, 1fr) auto;
  gap: $space-md; align-items: center;
  margin-bottom: $space-md;
  &__main {
    background: $primary-color; color: #fff; border-radius: $card-radius;
    padding: $space-md; display: flex; flex-direction: column; justify-content: center;
  }
  &__card { background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md; }
  &__label { font-size: $font-sm; opacity: .85; }
  &__num { font-size: 28px; font-weight: 700; margin-top: $space-xs; }
  &__value { font-size: $font-lg; font-weight: 700; color: $text-primary; margin-top: $space-xs; }
  &__export { text-align: right; }
}
.mo-sub { color: $text-secondary; font-size: $font-sm; }
</style>
