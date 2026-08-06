<template>
  <div class="wc-sub">
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
      <template #col-listType="{ row }">{{ (row.list || []).map(t => t.name).join(',') || '--' }}</template>
      <template #col-settlement="{ row }">{{ SETTLEMENT_LIST[row.settlement] }}</template>
      <template #actions="{ row }">
        <span class="dot" :style="{ background: row.transConfiged ? '#4cd964' : '#ff3b30' }" />
        <el-button link type="primary" size="small" :disabled="!can('config')" @click="editRow(row)">设置</el-button>
      </template>
    </ProTable>

    <Modal v-model="dlg.visible" :title="dlg.title" :width="dlg.width" :confirm-loading="dlg.loading" @confirm="save">
      <el-form :model="dlg" label-width="100px">
        <el-form-item label="是否启用" class="is-required">
          <el-radio-group v-model="dlg.status">
            <el-radio value="0">否</el-radio>
            <el-radio value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 单位单价/区间 类结算（isType='one'） -->
        <template v-if="dlg.status === '1' && dlg.isType === 'one'">
          <el-form-item label="计费方式" class="is-required">
            <el-select v-model="dlg.type" placeholder="请选择" style="width: 100%">
              <el-option label="单位单价" :value="1" />
              <el-option label="区间" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="dlg.type === 2" label="区间范围" class="is-required">
            <div class="range-tip">(取值范围：&gt;=起始值， &lt;结束值)</div>
            <div v-for="(sec, i) in dlg.sections" :key="i" class="range-row">
              <el-input-number v-model="sec.lower" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="输入下限" />
              <span class="range-sep">~</span>
              <el-input-number v-model="sec.upper" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="输入上限" />
              <el-icon class="range-op" @click="addSection"><Plus /></el-icon>
              <el-icon v-if="dlg.sections.length > 1" class="range-op" @click="dlg.sections.splice(i, 1)"><Minus /></el-icon>
            </div>
          </el-form-item>
        </template>

        <!-- 车型/柜型 类结算（isType='three'）：穿梭选择 -->
        <template v-if="dlg.status === '1' && dlg.isType === 'three'">
          <el-transfer v-model="dlg.options" :data="dlg.transData" :titles="[`选择${dlg.threeTitle}`, '已选择']" filterable />
        </template>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus, Minus } from '@element-plus/icons-vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { wcCostItemApi, SETTLEMENT_LIST } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const { query, list, total, loading, loadData } = useListQuery(
  p => wcCostItemApi.list({ ...p, warehouseId: props.wsId }), {}
)

const columns = [
  { prop: 'name', label: '项目中文名称', minWidth: 120 },
  { prop: 'alias', label: '项目英文名称', minWidth: 120 },
  { prop: 'serviceTypeName', label: '服务类型', width: 120 },
  { prop: 'listType', label: '项目类型', width: 120 },
  { prop: 'settlement', label: '结算单位', width: 120 },
  { prop: 'invoice', label: '发票描述', minWidth: 120 },
  { prop: 'remark', label: '备注', minWidth: 100 }
]

// 车型/柜型 结算的穿梭候选项
const VEHICLE_TYPES = ['厢式货车', '平板车', '冷藏车', '高栏车'].map((n, i) => ({ key: i + 1, label: n }))
const CONTAINER_TYPES = ['20GP', '40GP', '40HQ', '45HQ'].map((n, i) => ({ key: i + 1, label: n }))

const dlg = reactive({ visible: false, title: '', width: '600px', loading: false, id: null, status: '0', type: 1, isType: 'one', threeTitle: '', sections: [{ lower: undefined, upper: undefined }], options: [], transData: [] })

// 设置：按结算单位分支（'5'车型/'6'柜型→穿梭 three；其余→单价/区间 one）
const editRow = row => {
  dlg.id = row.id
  dlg.status = row.status || '0'
  dlg.type = row.type || 1
  dlg.sections = row.sections?.length ? JSON.parse(JSON.stringify(row.sections)) : [{ lower: undefined, upper: undefined }]
  dlg.options = [...(row.options || [])]
  if (row.settlement === '5') {
    dlg.isType = 'three'; dlg.threeTitle = '车型'; dlg.width = '960px'; dlg.transData = VEHICLE_TYPES; dlg.title = `${SETTLEMENT_LIST[row.settlement]}配置`
  } else if (row.settlement === '6') {
    dlg.isType = 'three'; dlg.threeTitle = '柜型'; dlg.width = '960px'; dlg.transData = CONTAINER_TYPES; dlg.title = `${SETTLEMENT_LIST[row.settlement]}配置`
  } else {
    dlg.isType = 'one'; dlg.width = '600px'; dlg.title = `${SETTLEMENT_LIST[row.settlement]}配置`
  }
  dlg.visible = true
}
const addSection = () => dlg.sections.push({ lower: undefined, upper: undefined })

const save = async () => {
  dlg.loading = true
  try {
    const patch = { status: dlg.status, transConfiged: dlg.status === '1' }
    if (dlg.isType === 'one') { patch.type = dlg.type; patch.sections = dlg.type === 2 ? dlg.sections : [] }
    else patch.options = [...dlg.options]
    await wcCostItemApi.update(dlg.id, patch)
    ElMessage.success('保存成功')
    dlg.visible = false
    loadData()
  } finally {
    dlg.loading = false
  }
}
</script>

<style scoped lang="scss">
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
.range-tip { color: $text-secondary; font-size: $font-sm; margin-bottom: 6px; }
.range-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.range-sep { color: $text-secondary; }
.range-op { cursor: pointer; color: $primary-color; font-size: 18px; }
</style>
