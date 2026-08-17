<template>
  <div>
    <!-- 内嵌详情（对齐源 detailShow v-show 切换，非路由跳转） -->
    <RiskOrderDetail v-if="detail.show" :row-id="detail.id" @back="detail.show = false" />

    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="风险类型">
          <el-select v-model="query.keyIndex" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="r in RISK_LIST" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="query.audit" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in ORDER_AUDIT_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="运输方式">
          <el-select v-model="query.type" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 260px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option label="原单号" value="1" />
                <el-option label="客户名称" value="2" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="200" @change="loadData">
          <template #col-type="{ row }">{{ lookup(BIZ_TYPE_LIST, row.type) }}</template>
          <template #col-value="{ row }">{{ row.value }}({{ row.currencyKey }})</template>
          <template #col-risk="{ row }">
            <el-tag v-if="row.overdue" size="small" type="danger">逾期</el-tag>
            <el-tag v-if="row.insufficient" size="small" type="warning">信用不足</el-tag>
            <el-tag v-if="row.ifFrozen" size="small" type="info">冻结</el-tag>
            <el-tag v-if="row.ifLocked" size="small">锁定</el-tag>
            <span v-if="!row.overdue && !row.insufficient && !row.ifFrozen && !row.ifLocked">--</span>
          </template>
          <template #col-audit="{ row }"><el-tag size="small" :type="auditTag(row.audit)">{{ lookup(ORDER_AUDIT_LIST, row.audit) }}</el-tag></template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看详情</el-button>
            <el-button v-if="row.audit === '0' || row.audit === '3'" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
            <el-dropdown v-if="hasMore(row)" trigger="click" @command="c => onCommand(c, row)">
              <el-button link type="primary" size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="!row.ifFrozen" command="frost">冻结</el-dropdown-item>
                  <el-dropdown-item v-if="row.ifFrozen && !row.applyTag" command="applyFrost">申请解冻</el-dropdown-item>
                  <el-dropdown-item v-if="row.ifFrozen" command="removeFrost">解冻</el-dropdown-item>
                  <el-dropdown-item v-if="row.insufficient && !row.beShip" command="special">特批发货</el-dropdown-item>
                  <el-dropdown-item v-if="row.fullorderInsufficient" command="auditOut">出库审核</el-dropdown-item>
                  <!-- 源页注释命令，保持注释：编辑 / 删除 / 打印 -->
                  <!-- <el-dropdown-item command="edit">编辑</el-dropdown-item> -->
                  <!-- <el-dropdown-item command="del">删除</el-dropdown-item> -->
                  <!-- <el-dropdown-item command="print">打印</el-dropdown-item> -->
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 订单审核 -->
    <Modal v-model="audit.visible" title="订单审核" width="440px" :confirm-loading="audit.loading" @confirm="confirmAudit">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="audit.audit">
            <el-radio value="1">通过</el-radio>
            <el-radio value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="audit.audit === '2'" label="审核原因" required>
          <el-input v-model="audit.reason" type="textarea" :rows="3" placeholder="请输入审核原因" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 冻结 -->
    <Modal v-model="frost.visible" title="冻结" width="440px" :confirm-loading="frost.loading" @confirm="confirmFrost">
      <el-form label-width="90px">
        <el-form-item label="冻结原因" required>
          <el-input v-model="frost.remark" type="textarea" :rows="3" placeholder="请输入冻结原因" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 出库审核 -->
    <Modal v-model="outAudit.visible" title="出库审核" width="440px" :confirm-loading="outAudit.loading" @confirm="confirmOutAudit">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="outAudit.audit">
            <el-radio value="1">通过</el-radio>
            <el-radio value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RiskOrderDetail from './components/RiskOrderDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { riskOrderApi, RISK_LIST, ORDER_AUDIT_LIST, BIZ_TYPE_LIST, lookup } from '@/api/modules/financial'

defineOptions({ name: 'FinRisk' })
const { can } = usePagePerms()
const auditTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(riskOrderApi.list, { keyIndex: '', audit: '', type: '', keyWord: '', selectType: '1' })

