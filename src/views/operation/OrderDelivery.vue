<template>
  <div>
    <!-- 列表视图 -->
    <template v-if="!formView.show">
      <PageCard>
        <div class="op-toolbar">
          <el-button type="primary" :icon="Plus" @click="openAdd">新增</el-button>
          <div class="op-filters">
            <el-select v-model="query.transport" placeholder="业务类型" filterable style="width: 110px" @change="onSearchType">
              <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-select v-model="query.countryName" placeholder="目的国" clearable filterable :disabled="!query.transport" style="width: 130px">
              <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="c.name" :value="c.name" />
            </el-select>
            <el-select v-model="query.ifOrder" placeholder="是否下单" clearable style="width: 100px">
              <el-option label="是" value="1" />
              <el-option label="否" value="0" />
            </el-select>
            <el-select v-model="query.status" placeholder="状态" clearable style="width: 100px">
              <el-option v-for="s in DELIVERY_STATUS" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
            <el-date-picker v-model="query.orderTime" type="daterange" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="提货起始" end-placeholder="提货截止" style="width: 240px" />
            <el-input v-model="query.code" clearable placeholder="请输入" style="width: 240px">
              <template #prepend>
                <el-select v-model="query.codeType" style="width: 100px">
                  <el-option label="原单号" value="1" />
                  <el-option v-if="query.transport === '1' || query.transport === '2'" label="柜号" value="2" />
                  <el-option v-if="query.transport === '0'" label="提单号" value="3" />
                </el-select>
              </template>
            </el-input>
            <el-button type="primary" @click="handleSearch">查询</el-button>
          </div>
        </div>
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
          <template #col-type="{ row }">{{ bizLabel(row.type) }}</template>
          <template #col-country="{ row }">{{ row.country?.value }}</template>
          <template #col-warehouse="{ row }">{{ row.warehouse?.name }}</template>
          <template #col-car="{ row }">{{ row.car?.value }}</template>
          <template #col-whSupply="{ row }">{{ row.warehouse?.custName }}</template>
          <template #col-supply="{ row }">{{ row.supply?.name }}</template>
          <template #col-volume="{ row }">{{ row.volume }}{{ row.volumeUnit }}</template>
          <template #col-weight="{ row }">{{ row.weight }}{{ row.weightUnit }}</template>
          <template #col-ifOrder="{ row }">{{ row.ifOrder === 1 ? '是' : '否' }}</template>
          <template #col-status="{ row }">{{ statusLabel(row.status) }}</template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" @click="openView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 两步向导视图 -->
    <PageCard v-else>
      <div class="form-head">
        <el-steps :active="activeStep" simple style="flex: 1">
          <el-step title="选择订单" />
          <el-step title="确认订单" />
        </el-steps>
        <el-button link type="primary" @click="backToList">返 回</el-button>
      </div>

      <!-- step1 选择订单 -->
      <div v-show="activeStep === 0">
        <div class="wizard-filters">
          <el-select v-model="step1.transport" placeholder="业务类型" style="width: 110px">
            <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-select v-model="step1.countryName" placeholder="目的国" clearable filterable style="width: 130px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-input v-model="step1.code" clearable placeholder="原单号" style="width: 160px" />
          <el-button type="primary" @click="loadOrders">查询</el-button>
        </div>
        <el-table :data="orderList" border height="360" @selection-change="onSelectOrders">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="code" label="原单号" width="120" />
          <el-table-column prop="customerName" label="客户名称" min-width="130" />
          <el-table-column prop="countryName" label="目的国" width="100" />
          <el-table-column prop="warehouseName" label="提货仓库" min-width="130" />
          <el-table-column prop="packages" label="件数" width="80" />
          <el-table-column prop="containerNo" label="柜号" width="120" />
          <el-table-column prop="goodsStatus" label="货物状态" width="100" />
        </el-table>
        <div class="wizard-actions">
          <span class="wizard-tip">已选 {{ selectedOrders.length }} 个订单</span>
          <el-button type="primary" :disabled="!selectedOrders.length" @click="goStep2">下一步</el-button>
        </div>
      </div>

      <!-- step2 确认订单 -->
      <div v-show="activeStep === 1">
        <el-form :model="step2" label-width="110px" class="wizard-form" :disabled="formView.mode === 'view'">
          <el-form-item label="是否下单">
            <el-radio-group v-model="step2.ifOrder"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="提货仓库">
            <el-input v-model="step2.warehouseName" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="指定供应商" required>
            <el-select v-model="step2.supplierId" filterable clearable placeholder="请选择" style="width: 100%">
              <el-option v-for="s in TRAILER_SUPPLIERS" :key="s.custId" :label="s.custName" :value="s.custId" />
            </el-select>
          </el-form-item>
          <el-form-item label="提货时间">
            <el-date-picker v-model="step2.time" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
          </el-form-item>
          <el-form-item label="车型选择">
            <el-select v-model="step2.carType" placeholder="请选择" style="width: 100%">
              <el-option v-for="c in ['厢式货车', '平板车', '冷藏车']" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="step2.status" placeholder="请选择" style="width: 100%">
              <el-option v-for="s in DELIVERY_STATUS" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="总票数"><el-input v-model="step2.total" readonly /></el-form-item>
          <el-form-item label="总件数"><el-input v-model="step2.count" readonly /></el-form-item>
          <el-form-item label="总重量"><el-input v-model="step2.weight" readonly /></el-form-item>
          <el-form-item label="总体积"><el-input v-model="step2.volume" readonly /></el-form-item>
          <el-form-item label="备注" class="wizard-form__full">
            <el-input v-model="step2.remark" type="textarea" :rows="2" placeholder="请输入" />
          </el-form-item>
        </el-form>
        <div class="wizard-actions">
          <el-button @click="activeStep = 0">上一步</el-button>
          <el-button v-if="formView.mode !== 'view'" type="primary" @click="handleSave">保存</el-button>
        </div>
      </div>
    </PageCard>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery } from '@/utils/hooks'
