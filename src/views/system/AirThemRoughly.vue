<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <div>
          <el-button type="primary" :icon="Plus" :disabled="!can('allot')" @click="demoAction('分配号段')">分配</el-button>
          <el-button :icon="Upload" :disabled="!can('import')" @click="demoAction('导入号段')">导入</el-button>
        </div>
        <div class="op-filters">
          <el-select v-model="query.airlineCompany" placeholder="航空公司" clearable filterable style="width: 180px">
            <el-option v-for="a in airlineOptions" :key="a" :label="a" :value="a" />
          </el-select>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="160"
        @change="loadData"
      >
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="demoAction('操作日志')">操作日志</el-button>
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="demoAction('查看明细')">查看</el-button>
        </template>
      </ProTable>
    </PageCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { airApi } from '@/api/modules/system'

defineOptions({ name: 'SysAir' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(airApi.list, { airlineCompany: '' })

// 航空公司下拉（取号段库存数据聚合）
const airlineOptions = computed(() => airApi.res.raw().map(r => r.airlineCompany))

const columns = [
  { prop: 'airlineCompany', label: '航空公司', minWidth: 180 },
  { prop: 'total', label: '总数量', width: 110, align: 'center' },
  { prop: 'surplus', label: '剩余数量', width: 110, align: 'center' },
  { prop: 'allocated', label: '已分配', width: 110, align: 'center' },
  { prop: 'printedOrder', label: '已打单', width: 110, align: 'center' },
  { prop: 'shipped', label: '已发运', width: 110, align: 'center' }
]
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
</style>
