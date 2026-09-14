<template>
  <!--
    服务组任务量明细（源 sales-billboard/detail.vue 146 行）：内嵌页(非弹窗)。
    源图为堆叠柱(目标量/完成量)且数据 mock 硬编码；表格 tableData 源始终为空。
    当前入口因源 chartClick 被注释而未启用（此处保留组件供 v-show 切换）。
  -->
  <div class="bd">
    <div class="bd__head">
      <span class="bd__title">详情</span>
      <el-button :icon="Back" @click="$emit('close')">返回</el-button>
    </div>
    <BillboardChart :rows="chartRows" unit="" stack :height="320" />
    <el-table :data="tableData" border size="small" style="margin-top: 16px">
      <el-table-column label="订单名称" prop="name" width="120" />
      <el-table-column label="业务类型" prop="time" min-width="120" />
      <el-table-column label="业务类型-任务量" min-width="200" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Back } from '@element-plus/icons-vue'
import BillboardChart from './BillboardChart.vue'
import { boardApi } from '@/api/modules/sales'

defineOptions({ name: 'SalesBillboardDetail' })
defineEmits(['close'])

const chartRows = ref([])
// 源 tableData 始终为 []（未赋值），保真保留
const tableData = ref([])

async function setData() {
  const res = (await boardApi.getDetail()).data
  chartRows.value = res.rows.map(r => ({ name: r.name, planNum: r.target, actualNum: r.actual, percent: r.percent }))
}
defineExpose({ setData })
</script>

<style scoped lang="scss">
.bd__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.bd__title { font-size: $font-lg; font-weight: 600; }
</style>
