<template>
  <div>
    <!-- 列表视图 -->
    <template v-if="!formView.show">
      <PageCard>
        <div class="op-toolbar">
          <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
          <div class="op-filters">
            <el-select v-model="query.subtypeId" placeholder="业务类型" clearable filterable style="width: 120px">
              <el-option v-for="t in SHIP_BIZ_TYPES" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
            <el-select v-model="query.supplierName" placeholder="供应商" clearable filterable style="width: 130px">
              <el-option v-for="s in OUTSOURC_SUPPLIERS" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
            <el-select v-model="query.ifWareHouseOut" placeholder="是否安排出库" clearable style="width: 130px">
              <el-option label="是" value="1" />
              <el-option label="否" value="0" />
            </el-select>
            <el-input v-model="query.code" clearable placeholder="原单号" style="width: 150px" />
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
          :action-width="180"
          @change="loadData"
        >
          <template #col-type="{ row }">{{ bizLabel(row.type) }}</template>
          <template #col-totalVolume="{ row }">{{ row.totalVolume }}CBM</template>
          <template #col-totalWeight="{ row }">{{ row.totalWeight }}KGS</template>
          <template #col-ifWareHouseOut="{ row }">{{ row.ifWareHouseOut === 1 ? '是' : '否' }}</template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="cmd => onCommand(cmd, row)">
              <el-button link type="primary" size="small" :disabled="!can('edit')">更多<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="express">补充快递</el-dropdown-item>
                  <el-dropdown-item command="metering">补充计量</el-dropdown-item>
                  <el-dropdown-item command="arrange">安排出库</el-dropdown-item>
                  <el-dropdown-item command="export">导出箱单发票</el-dropdown-item>
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
          <el-input v-model="step1.code" clearable placeholder="原单号" style="width: 160px" />
          <el-button type="primary" @click="loadOrders">查询</el-button>
        </div>
        <el-table :data="orderList" border height="360" @selection-change="onSelectOrders">
          <el-table-column type="selection" width="50" />
          <el-table-column prop="code" label="原单号" width="120" />
          <el-table-column prop="customerName" label="客户名称" min-width="130" />
          <el-table-column prop="countryName" label="目的城市" width="100" />
          <el-table-column prop="warehouseName" label="下单仓库" min-width="130" />
          <el-table-column prop="volume" label="总体积" width="90" />
          <el-table-column prop="weight" label="总重量" width="90" />
          <el-table-column prop="packages" label="件数" width="80" />
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
          <el-form-item label="供应商" required>
            <el-select v-model="step2.supplierId" filterable clearable placeholder="请选择" style="width: 100%">
              <el-option v-for="s in OUTSOURC_SUPPLIERS" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="装货仓库"><el-input v-model="step2.warehouseName" placeholder="请输入" /></el-form-item>
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

    <!-- 补充信息弹窗（快递单/计量数据 两 tab） -->
    <el-dialog v-model="supDialog.visible" title="补充信息" width="900px" :close-on-click-modal="false" @closed="loadData">
      <el-tabs v-model="supDialog.tab">
        <el-tab-pane label="快递单数据" name="express">
          <el-button type="primary" link :icon="Plus" @click="addExpress">新增</el-button>
          <el-table :data="expressRows" border height="360" style="margin-top: 10px">
            <el-table-column prop="code" label="原单号" width="120" />
            <el-table-column label="箱号"><template #default="s"><el-input v-model="s.row.pkgNo" size="small" /></template></el-table-column>
            <el-table-column label="主单号"><template #default="s"><el-input v-model="s.row.identificationNo" size="small" /></template></el-table-column>
            <el-table-column label="子单号"><template #default="s"><el-input v-model="s.row.trackingNo" size="small" /></template></el-table-column>
            <el-table-column label="操作" width="80"><template #default="s"><el-button link type="danger" size="small" @click="expressRows.splice(s.$index, 1)">删除</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="计量数据" name="metering">
          <el-button type="primary" link :icon="Plus" @click="addMetering">新增</el-button>
          <el-table :data="meteringRows" border height="360" style="margin-top: 10px">
            <el-table-column prop="code" label="原单号" width="120" />
            <el-table-column label="箱号"><template #default="s"><el-input v-model="s.row.box" size="small" /></template></el-table-column>
            <el-table-column label="长"><template #default="s"><el-input v-model="s.row.length" size="small" /></template></el-table-column>
            <el-table-column label="宽"><template #default="s"><el-input v-model="s.row.wigth" size="small" /></template></el-table-column>
            <el-table-column label="高"><template #default="s"><el-input v-model="s.row.height" size="small" /></template></el-table-column>
            <el-table-column label="重量"><template #default="s"><el-input v-model="s.row.weight" size="small" /></template></el-table-column>
            <el-table-column label="操作" width="80"><template #default="s"><el-button link type="danger" size="small" @click="meteringRows.splice(s.$index, 1)">删除</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="supDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="saveSupplement">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmThen, demoAction } from '@/utils'
