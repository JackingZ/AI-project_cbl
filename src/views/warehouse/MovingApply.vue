<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="调拨单号"><el-input v-model="query.movingNo" placeholder="请输入调拨单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="调出仓"><el-input v-model="query.fromWh" placeholder="请输入调出仓" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="调入仓"><el-input v-model="query.toWh" placeholder="请输入调入仓" clearable style="width: 140px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, val) in MOVING_STATUS" :key="val" :label="label" :value="Number(val)" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
        <el-button :disabled="!can('export')" @click="demoAction('导出调拨申请单')">导出</el-button>
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
        :action-width="240"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ MOVING_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button v-if="[0, 2].includes(row.status)" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="[0, 3].includes(row.status)" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
          <el-button v-if="![1, 4].includes(row.status)" link type="danger" size="small" :disabled="!can('cancel')" @click="cancelRow(row)">取消</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑弹窗（调出仓/调入仓/备注 + 明细挑单器占位） -->
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="调出仓" prop="fromWh"><el-input v-model="form.fromWh" placeholder="请输入调出仓" /></el-form-item>
        <el-form-item label="调入仓" prop="toWh"><el-input v-model="form.toWh" placeholder="请输入调入仓" /></el-form-item>
        <el-form-item label="调拨明细">
          <el-input :model-value="`已选择(${form.items.length})`" readonly>
            <template #append><el-button :icon="Search" @click="openPick" /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入备注" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 详情弹窗（头部 + 调拨明细） -->
    <el-dialog v-model="detail.visible" title="调拨申请单详情" width="820px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="调拨单号">{{ detail.row.movingNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ MOVING_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="调出仓">{{ detail.row.fromWh }}</el-descriptions-item>
        <el-descriptions-item label="调入仓">{{ detail.row.toWh }}</el-descriptions-item>
        <el-descriptions-item label="总票数">{{ detail.row.totalNumber }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.row.applicant }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detail.row.auditor || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detail.row.auditTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ detail.row.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.row.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.row.items || []" border size="small" style="margin-top: 16px">
        <el-table-column label="原单号" prop="originalNo" min-width="120" />
        <el-table-column label="目的仓" prop="targetWh" min-width="120" />
        <el-table-column label="计量状态" prop="measureStatus" width="100" align="center" />
        <el-table-column label="验货状态" prop="examineStatus" width="100" align="center" />
      </el-table>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="audit.visible" title="调拨审核" width="480px">
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

    <!-- 调拨明细挑单器：搜索 + 多选待调拨订单加入明细 -->
    <el-dialog v-model="pick.visible" title="选择调拨订单" width="720px">
      <div class="pick-search">
        <el-input v-model="pick.keyword" placeholder="按原单号搜索" clearable style="width: 220px" @keyup.enter="() => {}">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>
      <el-table :data="pickFiltered" border height="360" @selection-change="rows => pick.selected = rows">
        <el-table-column type="selection" width="46" reserve-selection />
        <el-table-column prop="originalNo" label="原单号" min-width="140" />
        <el-table-column prop="targetWh" label="目的仓" min-width="120" />
        <el-table-column prop="measureStatus" label="计量状态" width="100" align="center" />
        <el-table-column prop="examineStatus" label="验货状态" width="100" align="center" />
      </el-table>
      <template #footer>
        <span class="pick-tip">已选 {{ pick.selected.length }} 单</span>
        <el-button @click="pick.visible = false">取 消</el-button>
        <el-button type="primary" @click="confirmPick">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen, demoAction } from '@/utils'
import { movingApi, MOVING_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhMoving' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(movingApi.list, { movingNo: '', fromWh: '', toWh: '', status: '' })

const columns = [
  { prop: 'movingNo', label: '调拨单号', width: 130, fixed: 'left' },
  { prop: 'fromWh', label: '调出仓', minWidth: 120 },
  { prop: 'toWh', label: '调入仓', minWidth: 120 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'totalNumber', label: '总票数', width: 80, align: 'center' },
  { prop: 'applicant', label: '申请人', width: 100 },
  { prop: 'auditor', label: '审核人', width: 100 },
  { prop: 'auditTime', label: '审核时间', width: 160 },
  { prop: 'remark', label: '备注', minWidth: 120 },
  { prop: 'createTime', label: '创建时间', width: 160 }
]
const statusTag = s => ({ 0: 'info', 3: 'warning', 1: 'success', 2: 'danger', 4: 'primary' }[s] || 'info')

const rules = {
  fromWh: [required('请输入调出仓')],
  toWh: [required('请输入调入仓')]
}
const defaultForm = () => ({ fromWh: '', toWh: '', remark: '', items: [] })
const { formRef, dialog, form, openAdd, openEdit, submit } = useCrudForm({ api: movingApi, defaultForm, reload: loadData, label: '调拨申请' })

const detail = reactive({ visible: false, row: {} })

// 调拨明细挑单器：搜索 + 多选待调拨订单加入 form.items
const pick = reactive({ visible: false, keyword: '', candidates: [], selected: [] })
const openPick = () => {
  // 生成待调拨订单候选（占位派生）
  pick.candidates = Array.from({ length: 20 }, (_, i) => ({
    originalNo: `YD${100000 + i * 137}`,
    targetWh: form.toWh || '目的仓',
    measureStatus: i % 2 ? '已计量' : '待计量',
    examineStatus: i % 3 ? '已验货' : '待验货'
  }))
  pick.keyword = ''
  pick.selected = []
  pick.visible = true
}
const pickFiltered = computed(() => {
  const kw = pick.keyword.trim().toLowerCase()
  if (!kw) return pick.candidates
  return pick.candidates.filter(o => o.originalNo.toLowerCase().includes(kw))
})
const confirmPick = () => {
  if (!Array.isArray(form.items)) form.items = []
  const exist = new Set(form.items.map(it => it.originalNo))
  pick.selected.forEach(o => { if (!exist.has(o.originalNo)) form.items.push({ ...o }) })
  pick.visible = false
}
const openDetail = row => { detail.row = row; detail.visible = true }

const audit = reactive({ visible: false, loading: false, id: null, result: 1, remark: '' })
const openAudit = row => { Object.assign(audit, { visible: true, id: row.id, result: 1, remark: '' }) }
const submitAudit = async () => {
  if (audit.result === 2 && !audit.remark.trim()) { ElMessage.warning('请输入拒绝原因'); return }
  audit.loading = true
  try {
    await movingApi.update(audit.id, { status: audit.result, remark: audit.remark })
    ElMessage.success('审核成功')
    audit.visible = false
    loadData()
  } finally {
    audit.loading = false
  }
}

const cancelRow = row =>
  confirmThen('请确认是否取消该调拨申请?', async () => { await movingApi.update(row.id, { status: 2 }); loadData() },
    { title: '温馨提示', success: '已取消' })
</script>

<style scoped lang="scss">
.pick-tip { margin-right: auto; color: $text-secondary; font-size: $font-sm; }
</style>
