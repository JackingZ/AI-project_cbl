<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="盘点单号"><el-input v-model="query.inventoryNo" placeholder="请输入盘点单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, val) in INVENTORY_STATUS" :key="val" :label="label" :value="Number(val)" />
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
        :action-width="330"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ INVENTORY_STATUS[row.status] }}</el-tag></template>
        <template #col-theory="{ row }">{{ row.theoryOrder }} / {{ row.theoryNumber }} / {{ row.theoryPallet }}</template>
        <template #col-actual="{ row }">{{ row.actualOrder }} / {{ row.actualNumber }} / {{ row.actualPallet }}</template>
        <template #col-locked="{ row }"><el-tag size="small" :type="row.locked ? 'danger' : 'info'">{{ row.locked ? '是' : '否' }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.status < 2" link type="primary" size="small" :disabled="!can('distribution')" @click="openAssign(row)">任务分配</el-button>
          <el-button v-if="row.status < 2" link type="primary" size="small" :disabled="!can('distribution')" @click="openEntry(row)">实盘录入</el-button>
          <el-button v-if="row.status === 1" link type="primary" size="small" :disabled="!can('complete')" @click="completeInventory(row)">完成盘点</el-button>
          <el-button v-if="row.status < 2" link type="danger" size="small" :disabled="!can('cancel')" @click="cancelInventory(row)">取消</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（理论vs实盘对比 + 盘点明细子表） -->
    <el-dialog v-model="detail.visible" title="盘点单详情" width="860px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="盘点单号">{{ detail.row.inventoryNo }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ INVENTORY_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="库存锁">{{ detail.row.locked ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="盘点员">{{ detail.row.executorName }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.row.createTime }}</el-descriptions-item>
        <el-descriptions-item label="理论(票/件/托)">{{ detail.row.theoryOrder }} / {{ detail.row.theoryNumber }} / {{ detail.row.theoryPallet }}</el-descriptions-item>
        <el-descriptions-item label="实盘(票/件/托)">{{ detail.row.actualOrder }} / {{ detail.row.actualNumber }} / {{ detail.row.actualPallet }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">盘点明细</el-divider>
      <el-table :data="detail.row.items || []" border size="small">
        <el-table-column label="原单号" prop="originalNo" min-width="130" />
        <el-table-column label="理论数" prop="theoryNum" width="100" align="center" />
        <el-table-column label="实盘数" prop="actualNum" width="100" align="center" />
        <el-table-column label="差异" prop="diff" width="90" align="center" />
        <el-table-column label="库位" prop="location" width="110" align="center" />
      </el-table>
    </el-dialog>

    <!-- 实盘录入弹窗（逐行录实盘数，保存自动算差异+汇总） -->
    <Modal v-model="entry.visible" title="实盘录入" width="760px" :confirm-loading="entry.loading" @confirm="submitEntry">
      <div class="entry-tip">盘点单号：{{ entry.row.inventoryNo }}　仓库：{{ entry.row.warehouseName }}</div>
      <el-table :data="entry.rows" border size="small" style="margin-top: 10px">
        <el-table-column label="原单号" prop="originalNo" min-width="130" />
        <el-table-column label="理论数" prop="theoryNum" width="90" align="center" />
        <el-table-column label="实盘数" width="140" align="center">
          <template #default="{ row }">
            <el-input-number v-model="row.actualNum" :controls="false" :min="0" :max="99999" size="small" style="width: 110px" />
          </template>
        </el-table-column>
        <el-table-column label="差异" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'diff-warn': (row.actualNum - row.theoryNum) !== 0 }">{{ (row.actualNum || 0) - row.theoryNum }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库位" prop="location" width="110" align="center" />
      </el-table>
    </Modal>

    <!-- 任务分配：选盘点员，落库 executorName -->
    <Modal v-model="assign.visible" title="任务分配" width="480px" :confirm-loading="assign.loading" @confirm="submitAssign">
      <el-form label-width="90px">
        <el-form-item label="盘点单号">{{ assign.row.inventoryNo }}</el-form-item>
        <el-form-item label="盘点员" required>
          <el-select v-model="assign.executorName" placeholder="请选择盘点员" style="width: 100%">
            <el-option v-for="s in INVENTORY_STAFF" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assign.remark" type="textarea" :rows="2" :maxlength="100" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { inventoryApi, INVENTORY_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhInventory' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(inventoryApi.list, { inventoryNo: '', warehouseName: '', status: '' })

const columns = [
  { prop: 'inventoryNo', label: '盘点单号', width: 130, fixed: 'left' },
  { prop: 'warehouseName', label: '仓库', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'theory', label: '理论(票/件/托)', width: 130, align: 'center' },
  { prop: 'actual', label: '实盘(票/件/托)', width: 130, align: 'center' },
  { prop: 'locked', label: '库存锁', width: 90, align: 'center' },
  { prop: 'executorName', label: '盘点员', width: 100 },
  { prop: 'createTime', label: '创建时间', width: 160 }
]
const statusTag = s => ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }

// 实盘录入：逐行录实盘数,保存自动算差异+汇总票件托,状态推进到盘点中(1),落库
const entry = reactive({ visible: false, loading: false, row: {}, rows: [] })
const openEntry = row => {
  entry.row = row
  entry.rows = (row.items || []).map(it => ({ ...it, actualNum: it.actualNum ?? it.theoryNum }))
  entry.visible = true
}
const submitEntry = async () => {
  entry.loading = true
  try {
    const rows = entry.rows.map(it => ({ ...it, actualNum: Number(it.actualNum) || 0, diff: (Number(it.actualNum) || 0) - it.theoryNum }))
    const actualNumber = rows.reduce((a, it) => a + it.actualNum, 0)
    await inventoryApi.update(entry.row.id, {
      items: rows,
      actualNumber,
      actualOrder: rows.length,
      status: entry.row.status === 0 ? 1 : entry.row.status
    })
    ElMessage.success('实盘录入已保存')
    entry.visible = false
    loadData()
  } finally {
    entry.loading = false
  }
}

// 任务分配：选盘点员+备注,落库 executorName,状态推进到盘点中
const INVENTORY_STAFF = ['盘点员A', '盘点员B', '盘点员C', '盘点员D']
const assign = reactive({ visible: false, loading: false, row: {}, executorName: '', remark: '' })
const openAssign = row => {
  assign.row = row
  assign.executorName = row.executorName || ''
  assign.remark = ''
  assign.visible = true
}
const submitAssign = async () => {
  if (!assign.executorName) return ElMessage.warning('请选择盘点员')
  assign.loading = true
  try {
    await inventoryApi.update(assign.row.id, { executorName: assign.executorName, status: assign.row.status === 0 ? 1 : assign.row.status })
    ElMessage.success('任务已分配')
    assign.visible = false
    loadData()
  } finally {
    assign.loading = false
  }
}

const completeInventory = async row => {
  await inventoryApi.update(row.id, { status: 2 })
  ElMessage.success('已完成盘点')
  loadData()
}
const cancelInventory = async row => {
  await inventoryApi.update(row.id, { status: 3 })
  ElMessage.success('已取消盘点')
  loadData()
}
</script>

<style scoped lang="scss">
.entry-tip { color: $text-secondary; font-size: $font-sm; }
.diff-warn { color: var(--el-color-danger); font-weight: 600; }
</style>
