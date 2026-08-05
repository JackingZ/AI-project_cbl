<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="出库单号"><el-input v-model="query.outputNo" placeholder="请输入出库单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="出库类型">
        <el-select v-model="query.outputType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="t in OUTPUT_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, val) in OUTPUT_STATUS" :key="val" :label="label" :value="Number(val)" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="申请时间">
        <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
      </el-form-item>
      <template #actions>
        <el-button :disabled="!can('export')" @click="demoAction('导出出库申请单')">导出</el-button>
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
        :action-width="250"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ OUTPUT_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.status === 0" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
          <el-button v-if="row.status === 2" link type="primary" size="small" :disabled="!can('reset')" @click="demoAction('重新提交')">重新提交</el-button>
          <el-button v-if="![2, 4].includes(row.status)" link type="primary" size="small" :disabled="!can('complete')" @click="demoAction('完成出库')">完成出库</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（只读展示出库申请单） -->
    <el-dialog v-model="detail.visible" title="出库申请单详情" width="820px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="出库单号">{{ detail.row.outputNo }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ OUTPUT_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="出库类型">{{ detail.row.outputType }}</el-descriptions-item>
        <el-descriptions-item label="服务类型">{{ detail.row.serviceType }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="车/柜型">{{ detail.row.containerType }}</el-descriptions-item>
        <el-descriptions-item label="总箱数">{{ detail.row.totalBox }}</el-descriptions-item>
        <el-descriptions-item label="总体积">{{ detail.row.totalVolume }} CBM</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ detail.row.totalWeight }} KGS</el-descriptions-item>
        <el-descriptions-item label="装载时间">{{ detail.row.loadTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.row.executorName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.row.assignorName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.row.createTime }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.row.status === 2" label="拒绝原因">{{ detail.row.auditRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="出库审核" width="480px">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="audit.result">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="audit.result === 2" label="拒绝原因">
          <el-input v-model="audit.remark" type="textarea" :rows="3" maxlength="100" show-word-limit placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="audit.visible = false">取 消</el-button>
        <el-button type="primary" :loading="audit.loading" @click="submitAudit">确 认</el-button>
      </template>
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
import { outputApi, OUTPUT_STATUS, OUTPUT_TYPES } from '@/api/modules/warehouse'

defineOptions({ name: 'WhOutput' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(outputApi.list, { outputNo: '', outputType: '', status: '', warehouseName: '', dateRange: [] })

const columns = [
  { prop: 'outputNo', label: '出库单号', width: 130, fixed: 'left' },
  { prop: 'status', label: '审核状态', width: 100, align: 'center' },
  { prop: 'outputType', label: '出库类型', width: 100, align: 'center' },
  { prop: 'serviceType', label: '服务类型', minWidth: 120 },
  { prop: 'totalBox', label: '总箱数', width: 80, align: 'center' },
  { prop: 'totalVolume', label: '总体积', width: 90, align: 'center' },
  { prop: 'totalWeight', label: '总重量', width: 90, align: 'center' },
  { prop: 'containerType', label: '车/柜型', width: 100, align: 'center' },
  { prop: 'executorName', label: '操作人', width: 100 },
  { prop: 'assignorName', label: '申请人', width: 100 },
  { prop: 'loadTime', label: '装载时间', width: 160 },
  { prop: 'createTime', label: '创建时间', width: 160 }
]
const statusTag = s => ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'warning', 4: 'primary' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }

const audit = reactive({ visible: false, loading: false, id: null, result: 1, remark: '' })
const openAudit = row => { Object.assign(audit, { visible: true, id: row.id, result: 1, remark: '' }) }
const submitAudit = async () => {
  if (audit.result === 2 && !audit.remark.trim()) { ElMessage.warning('请输入拒绝原因'); return }
  audit.loading = true
  try {
    await outputApi.update(audit.id, { status: audit.result, auditRemark: audit.remark })
    ElMessage.success('审核成功')
    audit.visible = false
    loadData()
  } finally {
    audit.loading = false
  }
}
</script>
