<template>
  <!-- 快递详情内嵌视图（源 express 视图，v-show 切换）：返回 + 快递公司信息 + 快递单号列表 -->
  <div class="order-subview">
    <div class="order-subview__head">
      <span class="order-subview__title">快递详情</span>
      <el-button :icon="Back" @click="$emit('back')">返回</el-button>
    </div>
    <el-descriptions :column="3" border>
      <el-descriptions-item label="原单号">{{ row.code }}</el-descriptions-item>
      <el-descriptions-item label="客户名称">{{ (row.custName || {}).name }}</el-descriptions-item>
      <el-descriptions-item label="快递公司">{{ (row.express || {}).expressName || '--' }}</el-descriptions-item>
    </el-descriptions>
    <el-table :data="trackingRows" border size="small" style="margin-top: 16px">
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column label="快递单号" prop="no" />
      <el-table-column label="状态" prop="status" width="120" />
      <el-table-column label="更新时间" prop="time" width="180" />
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Back } from '@element-plus/icons-vue'

defineOptions({ name: 'OrderExpressView' })
defineEmits(['back'])

const row = ref({})
const trackingRows = ref([])
function show(data) {
  row.value = data || {}
  const nos = (data.express || {}).trackingNos || []
  trackingRows.value = nos.map((no, i) => ({ no, status: '运输中', time: data.orderStatus_updateAt || '' }))
}
defineExpose({ show })
</script>

<style scoped lang="scss">
.order-subview__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.order-subview__title { font-size: $font-lg; font-weight: 600; }
</style>
