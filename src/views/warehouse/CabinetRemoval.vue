<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="柜号"><el-input v-model="query.cabinetNo" placeholder="请输入柜号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, val) in REMOVAL_STATUS" :key="val" :label="label" :value="Number(val)" />
        </el-select>
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
        :action-width="200"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ REMOVAL_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="[0, 3].includes(row.status)" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
          <el-button v-if="row.status !== 1" link type="primary" size="small" :disabled="!can('edit')" @click="openSplit(row)">编辑实拆</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（只读展示拆柜任务 + 拆柜明细子表） -->
    <el-dialog v-model="detail.visible" title="拆柜任务单详情" width="900px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="柜号">{{ detail.row.cabinetNo }}</el-descriptions-item>
        <el-descriptions-item label="仓库名称">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ REMOVAL_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="总件数">{{ detail.row.totalPackages }}</el-descriptions-item>
        <el-descriptions-item label="实拆件数">{{ detail.row.actualPackages }}</el-descriptions-item>
        <el-descriptions-item label="托盘数">{{ detail.row.palletCount }}</el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2">{{ detail.row.auditRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>

      <div class="detail-subtitle">拆柜明细</div>
      <el-table :data="detail.row.items || []" border size="small" style="width: 100%">
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="originalNo" label="原单号" min-width="140" />
        <el-table-column prop="packages" label="件数" width="90" align="center" />
        <el-table-column prop="actualPackages" label="实拆件数" width="100" align="center" />
        <el-table-column prop="palletNo" label="托盘ID" width="130" />
        <el-table-column prop="goodsStatus" label="货物状态" width="100" align="center" />
      </el-table>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="拆柜审核" width="480px">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="audit.result">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="3">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="audit.result === 3" label="拒绝原因">
          <el-input v-model="audit.remark" type="textarea" :rows="3" maxlength="100" show-word-limit placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="audit.visible = false">取 消</el-button>
        <el-button type="primary" :loading="audit.loading" @click="submitAudit">确 认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑实拆（逐行录实拆件数/托盘ID，保存自动汇总实拆件数+托盘数，落库） -->
    <el-dialog v-model="split.visible" title="编辑实拆" width="820px">
      <div class="detail-subtitle">拆柜明细（录入实拆结果）</div>
      <el-table :data="split.rows" border size="small" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="originalNo" label="原单号" min-width="130" />
        <el-table-column prop="packages" label="件数" width="80" align="center" />
        <el-table-column label="实拆件数" width="130" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.actualPackages" :controls="false" :min="0" :max="99999" size="small" style="width: 100px" />
          </template>
        </el-table-column>
        <el-table-column label="托盘ID" width="160">
          <template #default="{ row }"><el-input v-model="row.palletNo" size="small" placeholder="托盘ID" /></template>
        </el-table-column>
        <el-table-column label="货物状态" width="120" align="center">
          <template #default="{ row }">
            <el-select v-model="row.goodsStatus" size="small" style="width: 100px">
              <el-option label="正常" value="正常" />
              <el-option label="破损" value="破损" />
              <el-option label="缺失" value="缺失" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="split.visible = false">取 消</el-button>
        <el-button type="primary" :loading="split.loading" @click="submitSplit">保 存</el-button>
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
import { removalApi, REMOVAL_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhRemoval' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(removalApi.list, { cabinetNo: '', warehouseName: '', status: '' })

const columns = [
  { prop: 'cabinetNo', label: '柜号', width: 130, fixed: 'left' },
  { prop: 'warehouseName', label: '仓库', width: 120 },
  { prop: 'status', label: '审核状态', width: 100, align: 'center' },
  { prop: 'totalPackages', label: '总件数', width: 90, align: 'center' },
  { prop: 'actualPackages', label: '实拆件数', width: 100, align: 'center' },
  { prop: 'palletCount', label: '托盘数', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', minWidth: 170 }
]
const statusTag = s => ({ 0: 'info', 1: 'success', 3: 'warning' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }

// 编辑实拆：逐行录实拆件数/托盘,保存自动汇总,落库
const split = reactive({ visible: false, loading: false, id: null, rows: [] })
const openSplit = row => {
  split.id = row.id
  split.rows = (row.items || []).map(it => ({ ...it, actualPackages: it.actualPackages ?? it.packages, palletNo: it.palletNo || '', goodsStatus: it.goodsStatus || '正常' }))
  split.visible = true
}
const submitSplit = async () => {
  split.loading = true
  try {
    const rows = split.rows.map(it => ({ ...it, actualPackages: Number(it.actualPackages) || 0 }))
    const actualPackages = rows.reduce((a, it) => a + it.actualPackages, 0)
    const palletCount = new Set(rows.map(it => it.palletNo).filter(Boolean)).size
    await removalApi.update(split.id, { items: rows, actualPackages, palletCount })
    ElMessage.success('实拆结果已保存')
    split.visible = false
    loadData()
  } finally {
    split.loading = false
  }
}

const audit = reactive({ visible: false, loading: false, id: null, result: 1, remark: '' })
const openAudit = row => { Object.assign(audit, { visible: true, id: row.id, result: 1, remark: '' }) }
const submitAudit = async () => {
  if (audit.result === 3 && !audit.remark.trim()) { ElMessage.warning('请输入拒绝原因'); return }
  audit.loading = true
  try {
    await removalApi.update(audit.id, { status: audit.result, auditRemark: audit.remark })
    ElMessage.success('审核成功')
    audit.visible = false
    loadData()
  } finally {
    audit.loading = false
  }
}
</script>

<style scoped lang="scss">
.detail-subtitle { margin: $space-md 0 $space-sm; font-weight: 600; color: $text-primary; }
</style>
