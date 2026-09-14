<template>
  <!-- 订单跟踪内嵌视图（源 order-tracking 视图，v-show 切换）：返回 + 状态时间轴 -->
  <div class="order-subview">
    <div class="order-subview__head">
      <span class="order-subview__title">订单跟踪</span>
      <el-button :icon="Back" @click="$emit('back')">返回</el-button>
    </div>
    <el-descriptions :column="3" border>
      <el-descriptions-item label="原单号">{{ row.code }}</el-descriptions-item>
      <el-descriptions-item label="客户名称">{{ (row.custName || {}).name }}</el-descriptions-item>
      <el-descriptions-item label="当前状态">{{ row.orderStatus_name }}</el-descriptions-item>
    </el-descriptions>
    <el-timeline style="margin-top: 20px">
      <el-timeline-item v-for="(t, i) in steps" :key="i" :timestamp="t.time" placement="top">
        <div class="tk-node">{{ t.name }}</div>
        <div v-if="t.describe" class="tk-desc">{{ t.describe }}</div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Back } from '@element-plus/icons-vue'

defineOptions({ name: 'OrderTrackingView' })
defineEmits(['back'])

const row = ref({})
const steps = ref([])
function show(data) {
  row.value = data || {}
  const line = (data.orderStatusLine || {}).status || []
  steps.value = line.map(s => ({ name: s.statusName, time: s.updateAt, describe: s.describe }))
}
defineExpose({ show })
</script>

<style scoped lang="scss">
.order-subview__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.order-subview__title { font-size: $font-lg; font-weight: 600; }
.tk-node { font-weight: 600; }
.tk-desc { color: $text-secondary; font-size: $font-sm; margin-top: 4px; }
</style>