import {
  outsourcApi, getDeliveryOrders,
  SHIP_BIZ_TYPES, OUTSOURC_SUPPLIERS
} from '@/api/modules/operation'

defineOptions({ name: 'OpOutsourc' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(outsourcApi.list, {
  subtypeId: '', supplierName: '', ifWareHouseOut: '', code: ''
})

const columns = [
  { prop: 'type', label: '业务类型', width: 100 },
  { prop: 'serviceName', label: '服务', minWidth: 200 },
  { prop: 'supplierName', label: '供应商', width: 160 },
  { prop: 'warehouseName', label: '仓库', width: 160 },
  { prop: 'subtypeName', label: '柜号/提单号', width: 150 },
  { prop: 'totalPackages', label: '总票数', width: 100 },
  { prop: 'totalVolume', label: '总体积', width: 120 },
  { prop: 'totalWeight', label: '总重量', width: 120 },
  { prop: 'ifWareHouseOut', label: '安排出库', width: 100 }
]
const bizLabel = v => SHIP_BIZ_TYPES.find(t => t.id === v)?.name || ''

// ===== 更多操作 =====
const onCommand = (cmd, row) => {
  if (cmd === 'express' || cmd === 'metering') return openSupplement(row, cmd)
  if (cmd === 'arrange') {
    return confirmThen(`确认对「${row.subtypeName}」安排出库？`, async () => {
      await outsourcApi.update(row.id, { ifWareHouseOut: 1 }); loadData()
    }, { title: '安排出库', success: '已安排出库' })
  }
  demoAction('导出箱单发票')
}

// ===== 两步向导 =====
const formView = reactive({ show: false, mode: 'add', id: null })
const activeStep = ref(0)
const step1 = reactive({ transport: '0', code: '' })
const orderList = ref([])
const selectedOrders = ref([])
const step2 = reactive({ supplierId: '', warehouseName: '', total: 0, count: 0, weight: 0, volume: 0, remark: '' })

const resetWizard = () => {
  activeStep.value = 0
  Object.assign(step1, { transport: '0', code: '' })
  orderList.value = []
  selectedOrders.value = []
  Object.assign(step2, { supplierId: '', warehouseName: '', total: 0, count: 0, weight: 0, volume: 0, remark: '' })
}
const openAdd = () => { resetWizard(); Object.assign(formView, { show: true, mode: 'add', id: null }); loadOrders() }
const fillFromRow = (row, mode) => {
  resetWizard()
  activeStep.value = 1
  const supplier = OUTSOURC_SUPPLIERS.find(s => s.name === row.supplierName)
  Object.assign(step2, {
    supplierId: supplier?.id || '', warehouseName: row.warehouseName,
    total: row.totalPackages, count: row.totalPackages, weight: row.totalWeight, volume: row.totalVolume, remark: ''
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
  step2.warehouseName = selectedOrders.value[0]?.warehouseName || ''
  activeStep.value = 1
}
const handleSave = async () => {
  if (!step2.supplierId) return ElMessage.error('请选择供应商')
  const supplier = OUTSOURC_SUPPLIERS.find(s => s.id === step2.supplierId)
  const payload = {
    type: step1.transport,
    serviceName: '外协专线',
    supplierName: supplier?.name || '',
    warehouseName: step2.warehouseName,
    subtypeName: selectedOrders.value[0]?.containerNo || '',
    totalPackages: step2.total, totalVolume: step2.volume, totalWeight: step2.weight,
    ifWareHouseOut: 0, orderTime: new Date().toISOString().slice(0, 10)
  }
  if (formView.mode === 'edit') await outsourcApi.update(formView.id, payload)
  else await outsourcApi.add(payload)
  ElMessage.success('保存成功')
  backToList()
}

// ===== 补充信息（快递单/计量）=====
const supDialog = reactive({ visible: false, tab: 'express', id: null })
const expressRows = ref([])
const meteringRows = ref([])
const openSupplement = (row, tab) => {
  supDialog.id = row.id
  supDialog.tab = tab
  expressRows.value = (row.expressItems || []).map(x => ({ ...x }))
  meteringRows.value = (row.meteringItems || []).map(x => ({ ...x }))
  supDialog.visible = true
}
const addExpress = () => expressRows.value.push({ code: `YD${String(100000 + expressRows.value.length * 7).slice(0, 6)}`, pkgNo: '', identificationNo: '', trackingNo: '' })
const addMetering = () => meteringRows.value.push({ code: `YD${String(100000 + meteringRows.value.length * 7).slice(0, 6)}`, box: '', length: '', wigth: '', height: '', weight: '' })
const saveSupplement = async () => {
  await outsourcApi.update(supDialog.id, { expressItems: [...expressRows.value], meteringItems: [...meteringRows.value] })
  ElMessage.success('操作成功')
  supDialog.visible = false
  loadData()
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
