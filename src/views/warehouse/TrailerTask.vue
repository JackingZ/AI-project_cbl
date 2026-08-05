<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="任务单号"><el-input v-model="query.towageNo" placeholder="请输入任务单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="任务类型">
        <el-select v-model="query.towageMethod" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="m in TOWAGE_METHODS" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>
      <el-form-item label="拖托人"><el-input v-model="query.pickerId" placeholder="请输入拖托人" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in TOWAGE_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
      </el-form-item>
      <template #actions>
        <el-button type="primary" :disabled="!can('print')" @click="demoAction('打印托标')">打印托标</el-button>
      </template>
    </SearchBar>
    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="100"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ row.status }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（只读展示拖托任务 + 托盘明细子表） -->
    <el-dialog v-model="detail.visible" title="拖托任务单详情" width="880px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="拖托任务单号">{{ detail.row.towageNo }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ detail.row.towageMethod }}</el-descriptions-item>
        <el-descriptions-item label="拖托人">{{ detail.row.pickerId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.row.status }}</el-descriptions-item>
        <el-descriptions-item label="要求完成时间">{{ detail.row.expectedFinishTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-subtitle">托盘明细</div>
      <el-table :data="detail.row.pallets || []" border size="small" style="width: 100%">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="equipment" label="托盘/中转箱" width="110" align="center" />
        <el-table-column prop="palletNo" label="托盘ID" min-width="130" />
        <el-table-column prop="status" label="托盘状态" width="100" align="center" />
        <el-table-column prop="startingArea" label="起始区域" width="110" align="center" />
        <el-table-column prop="storageLocation" label="目的区域" width="110" align="center" />
        <el-table-column prop="finishTime" label="完成时间" width="160">
          <template #default="scope">{{ scope.row.finishTime || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { trailerTaskApi, TOWAGE_METHODS, TOWAGE_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhTrailerTask' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(trailerTaskApi.list, { towageNo: '', towageMethod: '', pickerId: '', status: '', dateRange: [] })

const columns = [
  { prop: 'towageNo', label: '拖托任务单号', width: 140, fixed: 'left' },
  { prop: 'towageMethod', label: '任务类型', width: 110, align: 'center' },
  { prop: 'pickerId', label: '拖托人', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'expectedFinishTime', label: '要求完成时间', width: 170 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const statusTag = s => ({ 待执行: 'info', 执行中: 'warning', 已完成: 'success' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }
</script>

<style scoped lang="scss">
.detail-subtitle { margin: $space-md 0 $space-sm; font-weight: 600; color: $text-primary; }
</style>
