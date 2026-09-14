<template>
  <!--
    销售计划分配详情（源 distribut.vue 947 行三态共用组件）：
    isType 'company' → 分月合计表（每列 airNum/seaNum/trainNum/carNum + 合计行）；
    isType 'depart'|'sales' → 瀑布流任务卡（周选择 + 服务组/目标行）。
    单位硬编码：空运/卡航=KG，海运/铁路=CBM；business(subtypeId) '1'/'2'→CBM 否则 KG。
  -->
  <div class="dist">
    <div class="dist__head">
      <span class="dist__title">{{ title }} - {{ row.name }}</span>
      <el-button :icon="Back" @click="$emit('close')">返回</el-button>
    </div>

    <!-- company：分月合计表 -->
    <template v-if="isType === 'company'">
      <el-table :data="monthRows" border size="small" show-summary :summary-method="summary">
        <el-table-column label="期间" prop="period" width="160" />
        <el-table-column label="空运(KG)" prop="airNum" align="right" />
        <el-table-column label="海运(CBM)" prop="seaNum" align="right" />
        <el-table-column label="铁路(CBM)" prop="trainNum" align="right" />
        <el-table-column label="卡航(KG)" prop="carNum" align="right" />
        <el-table-column v-if="isEdit" label="操作" width="100" align="center">
          <template #default="{ row: r }"><el-button link type="primary" size="small" @click="editRow(r)">编辑</el-button></template>
        </el-table-column>
      </el-table>
    </template>

    <!-- depart / sales：瀑布流任务卡 -->
    <template v-else>
      <div class="dist__week">
        <span>周期：</span>
        <el-select v-model="activeWeek" style="width: 160px">
          <el-option v-for="c in cards" :key="c.week" :label="c.weekLabel" :value="c.week" />
        </el-select>
      </div>
      <div class="dist__cards">
        <div v-for="item in currentCard.items" :key="item.groupName" class="dist__card">
          <div class="dist__card-name">{{ item.groupName }}</div>
          <div class="dist__card-target">
            目标量：
            <el-input-number v-if="isEdit" v-model="item.target" :min="0" :controls="false" size="small" style="width: 120px" />
            <span v-else>{{ item.target }}</span>
            <span class="dist__unit">{{ unitOf(item.business) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Back } from '@element-plus/icons-vue'
import { planApi, unitByBiz } from '@/api/modules/sales'

defineOptions({ name: 'SalesDistribut' })
defineProps({ isEdit: { type: Boolean, default: false } })
defineEmits(['close'])

const isType = ref('company')
const row = reactive({})
const monthRows = ref([])
const cards = ref([])
const activeWeek = ref(1)

const title = computed(() => ({ company: '公司计划', depart: '部门计划', sales: '业务员计划' }[isType.value] || '计划'))
const currentCard = computed(() => cards.value.find(c => c.week === activeWeek.value) || { items: [] })
// business(subtypeId) '1'/'2'→CBM 否则 KG
const unitOf = biz => unitByBiz(biz)

async function setData(data, type) {
  Object.assign(row, data || {})
  isType.value = type
  const res = (await planApi.getDistribut(data, type)).data
  if (type === 'company') {
    monthRows.value = res
    cards.value = []
  } else {
    cards.value = res
    activeWeek.value = res[0]?.week || 1
  }
}
defineExpose({ setData })

const summary = ({ columns, data }) => columns.map((col, i) => {
  if (i === 0) return '合计'
  const key = col.property
  if (!key) return ''
  return data.reduce((s, r) => s + (Number(r[key]) || 0), 0)
})

const editRow = r => { r._editing = true }
</script>

<style scoped lang="scss">
.dist__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.dist__title { font-size: $font-lg; font-weight: 600; }
.dist__week { margin-bottom: 16px; }
.dist__cards { display: flex; flex-wrap: wrap; gap: $space-md; }
.dist__card {
  width: 260px; background: $bg-card; border: 1px solid $border-color; border-radius: $card-radius; padding: $space-md;
}
.dist__card-name { font-weight: 600; margin-bottom: $space-sm; }
.dist__card-target { color: $text-secondary; }
.dist__unit { margin-left: 6px; }
</style>
