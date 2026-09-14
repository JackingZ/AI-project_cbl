<template>
  <!--
    销售计划容器（源 plan-distribut/index.vue）：el-tabs → 3 子页。
    tab 映射（非直觉）：first公司计划→CompanyPlan、second部门计划→DepartPlan、third业务员计划→PersonPlan。
    子页 v-if 懒挂载；默认 tab 按权限降序选择（公司→部门→业务员）。
  -->
  <div>
    <el-tabs v-model="activeName" class="pd-tabs">
      <el-tab-pane v-if="can('salesCompanyPlan')" label="公司计划" name="first" />
      <el-tab-pane v-if="can('salesDepartPlan')" label="部门计划" name="second" />
      <el-tab-pane v-if="can('salesMenPlan')" label="业务员计划" name="third" />
    </el-tabs>

    <CompanyPlan v-if="activeName === 'first'" />
    <DepartPlan v-else-if="activeName === 'second'" />
    <PersonPlan v-else-if="activeName === 'third'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CompanyPlan from './components/plan-company.vue'
import DepartPlan from './components/plan-department.vue'
import PersonPlan from './components/plan-salesman.vue'
import { usePagePerms } from '@/utils/hooks'

defineOptions({ name: 'SalesPlan' })
const { can } = usePagePerms()

const activeName = ref('first')
onMounted(() => {
  // 默认 tab 按权限降序（对齐源 created）
  if (can('salesCompanyPlan')) activeName.value = 'first'
  else if (can('salesDepartPlan')) activeName.value = 'second'
  else if (can('salesMenPlan')) activeName.value = 'third'
})
</script>

<style scoped lang="scss">
.pd-tabs { margin-bottom: $space-sm; }
</style>
