<template>
  <!--
    二维价格矩阵（el-table 降级 vxe-table）：
    Y 轴 = 地址行（data 每行 address.value），X 轴 = 动态列（columns 每项 label）。
    可编辑单元格 row.prices[index].price；参考价行 isUpper 高亮只读（success-row）。
    源含拖拽排序列（Sortablejs），降级省略——行序由数据决定。
  -->
  <el-table
    v-if="columns.length"
    ref="matrixRef"
    :data="data"
    border
    size="small"
    :height="height"
    style="width: 100%"
    :row-class-name="rowClassName"
  >
    <el-table-column :width="200" show-overflow-tooltip>
      <template #header>
        <span class="header-row">{{ leftTitle }}</span>
        <span>&nbsp;&nbsp;\&nbsp;&nbsp;</span>
        <span class="header-column">{{ rightTitle }}</span>
      </template>
      <template #default="{ row }">{{ (row.address || {}).value }}</template>
    </el-table-column>

    <el-table-column v-if="showRegional" label="区域详情" prop="regionalDetails" :width="200" show-overflow-tooltip />

    <el-table-column v-for="(item, index) in columns" :key="index" :label="item.label" show-overflow-tooltip>
      <template #default="{ row }">
        <el-input-number
          v-if="editable && !row.isUpper"
          v-model="row.prices[index].price"
          class="matrix-input"
          size="small"
          :controls="false"
          placeholder="请输入"
          :min="0"
          :max="999999"
          :precision="2"
        />
        <span v-else>{{ (row.prices[index] || {}).price }}</span>
      </template>
    </el-table-column>

    <el-table-column v-if="showPrescription" label="参考时效(天)" min-width="100" show-overflow-tooltip>
      <template #default="{ row }">
        <el-input
          v-if="editPrescription"
          v-model="row.prescription"
          placeholder="请填写例:1-2或1至2或1到2"
          size="small"
        />
        <span v-else>{{ row.prescription }}</span>
      </template>
    </el-table-column>

    <el-table-column label="备注" min-width="120" show-overflow-tooltip>
      <template #default="{ row }">
        <el-input
          v-if="editRemark && !row.isUpper"
          v-model="row.remark"
          placeholder="请输入"
          :maxlength="100"
          size="small"
        />
        <span v-else>{{ row.remark }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
defineOptions({ name: 'PriceMatrix' })

const props = defineProps({
  // Y 轴表头（地址类型）/ X 轴表头（区间/柜型等）
  leftTitle: { type: String, default: '' },
  rightTitle: { type: String, default: '' },
  // X 轴动态列 [{ label }]
  columns: { type: Array, default: () => [] },
  // 行数据 [{ address:{value}, addressType, prices:[{price,x}], prescription, remark, isUpper, regionalDetails }]
  data: { type: Array, default: () => [] },
  // 报价单元格可编辑（isEdit || isAdd）
  editable: { type: Boolean, default: false },
  // 备注可编辑（isEdit || isAdd || editOther）
  editRemark: { type: Boolean, default: false },
  // 参考时效可编辑（editRemark && custType==='2' && custSubtype==='1'）
  editPrescription: { type: Boolean, default: false },
  // 区域详情列（isShowRegionalDetailCol）
  showRegional: { type: Boolean, default: false },
  // 参考时效列（专线/订舱有，卡派/拖车/报关无）
  showPrescription: { type: Boolean, default: true },
  height: { type: [String, Number], default: 540 }
})

const rowClassName = ({ row }) => (row.isUpper ? 'success-row' : '')
</script>

<style scoped lang="scss">
.matrix-input { width: 100%; }
.header-row { color: $text-primary; }
.header-column { color: $primary-color; }
:deep(.success-row) { background: $bg-hover; }
</style>