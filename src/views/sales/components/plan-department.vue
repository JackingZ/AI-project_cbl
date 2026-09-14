<template>
  <div>
    <Distribut v-show="detailShow" ref="distributRef" :is-edit="isEdit" @close="detailShow = false" />

    <div v-show="!detailShow">
      <div class="plan-stat">
        <div v-for="c in statCards" :key="c.key" class="plan-stat__card">
          <div class="plan-stat__label">{{ c.label }}</div>
          <div class="plan-stat__value">{{ stat[c.key] }} <span class="plan-stat__unit">{{ c.unit }}</span></div>
        </div>
      </div>

      <!-- 源含注释掉的 comType 下拉（模板 12-25 行），保留为注释不放开 -->
      <!--
      <el-form-item label="公司类型">
        <el-select v-model="query.comType"><el-option v-for="t in COM_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" /></el-select>
      </el-form-item>
      -->
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

defineOptions({ name: 'DepartPlan' })
const { can } = usePagePerms()

const stat = reactive({ air: 0, sea: 0, train: 0, car: 0 })
const statCards = [
  { key: 'air', label: '空运', unit: 'KG' },
  { key: 'sea', label: '海运', unit: 'CBM' },
  { key: 'train', label: '铁路', unit: 'CBM' },
  { key: 'car', label: '卡航', unit: 'KG' }
]

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(planApi.listDepart, { name: '' })
const columns = [
  { prop: 'name', label: '计划名称', minWidth: 160 },
  { prop: 'companyName', label: '所属公司', minWidth: 160 },
  { prop: 'deptName', label: '所属部门', width: 140 },
  { prop: 'year', label: '年度', width: 90 },
  { prop: 'fiscalName', label: '期间', width: 140 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

onMounted(() => { Object.assign(stat, { air: 3200, sea: 1800, train: 1200, car: 2100 }) })

const detailShow = ref(false)
const isEdit = ref(false)
const distributRef = ref(null)
const openDetail = (row, edit) => {
  isEdit.value = edit
  detailShow.value = true
  distributRef.value.setData(row || { name: '新计划' }, 'depart')
}
</script>

<style scoped lang="scss">
.plan-stat { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-md; margin-bottom: $space-md; }
.plan-stat__card { background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md; border-left: 3px solid $primary-color; }
.plan-stat__label { font-size: $font-sm; color: $text-secondary; }
.plan-stat__value { font-size: $font-xl; font-weight: 700; color: $text-primary; margin-top: $space-xs; }
.plan-stat__unit { font-size: $font-sm; font-weight: 400; color: $text-secondary; }
</style>
