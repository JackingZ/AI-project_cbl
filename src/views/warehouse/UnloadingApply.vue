<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="原单号"><el-input v-model="query.originalNo" placeholder="请输入原单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="卸货单号"><el-input v-model="query.unloadNo" placeholder="请输入卸货单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="卸货类型">
        <el-select v-model="query.unloadType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in UNLOAD_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.unloadStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in UNLOAD_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="申请时间">
        <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
      </el-form-item>
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
        <template #col-unloadStatus="{ row }"><el-tag size="small" :type="statusTag(row.unloadStatus)">{{ row.unloadStatus }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（只读展示卸货申请单 + 订单签收单子表） -->
    <el-dialog v-model="detail.visible" title="卸货申请单详情" width="880px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="卸货申请单号">{{ detail.row.unloadNo }}</el-descriptions-item>
        <el-descriptions-item label="原单号">{{ detail.row.originalNo }}</el-descriptions-item>
        <el-descriptions-item label="仓库名称">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="卸货类型">{{ detail.row.unloadType }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.row.unloadStatus }}</el-descriptions-item>
        <el-descriptions-item label="车牌/柜/快递号">{{ detail.row.licenseNo }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.row.unloadType === '快递'" label="快递公司">{{ detail.row.expressName || '-' }}</el-descriptions-item>
        <template v-else>
          <el-descriptions-item label="司机姓名">{{ detail.row.driversName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="司机联系电话">{{ detail.row.driversMobile || '-' }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="预计卸货时间">{{ detail.row.expectedUnloadTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预计卸货口">{{ detail.row.expectedWcName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库对接人">{{ detail.row.warehouseContactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实际卸货时间">{{ detail.row.actualUnloadStartTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="卸货完成时间">{{ detail.row.actualUnloadEndTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.row.executorName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.row.assignorName }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-subtitle">订单签收单</div>
      <el-table :data="detail.row.signItems || []" border size="small" style="width: 100%">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="originalNo" label="原单号" min-width="140" />
        <el-table-column prop="totalNumber" label="收货件数" width="110" align="center" />
        <el-table-column prop="problemNumber" label="问题件箱数" width="110" align="center" />
        <el-table-column label="问题件照片" width="120" align="center">
          <template #default="scope">
            <el-button v-if="scope.row.problemNumber > 0" link type="primary" size="small" @click="demoAction('查看问题件照片')">查看</el-button>
            <span v-else>-</span>
          </template>
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
import { unloadApi, UNLOAD_TYPES, UNLOAD_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhUnload' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(unloadApi.list, { originalNo: '', unloadNo: '', unloadType: '', unloadStatus: '', warehouseName: '', dateRange: [] })

const columns = [
  { prop: 'unloadNo', label: '卸货单号', width: 130, fixed: 'left' },
  { prop: 'unloadStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'warehouseName', label: '仓库', width: 110 },
  { prop: 'unloadType', label: '卸货类型', width: 90, align: 'center' },
  { prop: 'licenseNo', label: '车牌/柜/快递号', minWidth: 150 },
  { prop: 'driversName', label: '司机', width: 90 },
  { prop: 'driversMobile', label: '司机电话', width: 130 },
  { prop: 'expectedUnloadTime', label: '预计卸货时间', width: 160 },
  { prop: 'executorName', label: '操作人', width: 100 },
  { prop: 'assignorName', label: '申请人', width: 100 },
  { prop: 'createTime', label: '申请时间', width: 160 }
]
const statusTag = s => ({ 待卸货: 'info', 卸货中: 'warning', 已完成: 'success', 已取消: 'danger' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }
</script>

<style scoped lang="scss">
.detail-subtitle { margin: $space-md 0 $space-sm; font-weight: 600; color: $text-primary; }
</style>