import {
  deliveryApi, getDeliveryOrders,
  SHIP_BIZ_TYPES, DELIVERY_STATUS, TRAILER_SUPPLIERS, COUNTRY_OPTIONS
} from '@/api/modules/operation'

defineOptions({ name: 'OpDelivery' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(deliveryApi.list, {
  transport: '0', countryName: '', ifOrder: '', status: '', orderTime: [], code: '', codeType: '1'
})

const columns = [
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'country', label: '目的国', minWidth: 150 },
  { prop: 'warehouse', label: '提货仓库', minWidth: 150 },
  { prop: 'car', label: '车型', width: 150 },
  { prop: 'whSupply', label: '仓库供应商', width: 160 },
  { prop: 'supply', label: '卡车供应商', width: 160 },
  { prop: 'total', label: '总票数', width: 100 },
  { prop: 'count', label: '总件数', width: 100 },
  { prop: 'volume', label: '总体积', minWidth: 120 },
  { prop: 'weight', label: '总重量', minWidth: 120 },
  { prop: 'time', label: '提货时间', width: 180 },
  { prop: 'ifOrder', label: '是否下单', minWidth: 120 },
  { prop: 'status', label: '状态', minWidth: 120 },
  { prop: 'remark', label: '备注', width: 200 }
]
const bizLabel = v => SHIP_BIZ_TYPES.find(t => t.id === v)?.name || ''
const statusLabel = v => DELIVERY_STATUS.find(s => s.id === v)?.name || ''
const onSearchType = () => { query.countryName = ''; query.codeType = '1' }

// ===== 两步向导 =====
const formView = reactive({ show: false, mode: 'add', id: null })
const activeStep = ref(0)
const step1 = reactive({ transport: '0', countryName: '', code: '' })
const orderList = ref([])
const selectedOrders = ref([])
const step2 = reactive({ ifOrder: 1, warehouseName: '', supplierId: '', time: '', carType: '', status: '0', total: 0, count: 0, weight: 0, volume: 0, remark: '' })

const resetWizard = () => {
  activeStep.value = 0
  Object.assign(step1, { transport: '0', countryName: '', code: '' })
  orderList.value = []
  selectedOrders.value = []
  Object.assign(step2, { ifOrder: 1, warehouseName: '', supplierId: '', time: '', carType: '', status: '0', total: 0, count: 0, weight: 0, volume: 0, remark: '' })
}
const openAdd = () => { resetWizard(); Object.assign(formView, { show: true, mode: 'add', id: null }); loadOrders() }
const openView = row => { fillFromRow(row, 'view'); }
const openEdit = row => { fillFromRow(row, 'edit'); }
const fillFromRow = (row, mode) => {
  resetWizard()
  activeStep.value = 1
  Object.assign(step2, {
    ifOrder: row.ifOrder, warehouseName: row.warehouse?.name, supplierId: '', time: row.time,
    carType: row.car?.value, status: row.status, total: row.total, count: row.count, weight: row.weight, volume: row.volume, remark: row.remark
  })
  Object.assign(formView, { show: true, mode, id: row.id })
}
const backToList = () => { formView.show = false; loadData() }

const loadOrders = async () => {
  const res = await getDeliveryOrders({ code: step1.code })
  orderList.value = res.data.list
}
const onSelectOrders = rows => { selectedOrders.value = rows }
const goStep2 = () => {
  // 汇总已选订单到确认步
  step2.total = selectedOrders.value.length
  step2.count = selectedOrders.value.reduce((a, o) => a + o.packages, 0)
  step2.weight = selectedOrders.value.reduce((a, o) => a + o.weight, 0)
  step2.volume = selectedOrders.value.reduce((a, o) => a + o.volume, 0)
  step2.warehouseName = selectedOrders.value[0]?.warehouseName || ''
  activeStep.value = 1
}

const handleSave = async () => {
  if (!step2.supplierId) return ElMessage.error('请选择供应商')
  const supplier = TRAILER_SUPPLIERS.find(s => s.custId === step2.supplierId)
  const country = selectedOrders.value[0]?.countryName || step1.countryName
  const payload = {
    type: step1.transport,
    country: { value: country },
    warehouse: { name: step2.warehouseName, custName: '仓库供应商01' },
    car: { value: step2.carType },
    supply: { name: supplier?.custName || '' },
    total: step2.total, count: step2.count, volume: step2.volume, volumeUnit: 'CBM', weight: step2.weight, weightUnit: 'KG',
    time: step2.time, ifOrder: step2.ifOrder, status: step2.status, remark: step2.remark, orderTime: step2.time
  }
  if (formView.mode === 'edit') await deliveryApi.update(formView.id, payload)
  else await deliveryApi.add(payload)
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
.op-filters { display: flex; flex-wrap: wrap; gap: $space-sm; justify-content: flex-end; }
.form-head {
  display: flex;
  align-items: center;
  gap: $space-md;
  margin-bottom: $space-lg;
}
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
  &__full { width: 100% !important; }
}
</style>
