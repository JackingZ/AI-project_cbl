<template>
  <div>
    <!-- 分配详情内嵌切换（对齐源 detailShow + <distributInfo ref @close>） -->
    <Distribut v-show="detailShow" ref="distributRef" :is-edit="isEdit" @close="detailShow = false" />

    <div v-show="!detailShow">
      <!-- 统计卡（空运/海运/铁路/卡航，svg 图标降级为文字标） -->
      <div class="plan-stat">
        <div v-for="c in statCards" :key="c.key" class="plan-stat__card">
          <div class="plan-stat__label">{{ c.label }}</div>
          <div class="plan-stat__value">{{ stat[c.key] }} <span class="plan-stat__unit">{{ c.unit }}</span></div>
        </div>
      </div>

      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="计划名称"><el-input v-model="query.name" placeholder="请输入" clearable style="width: 180px" /></el-form-item>
        <template #actions>
          <el-button v-if="can('add')" type="success" :icon="Plus" @click="openDetail(null, true)">新增</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="160" @change="loadData">
          <template #actions="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row, false)">查看分配</el-button>
            <el-button v-if="can('edit')" link type="primary" size="small" @click="openDetail(row, true)">编辑分配</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Distribut from './distribut.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { planApi } from '@/api/modules/sales'

defineOptions({ name: 'CompanyPlan' })
const { can } = usePagePerms()

const stat = reactive({ air: 0, sea: 0, train: 0, car: 0 })
const statCards = [
  { key: 'air', label: '空运', unit: 'KG' },
  { key: 'sea', label: '海运', unit: 'CBM' },
  { key: 'train', label: '铁路', unit: 'CBM' },
  { key: 'car', label: '卡航', unit: 'KG' }
]

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(planApi.listCompany, { name: '' })
const columns = [
  { prop: 'name', label: '计划名称', minWidth: 160 },
  { prop: 'companyName', label: '所属公司', minWidth: 160 },
  { prop: 'year', label: '年度', width: 90 },
  { prop: 'fiscalName', label: '期间', width: 140 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

onMounted(() => {
  // 统计合计（对齐源 stat 卡；mock 汇总列表）
  Object.assign(stat, { air: 8600, sea: 4200, train: 3100, car: 5400 })
})

const detailShow = ref(false)
const isEdit = ref(false)
const distributRef = ref(null)
const openDetail = (row, edit) => {
  isEdit.value = edit
  detailShow.value = true
  distributRef.value.setData(row || { name: '新计划' }, 'company')
}
</script>

<style scoped lang="scss">
.plan-stat { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-md; margin-bottom: $space-md; }
.plan-stat__card { background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md; border-left: 3px solid $primary-color; }
.plan-stat__label { font-size: $font-sm; color: $text-secondary; }
.plan-stat__value { font-size: $font-xl; font-weight: 700; color: $text-primary; margin-top: $space-xs; }
.plan-stat__unit { font-size: $font-sm; font-weight: 400; color: $text-secondary; }
</style>
