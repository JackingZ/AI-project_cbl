<template>
  <div>
    <!-- 列表视图 -->
    <template v-if="!formView.show">
      <PageCard>
        <div class="op-toolbar">
          <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
          <div class="op-filters">
            <el-select v-model="query.type" placeholder="业务类型" filterable clearable style="width: 110px">
              <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-select v-model="query.originCountryId" placeholder="起运国" clearable filterable style="width: 110px">
              <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-select v-model="query.targetCountryId" placeholder="目的国" clearable filterable style="width: 110px">
              <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-date-picker v-model="query.orderTime" type="daterange" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="下单起始" end-placeholder="下单截止" style="width: 240px" />
            <el-input v-model="query.code" clearable placeholder="请输入" style="width: 240px">
              <template #prepend>
                <el-select v-model="query.codeType" style="width: 100px">
                  <el-option label="原单号" value="1" />
                  <el-option label="备注" value="2" />
                  <el-option v-if="query.type === '1' || query.type === '2'" label="SO号" value="3" />
                  <el-option v-if="query.type === '1' || query.type === '2'" label="柜号" value="5" />
                  <el-option v-if="query.type === '0'" label="提单号" value="4" />
                </el-select>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button link type="primary" @click="moreFilter.show = true">更多筛选</el-button>
          </div>
        </div>
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
          <template #col-type="{ row }">{{ bizLabel(row.type) }}</template>
          <template #col-transType="{ row }">{{ transLabel(row.transType) }}</template>
          <template #col-bscName="{ row }">{{ row.bsc?.name }}</template>
          <template #col-count="{ row }">{{ (row.containers || []).length }}</template>
          <template #col-containerNo="{ row }">{{ row.containers?.[0]?.containerNo }}</template>
          <template #col-transport="{ row }">{{ transportLabel(row) }}</template>
          <template #col-org="{ row }">{{ row.org?.value }}</template>
          <template #col-serviceCode="{ row }">{{ row.bsc?.serviceCode }}</template>
          <template #col-originPort="{ row }">{{ row.originPort?.value }}</template>
          <template #col-targetPort="{ row }">{{ row.targetPort?.value }}</template>
          <template #col-originCountry="{ row }">{{ row.originCountry?.value }}</template>
          <template #col-targetCountry="{ row }">{{ row.targetCountry?.value }}</template>
          <template #col-ifWareHouseOut="{ row }">{{ row.ifWareHouseOut === 1 ? '是' : '否' }}</template>
          <template #col-ifLoad="{ row }">
            <el-button link type="primary" size="small" @click="demoAction('装柜/车确认')">{{ loadLabel(row.ifLoad) }}</el-button>
          </template>
          <template #col-ifOutDeclare="{ row }">{{ row.ifOutDeclare === 1 ? '是' : '否' }}</template>
          <template #col-ifEnterDeclare="{ row }">{{ row.ifEnterDeclare === 1 ? '是' : '否' }}</template>
          <template #col-ifOutTrailer="{ row }">{{ row.ifOutTrailer === 1 ? '是' : '否' }}</template>
          <template #col-ifEnterTrailer="{ row }">{{ row.ifEnterTrailer === 1 ? '是' : '否' }}</template>
          <template #col-ifOutCar="{ row }">{{ row.ifOutCar === 1 ? '是' : '否' }}</template>
          <template #col-ifEnterCar="{ row }">{{ row.ifEnterCar === 1 ? '是' : '否' }}</template>
          <template #col-openTank="{ row }">{{ row.openTank === 1 ? '是' : '否' }}</template>
          <template #col-dispatch="{ row }">{{ dispatchLabel(row.dispatch) }}</template>
          <template #col-fbastore="{ row }">{{ row.fbastore?.value }}</template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="cmd => demoAction(cmd)">
              <el-button link type="primary" size="small" :disabled="!can('export')">导出<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="m in EXPORT_ITEMS" :key="m" :command="m">{{ m }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-dropdown trigger="click" @command="cmd => demoAction(cmd)">
              <el-button link type="primary" size="small" :disabled="!can('edit')">更多<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="m in MORE_ITEMS" :key="m" :command="m">{{ m }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 两步向导视图 -->
    <PageCard v-else>
      <div class="form-head">
        <el-steps :active="activeStep" simple style="flex: 1">
          <el-step title="选择订单" />
          <el-step title="确认订单及费用" />
        </el-steps>
        <el-button link type="primary" @click="backToList">返 回</el-button>
      </div>

      <div v-show="activeStep === 0">
        <div class="wizard-filters">
          <el-select v-model="step1.transport" placeholder="业务类型" style="width: 110px">
            <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-input v-model="step1.code" clearable placeholder="原单号/提单号/SO号" style="width: 200px" />
          <el-button type="primary" @click="loadOrders">查询</el-button>
        </div>
        <el-table :data="orderList" border height="360" @selection-change="onSelectOrders">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="code" label="原单号" width="120" />
          <el-table-column prop="customerName" label="客户名称" min-width="130" />
          <el-table-column prop="countryName" label="目的国" width="100" />
          <el-table-column prop="warehouseName" label="货物所在仓" min-width="130" />
          <el-table-column prop="packages" label="件数" width="80" />
          <el-table-column prop="volume" label="总体积" width="90" />
          <el-table-column prop="weight" label="总重量" width="90" />
        </el-table>
        <div class="wizard-actions">
          <span class="wizard-tip">已选 {{ selectedOrders.length }} 个订单</span>
          <el-button type="primary" :disabled="!selectedOrders.length" @click="goStep2">下一步</el-button>
        </div>
      </div>

      <div v-show="activeStep === 1">
        <div class="form-section">订舱服务信息</div>
        <el-form :model="step2" label-width="110px" class="wizard-form" :disabled="formView.mode === 'view'">
          <el-form-item label="提单号"><el-input v-model="step2.billNo" placeholder="请输入" /></el-form-item>
          <el-form-item label="航空单号"><el-input v-model="step2.airNo" placeholder="请输入" /></el-form-item>
          <el-form-item label="SO号"><el-input v-model="step2.soCode" placeholder="请输入" /></el-form-item>
          <el-form-item label="船名"><el-input v-model="step2.shipName" placeholder="请输入" /></el-form-item>
          <el-form-item label="航次"><el-input v-model="step2.voyage" placeholder="请输入" /></el-form-item>
          <el-form-item label="服务机构">
            <el-select v-model="step2.orgId" filterable clearable placeholder="请选择" style="width: 100%">
              <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`服务机构${c.id}`" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="ETD"><el-date-picker v-model="step2.etd" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
          <el-form-item label="ETA"><el-date-picker v-model="step2.eta" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
          <el-form-item label="截单日期"><el-date-picker v-model="step2.cutoffDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
          <el-form-item label="截关日期"><el-date-picker v-model="step2.closeDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
          <el-form-item label="总票数"><el-input v-model="step2.total" readonly /></el-form-item>
          <el-form-item label="总件数"><el-input v-model="step2.count" readonly /></el-form-item>
          <el-form-item label="总重量"><el-input v-model="step2.weight" readonly /></el-form-item>
          <el-form-item label="总体积"><el-input v-model="step2.volume" readonly /></el-form-item>
        </el-form>
        <div class="wizard-actions">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button v-if="formView.mode !== 'view'" type="primary" @click="handleSave">保存</el-button>
        </div>
      </div>
    </PageCard>

    <!-- 更多筛选 drawer -->
    <el-drawer v-model="moreFilter.show" title="更多筛选" size="360px">
      <el-form label-width="110px">
        <el-form-item label="安排出库"><el-select v-model="moreFilter.ifWareHouseOut" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="起运港报关"><el-select v-model="moreFilter.ifOutDeclare" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="目的港报关"><el-select v-model="moreFilter.ifEnterDeclare" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="起运港拖车"><el-select v-model="moreFilter.ifOutTrailer" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="目的港拖车"><el-select v-model="moreFilter.ifEnterTrailer" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="起运港卡车"><el-select v-model="moreFilter.ifOutCar" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="目的港卡车"><el-select v-model="moreFilter.ifEnterCar" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <el-form-item label="拆柜打托"><el-select v-model="moreFilter.openTank" clearable placeholder="请选择" style="width: 100%"><el-option label="是" value="1" /><el-option label="否" value="0" /></el-select></el-form-item>
        <div style="text-align: right">
          <el-button @click="resetMoreFilter">重置</el-button>
          <el-button type="primary" @click="applyMoreFilter">确定</el-button>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import {
  singleApi, getDeliveryOrders,
  SHIP_BIZ_TYPES, SHIP_TRANS_TYPES, SHIP_DISPATCH, COUNTRY_OPTIONS
} from '@/api/modules/operation'

defineOptions({ name: 'OpSingle' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(singleApi.list, {
  type: '', originCountryId: '', targetCountryId: '', orderTime: [], code: '', codeType: '1',
  ifWareHouseOut: '', ifOutDeclare: '', ifEnterDeclare: '', ifOutTrailer: '', ifEnterTrailer: '', ifOutCar: '', ifEnterCar: '', openTank: ''
})

const columns = [
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'transType', label: '服务类型', width: 100 },
  { prop: 'bscName', label: '订舱服务', width: 150 },
  { prop: 'count', label: '数量', width: 90 },
  { prop: 'containerNo', label: '柜号/提单号', width: 150 },
  { prop: 'transport', label: '运输类型', width: 150 },
  { prop: 'org', label: '服务机构', width: 150 },
  { prop: 'serviceCode', label: '服务编码', width: 150 },
  { prop: 'originPort', label: '起运港', minWidth: 150 },
  { prop: 'targetPort', label: '目的港', minWidth: 150 },
  { prop: 'originCountry', label: '起运国', minWidth: 150 },
  { prop: 'targetCountry', label: '目的国', minWidth: 150 },
  { prop: 'ifWareHouseOut', label: '安排出库', width: 100 },
  { prop: 'ifLoad', label: '装柜/车确认', width: 120 },
  { prop: 'ifOutDeclare', label: '起运港报关', width: 120 },
  { prop: 'ifEnterDeclare', label: '目的港报关', width: 120 },
  { prop: 'ifOutTrailer', label: '起运港拖车', width: 120 },
  { prop: 'ifEnterTrailer', label: '目的港拖车', width: 120 },
  { prop: 'ifOutCar', label: '起运港卡车', width: 120 },
  { prop: 'ifEnterCar', label: '目的港卡车', width: 120 },
  { prop: 'openTank', label: '拆柜打托', width: 100 },
  { prop: 'dispatch', label: '派送方式', width: 120 },
  { prop: 'shippingDate', label: '起运日期', width: 160 },
  { prop: 'cutoffDate', label: '截单日期', width: 160 },
  { prop: 'transitTime', label: '运输时间', width: 100 },
  { prop: 'fbastore', label: '目的仓代码', minWidth: 150 },
  { prop: 'remark', label: '备注', width: 200 }
]
const bizLabel = v => SHIP_BIZ_TYPES.find(t => t.id === v)?.name || ''
const transLabel = v => SHIP_TRANS_TYPES.find(t => t.id === v)?.name || ''
const dispatchLabel = v => SHIP_DISPATCH.find(t => t.id === v)?.name || ''
const loadLabel = v => ({ 0: '待装载', 1: '待确认', 2: '已确认' }[v] || '待装载')
const transportLabel = row => {
  const prefix = { 0: '航空版', 1: '柜型', 2: '柜型', 3: '车型' }[row.type] || ''
  return `${prefix} ${row.containers?.[0]?.containerInfo?.containerName || ''}`.trim()
}

const EXPORT_ITEMS = ['订单明细', '目的港箱单发票(柜号)', '起运港箱单发票(柜号)', '目的港箱单发票(箱号)', '起运港箱单发票(箱号)', '保险单', '快递单', '拆柜清单标准版', '拆柜清单ROY版']
const MORE_ITEMS = ['安排出库', '补单出库', '起运港报关', '目的港报关', '起运港拖车', '目的港拖车', '起运港卡车', '目的港卡车', '拆柜打托']

// ===== 更多筛选 drawer =====
const moreFilter = reactive({ show: false, ifWareHouseOut: '', ifOutDeclare: '', ifEnterDeclare: '', ifOutTrailer: '', ifEnterTrailer: '', ifOutCar: '', ifEnterCar: '', openTank: '' })
const MORE_KEYS = ['ifWareHouseOut', 'ifOutDeclare', 'ifEnterDeclare', 'ifOutTrailer', 'ifEnterTrailer', 'ifOutCar', 'ifEnterCar', 'openTank']
const applyMoreFilter = () => { MORE_KEYS.forEach(k => { query[k] = moreFilter[k] }); moreFilter.show = false; handleSearch() }
const resetMoreFilter = () => { MORE_KEYS.forEach(k => { moreFilter[k] = ''; query[k] = '' }) }

// ===== 两步向导 =====
const formView = reactive({ show: false, mode: 'add', id: null })
const activeStep = ref(0)
const step1 = reactive({ transport: '0', code: '' })
const orderList = ref([])
const selectedOrders = ref([])
const step2 = reactive({ billNo: '', airNo: '', soCode: '', shipName: '', voyage: '', orgId: '', etd: '', eta: '', cutoffDate: '', closeDate: '', total: 0, count: 0, weight: 0, volume: 0 })

const resetWizard = () => {
  activeStep.value = 0
  Object.assign(step1, { transport: '0', code: '' })
  orderList.value = []
  selectedOrders.value = []
  Object.assign(step2, { billNo: '', airNo: '', soCode: '', shipName: '', voyage: '', orgId: '', etd: '', eta: '', cutoffDate: '', closeDate: '', total: 0, count: 0, weight: 0, volume: 0 })
}
const openAdd = () => { resetWizard(); Object.assign(formView, { show: true, mode: 'add', id: null }); loadOrders() }
const fillFromRow = (row, mode) => {
  resetWizard()
  activeStep.value = 1
  const c = row.containers?.[0] || {}
  Object.assign(step2, {
    billNo: c.billNo || '', soCode: c.soCode || '', cutoffDate: row.cutoffDate,
    total: (row.containers || []).length, count: (row.containers || []).length, weight: 0, volume: 0
  })
  Object.assign(formView, { show: true, mode, id: row.id })
}
const openView = row => fillFromRow(row, 'view')
const openEdit = row => fillFromRow(row, 'edit')
const backToList = () => { formView.show = false; loadData() }

const loadOrders = async () => {
  const res = await getDeliveryOrders({ code: step1.code })
  orderList.value = res.data.list
}
const onSelectOrders = rows => { selectedOrders.value = rows }
const goStep2 = () => {
  step2.total = selectedOrders.value.length
  step2.count = selectedOrders.value.reduce((a, o) => a + o.packages, 0)
  step2.weight = selectedOrders.value.reduce((a, o) => a + o.weight, 0)
  step2.volume = selectedOrders.value.reduce((a, o) => a + o.volume, 0)
  activeStep.value = 1
}
const handleSave = async () => {
  const t = step1.transport
  const payload = {
    keyCode: selectedOrders.value[0]?.code || `FH${Date.now() % 100000}`,
    type: t, transType: '0',
    bsc: { name: '分单订舱', serviceCode: step2.soCode || 'SVC0000' },
    containers: selectedOrders.value.map(o => ({ containerNo: o.containerNo, billNo: step2.billNo, soCode: step2.soCode, containerInfo: { containerName: '40HQ' } })),
    org: { value: `服务机构${step2.orgId || 1}` },
    originPort: { value: '深圳港' }, targetPort: { value: selectedOrders.value[0]?.countryName || '' },
    originCountry: { value: '中国' }, targetCountry: { value: selectedOrders.value[0]?.countryName || '' },
    ifWareHouseOut: 0, ifLoad: '0', ifOutDeclare: 0, ifEnterDeclare: 0,
    ifOutTrailer: 0, ifEnterTrailer: 0, ifOutCar: 0, ifEnterCar: 0, openTank: 0,
    dispatch: '0', shippingDate: step2.etd, cutoffDate: step2.cutoffDate, transitTime: 10,
    fbastore: { value: '' }, remark: '', orderTime: new Date().toISOString().slice(0, 10)
  }
  if (formView.mode === 'edit') await singleApi.update(formView.id, payload)
  else await singleApi.add(payload)
  ElMessage.success('保存成功')
  backToList()
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; flex-wrap: wrap; gap: $space-sm; justify-content: flex-end; align-items: center; }
.form-head {
  display: flex;
  align-items: center;
  gap: $space-md;
  margin-bottom: $space-lg;
}
.form-section { font-size: 15px; font-weight: 600; margin-bottom: $space-md; }
.wizard-filters { display: flex; gap: $space-sm; margin-bottom: $space-md; }
.wizard-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: $space-md;
  padding-top: $space-md;
  .wizard-tip { color: $text-secondary; font-size: $font-sm; }
}
.wizard-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 50%; }
}
</style>
