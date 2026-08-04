<template>
  <div>
    <!-- 列表视图 -->
    <template v-if="!formView.show">
      <PageCard>
        <div class="op-toolbar">
          <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
          <div class="op-filters">
            <el-select v-model="query.type" placeholder="业务类型" filterable clearable style="width: 130px">
              <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-date-picker
              v-model="query.orderTime"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="~"
              start-placeholder="下单起始时间"
              end-placeholder="下单截止时间"
              style="width: 240px"
            />
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
          <template #col-transType="{ row }">{{ transLabel(row.transType) }}</template>
          <template #col-bscName="{ row }">{{ row.bsc?.name }}</template>
          <template #col-count="{ row }">{{ (row.containers || []).length }}</template>
          <template #col-transport="{ row }">{{ transportLabel(row) }}</template>
          <template #col-org="{ row }">{{ row.org?.value }}</template>
          <template #col-serviceCode="{ row }">{{ row.bsc?.serviceCode }}</template>
          <template #col-originPort="{ row }">{{ row.originPort?.value }}</template>
          <template #col-targetPort="{ row }">{{ row.targetPort?.value }}</template>
          <template #col-originCountry="{ row }">{{ row.originCountry?.value }}</template>
          <template #col-targetCountry="{ row }">{{ row.targetCountry?.value }}</template>
          <template #col-dispatch="{ row }">{{ dispatchLabel(row.dispatch) }}</template>
          <template #col-fbastore="{ row }">{{ row.fbastore?.value }}</template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 表单/详情视图（多视图切换，非路由） -->
    <PageCard v-else>
      <div class="form-head">
        <h3>整柜发货</h3>
        <el-button link type="primary" @click="backToList">返 回</el-button>
      </div>

      <!-- 原单号查询 -->
      <div class="form-line">
        <el-input v-model="keyCode" :disabled="formView.mode !== 'add'" placeholder="原单号" style="width: 200px" />
        <el-button type="primary" :disabled="formView.mode !== 'add'" @click="onSearchOrder">查询</el-button>
      </div>

      <!-- 订单信息（只读） -->
      <div class="form-section">订单信息</div>
      <div class="form-grid">
        <span>服务：{{ orderForm.name }}</span>
        <span>目的港：{{ orderForm.destinationName }}</span>
        <span>报关方式：{{ orderForm.customs0 === '0' ? '普通报关' : orderForm.customs0 === '1' ? '出口退税' : '' }}</span>
        <span>关税：{{ orderForm.taxes }}</span>
        <span>派送方式：{{ dispatchLabel(orderForm.deliveryWay) }}</span>
        <span>柜型/板/车型：{{ orderForm.containerName }}</span>
        <span>装柜地址：{{ orderForm.pickAddressName }}</span>
        <span>总件数：{{ orderForm.packages }}</span>
        <span>总体积：{{ orderForm.volumes }} {{ orderForm.umVolume }}</span>
        <span>总重量：{{ orderForm.weights }} {{ orderForm.umWeight }}</span>
        <span>总货值：{{ orderForm.value }} {{ orderForm.currencyId }}</span>
        <span>联系人：{{ orderForm.pickContact }}</span>
        <span>联系电话：{{ orderForm.pickTel }}</span>
      </div>

      <!-- 发货计划 -->
      <div class="form-line">
        <el-select v-model="planId" :disabled="!orderForm.type || formView.mode !== 'add'" filterable clearable placeholder="发货计划" style="width: 200px" @change="onPlanChange">
          <el-option v-for="p in SHIP_PLANS" :key="p.id" :label="p.bscName" :value="p.id" />
        </el-select>
      </div>
      <div v-if="planForm" class="form-grid">
        <span>业务类型：{{ bizLabel(planForm.type) }}</span>
        <span>服务类型：{{ transLabel(planForm.transType) }}</span>
        <span>订舱服务：{{ planForm.bscName }}</span>
        <span>柜型/板/车型：{{ planForm.containerName }}</span>
        <span>服务机构：{{ planForm.serviceName }}</span>
        <span>服务编码：{{ planForm.serviceCode }}</span>
        <span>目的仓代码：{{ planForm.fbastore?.value }}</span>
        <span>起运港：{{ planForm.originPort?.value }}</span>
        <span>目的港：{{ planForm.targetPort?.value }}</span>
        <span>起运国：{{ planForm.originCountry?.value }}</span>
        <span>目的国：{{ planForm.targetCountry?.value }}</span>
        <span>派件方式：{{ dispatchLabel(planForm.dispatch) }}</span>
        <span>起运日期：{{ planForm.shippingDate }}</span>
        <span>截单日期：{{ planForm.cutoffDate }}</span>
        <span>运输时间：{{ planForm.transitTime }}天</span>
      </div>

      <!-- 拖车供应商 -->
      <div class="form-line">
        <el-select v-model="custId" :disabled="formView.mode === 'view'" clearable filterable placeholder="拖车供应商" style="width: 200px">
          <el-option v-for="s in TRAILER_SUPPLIERS" :key="s.custId" :label="s.custName" :value="s.custId" />
        </el-select>
      </div>

      <div v-if="formView.mode !== 'view'" class="form-actions">
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </PageCard>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import {
  cshipApi, getShipByCode,
  SHIP_BIZ_TYPES, SHIP_TRANS_TYPES, SHIP_DISPATCH, SHIP_PLANS, TRAILER_SUPPLIERS
} from '@/api/modules/operation'

