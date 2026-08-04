<template>
  <div class="pro-table">
    <!-- 批量操作栏 -->
    <div v-if="selectable && $slots.batch" class="pro-table__batch">
      <span class="pro-table__selected">已选 {{ selection.length }} 项</span>
      <slot name="batch" :selection="selection" />
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      border
      stripe
      style="width: 100%"
      @selection-change="onSelectionChange"
    >
      <el-table-column v-if="selectable" type="selection" width="50" :reserve-selection="true" />
      <el-table-column v-if="showIndex" type="index" label="序号" width="70" align="center" />

      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :fixed="col.fixed"
        :align="col.align || 'left'"
        :show-overflow-tooltip="col.tooltip !== false"
      >
        <template #default="scope">
          <!-- 具名插槽优先：<template #col-status="{ row }"> -->
          <slot v-if="$slots[`col-${col.prop}`]" :name="`col-${col.prop}`" :row="scope.row" :index="scope.$index" />
          <span v-else-if="col.formatter">{{ col.formatter(scope.row[col.prop], scope.row) }}</span>
          <span v-else>{{ scope.row[col.prop] ?? '-' }}</span>
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column v-if="$slots.actions" label="操作" :width="actionWidth" fixed="right">
        <template #default="scope">
          <div class="table-actions">
            <slot name="actions" :row="scope.row" :index="scope.$index" />
          </div>
        </template>
      </el-table-column>

      <template #empty>
        <Empty />
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-wrap">
      <el-pagination
        :current-page="page"
        :page-size="size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onActivated } from 'vue'
import Empty from '@/components/Common/Empty.vue'

// 通用表格：配置化列 + 内置分页 + 批量选择 + loading，所有列表页统一复用
const props = defineProps({
  data: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
  rowKey: { type: String, default: 'id' },
  selectable: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: false },
  actionWidth: { type: [String, Number], default: 180 }
})

const emit = defineEmits(['update:page', 'update:size', 'change', 'selection-change'])

const tableRef = ref(null)
const selection = ref([])

// 数据变化后重新计算列宽：避免表格在容器宽度未就绪时(异步数据/keep-alive/过渡)列宽塌缩为 0
watch(() => props.data, () => {
  nextTick(() => tableRef.value?.doLayout?.())
})
onActivated(() => {
  nextTick(() => tableRef.value?.doLayout?.())
})

const onSelectionChange = rows => {
  selection.value = rows
  emit('selection-change', rows)
}

const onPageChange = p => {
  emit('update:page', p)
  emit('change')
}
const onSizeChange = s => {
  emit('update:size', s)
  emit('update:page', 1)
  emit('change')
}

// 供页面在批量操作后清空选择
const clearSelection = () => tableRef.value?.clearSelection()
defineExpose({ clearSelection })
</script>

<style scoped lang="scss">
.pro-table__batch {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-sm $space-md;
  margin-bottom: $space-md;
  background: $bg-hover;
  border-radius: $radius-base;
  .pro-table__selected { color: $text-secondary; font-size: $font-base; }
}
</style>
