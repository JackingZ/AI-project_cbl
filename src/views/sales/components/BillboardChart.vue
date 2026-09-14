<template>
  <!--
    看板柱线混合图（还原源 ve-histogram / v-charts）：
    columns:['名称','计划量','完成量']，计划量画折线(showLine)，完成量画柱；
    颜色 蓝#409EFF(完成量柱) / 红#F56C6C(计划量线)；xAxis 旋转 -45 长名截断；barWidth 20px。
    tooltip 输出 名称 + 各 series 值+单位 + 完成率%。
  -->
  <v-chart :option="option" :style="{ height: height + 'px', width: '100%' }" autoresize />
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, TitleComponent])

const props = defineProps({
  // [{ name, planNum, actualNum, percent }]
  rows: { type: Array, default: () => [] },
  unit: { type: String, default: 'KG' },
  height: { type: Number, default: 320 },
  // stack 模式（detail 明细图为堆叠）
  stack: { type: Boolean, default: false }
})

// xAxis 长名截断：max=10 字符分两行、超长加 ...
const truncate = name => {
  const s = String(name || '')
  if (s.length <= 10) return s
  if (s.length <= 20) return s.slice(0, 10) + '\n' + s.slice(10)
  return s.slice(0, 10) + '\n' + s.slice(10, 18) + '...'
}

const colorList = ['rgba(64,158,255,1)', 'rgba(245,108,108,1)']

const option = computed(() => {
  const names = props.rows.map(r => r.name)
  const percents = props.rows.map(r => r.percent)
  const planData = props.rows.map(r => r.planNum)
  const actualData = props.rows.map(r => r.actualNum)
  return {
    title: { text: '任务量', textStyle: { fontSize: 14, color: '#666' } },
    legend: { icon: 'circle', top: 4, right: 10 },
    grid: { top: 50, left: 30, bottom: 40, right: 60, containLabel: true },
    tooltip: {
      trigger: 'axis',
      formatter: params => {
        const idx = params[0].dataIndex
        let html = `${names[idx]}<br/>`
        params.forEach(p => { html += `${p.marker}${p.seriesName}：${p.value} ${props.unit}<br/>` })
        html += `完成率：${percents[idx]}%`
        return html
      }
    },
    xAxis: {
      type: 'category', data: names,
      axisLabel: { rotate: -45, formatter: truncate }
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '完成量', type: 'bar', barWidth: '20px', data: actualData,
        ...(props.stack ? { stack: '量' } : {}), itemStyle: { color: colorList[0] }
      },
      {
        name: '计划量', ...(props.stack ? { type: 'bar', stack: '量' } : { type: 'line', smooth: false }),
        data: planData, itemStyle: { color: colorList[1] }
      }
    ]
  }
})
</script>