const columns = [
  { prop: 'code', label: '原单号', minWidth: 130 },
  { prop: 'type', label: '运输方式', minWidth: 100 },
  { prop: 'lscValue', label: '专线', minWidth: 120 },
  { prop: 'custName', label: '客户名称', minWidth: 130 },
  { prop: 'buyerName', label: '收货人', minWidth: 130 },
  { prop: 'sellerName', label: '发货人', minWidth: 130 },
  { prop: 'warehouseName', label: '仓库', minWidth: 100 },
  { prop: 'packages', label: '件数', minWidth: 80, align: 'center' },
  { prop: 'value', label: '货值', minWidth: 130 },
  { prop: 'risk', label: '风险标识', minWidth: 160 },
  { prop: 'audit', label: '审核状态', minWidth: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', minWidth: 160 }
]

// 更多按钮：任一命令可见时才显示下拉
const hasMore = row =>
  !row.ifFrozen ||
  (row.ifFrozen && !row.applyTag) ||
  row.ifFrozen ||
  (row.insufficient && !row.beShip) ||
  row.fullorderInsufficient

/* 内嵌详情 */
const detail = reactive({ show: false, id: null })
const openView = row => Object.assign(detail, { show: true, id: row.id })

/* 订单审核 */
const audit = reactive({ visible: false, loading: false, id: null, audit: '1', reason: '', preAuditVal: '0' })
const openAudit = async row => {
  // 两步：待审核先推进为审核中，再打开审核弹窗（对齐源流程）
  if (row.audit === '0') {
    await riskOrderApi.auditOrder(row.id, '3')
    loadData()
  }
  Object.assign(audit, { visible: true, id: row.id, audit: '1', reason: '' })
}
const confirmAudit = async () => {
  if (audit.audit === '2' && !audit.reason.trim()) return ElMessage.warning('请输入审核原因')
  audit.loading = true
  try {
    await riskOrderApi.auditOrder(audit.id, audit.audit, audit.reason)
    ElMessage.success('审核成功')
    audit.visible = false
    loadData()
  } finally { audit.loading = false }
}

/* 冻结 */
const frost = reactive({ visible: false, loading: false, id: null, remark: '' })
const openFrost = row => Object.assign(frost, { visible: true, id: row.id, remark: '' })
const confirmFrost = async () => {
  if (!frost.remark.trim()) return ElMessage.warning('请输入冻结原因')
  frost.loading = true
  try {
    await riskOrderApi.addFrost(frost.id, frost.remark)
    ElMessage.success('冻结成功')
    frost.visible = false
    loadData()
  } finally { frost.loading = false }
}

/* 出库审核 */
const outAudit = reactive({ visible: false, loading: false, id: null, audit: '1' })
const openOutAudit = row => Object.assign(outAudit, { visible: true, id: row.id, audit: '1' })
const confirmOutAudit = async () => {
  outAudit.loading = true
  try {
    await riskOrderApi.auditOut(outAudit.id, outAudit.audit)
    ElMessage.success('出库审核成功')
    outAudit.visible = false
    loadData()
  } finally { outAudit.loading = false }
}

/* 更多命令分发 */
const onCommand = async (command, row) => {
  if (command === 'frost') return openFrost(row)
  if (command === 'auditOut') return openOutAudit(row)
  if (command === 'applyFrost') {
    return ElMessageBox.confirm('确定申请解冻该订单吗？', '提示', { type: 'warning' })
      .then(async () => { await riskOrderApi.applyFrost(row.id); ElMessage.success('已申请解冻'); loadData() })
      .catch(() => {})
  }
  if (command === 'removeFrost') {
    return ElMessageBox.confirm('确定解冻该订单吗？', '提示', { type: 'warning' })
      .then(async () => { await riskOrderApi.removeFrost(row.id); ElMessage.success('已解冻'); loadData() })
      .catch(() => {})
  }
  if (command === 'special') {
    return ElMessageBox.confirm('确定对该订单特批发货吗？', '提示', { type: 'warning' })
      .then(async () => { await riskOrderApi.special(row.id); ElMessage.success('已特批发货'); loadData() })
      .catch(() => {})
  }
}
</script>