defineOptions({ name: 'OpCship' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(cshipApi.list, { type: '', orderTime: [] })

const columns = [
  { prop: 'type', label: '业务类型', width: 120 },
  { prop: 'transType', label: '服务类型', width: 120 },
  { prop: 'bscName', label: '订舱服务', width: 150 },
  { prop: 'count', label: '数量', width: 120 },
  { prop: 'transport', label: '运输类型', width: 150 },
  { prop: 'org', label: '服务机构', width: 150 },
  { prop: 'serviceCode', label: '服务编码', width: 150 },
  { prop: 'originPort', label: '起运港', minWidth: 150 },
  { prop: 'targetPort', label: '目的港', minWidth: 150 },
  { prop: 'originCountry', label: '起运国', minWidth: 150 },
  { prop: 'targetCountry', label: '目的国', minWidth: 150 },
  { prop: 'dispatch', label: '派送方式', width: 120 },
  { prop: 'shippingDate', label: '起运日期', width: 180 },
  { prop: 'cutoffDate', label: '截单日期', width: 180 },
  { prop: 'transitTime', label: '运输时间', width: 120 },
  { prop: 'fbastore', label: '目的仓代码', minWidth: 150 }
]
const bizLabel = v => SHIP_BIZ_TYPES.find(t => t.id === v)?.name || ''
const transLabel = v => SHIP_TRANS_TYPES.find(t => t.id === v)?.name || ''
const dispatchLabel = v => SHIP_DISPATCH.find(t => t.id === v)?.name || ''
const transportLabel = row => {
  const prefix = { 0: '航空版', 1: '柜型', 2: '柜型', 3: '车型' }[row.type] || ''
  const name = row.containers?.[0]?.containerInfo?.containerName || ''
  return `${prefix} ${name}`.trim()
}

// ===== 多视图切换 =====
const formView = reactive({ show: false, mode: 'add', id: null }) // add|edit|view
const keyCode = ref('')
const orderForm = reactive({})
const planId = ref('')
const planForm = ref(null)
const custId = ref('')

const resetForm = () => {
  keyCode.value = ''
  Object.keys(orderForm).forEach(k => delete orderForm[k])
  planId.value = ''
  planForm.value = null
  custId.value = ''
}
const openAdd = () => {
  resetForm()
  Object.assign(formView, { show: true, mode: 'add', id: null })
}
const fillFromRow = row => {
  keyCode.value = row.keyCode
  Object.assign(orderForm, {
    name: row.bsc?.name, destinationName: row.targetPort?.value,
    containerName: row.containers?.[0]?.containerInfo?.containerName, type: row.type, deliveryWay: row.dispatch
  })
  const plan = SHIP_PLANS.find(p => p.type === row.type) || SHIP_PLANS[0]
  planId.value = plan.id
  planForm.value = plan
  custId.value = row.custId || ''
}
const openView = row => { resetForm(); fillFromRow(row); Object.assign(formView, { show: true, mode: 'view', id: row.id }) }
const openEdit = row => { resetForm(); fillFromRow(row); Object.assign(formView, { show: true, mode: 'edit', id: row.id }) }
const backToList = () => { formView.show = false; loadData() }

const onSearchOrder = async () => {
  if (!keyCode.value) return ElMessage.warning('请输入原单号')
  const res = await getShipByCode(keyCode.value)
  Object.assign(orderForm, res.data)
  ElMessage.success('查询成功')
}
const onPlanChange = id => { planForm.value = SHIP_PLANS.find(p => p.id === id) || null }

const handleSave = async () => {
  if (!orderForm.type) return ElMessage.error('请选择原单号')
  if (!planId.value) return ElMessage.error('请选择发货计划')
  if (!custId.value) return ElMessage.error('请选择拖车供应商')
  const plan = planForm.value
  const payload = {
    keyCode: keyCode.value, type: plan.type, transType: plan.transType,
    bsc: { name: plan.bscName, serviceCode: plan.serviceCode },
    containers: [{ containerInfo: { containerName: plan.containerName } }],
    org: { value: plan.serviceName },
    originPort: plan.originPort, targetPort: plan.targetPort, originCountry: plan.originCountry, targetCountry: plan.targetCountry,
    dispatch: plan.dispatch, shippingDate: plan.shippingDate, cutoffDate: plan.cutoffDate, transitTime: plan.transitTime,
    fbastore: plan.fbastore, orderTime: plan.shippingDate, custId: custId.value
  }
  if (formView.mode === 'edit') await cshipApi.update(formView.id, payload)
  else await cshipApi.add(payload)
  ElMessage.success('保存成功')
  backToList()
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $space-md;
  h3 { margin: 0; }
}
.form-line { margin: $space-md 0; display: flex; gap: $space-sm; }
.form-section { font-size: 15px; font-weight: 600; margin-top: $space-md; }
.form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-sm $space-lg;
  padding: $space-sm 0;
  color: $text-secondary;
  font-size: $font-sm;
  span { min-width: 200px; }
}
.form-actions { text-align: right; padding-top: $space-md; }
</style>
