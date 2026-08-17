<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>对账单-{{ header.fisCalName || '--' }}</span>
        <el-tag size="small" :type="header.type === 'R' ? 'success' : 'warning'">{{ lookup(CHECK_TYPE_LIST, header.type) }}</el-tag>
        <el-tag size="small" :type="header.ifClose === 1 ? 'success' : 'info'">{{ lookup(CLOSE_LIST, header.ifClose) }}</el-tag>
      </div>
      <div>
        <!-- 导入：源页为文件导入，无后端，桩按钮提示 -->
        <el-button type="primary" @click="onImport">导入</el-button>
        <el-button @click="autoReconcile">自动对账</el-button>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <!-- 统计栏 -->
    <div class="check-stat">
      <div class="check-stat__item"><span class="check-stat__label">左表笔数</span><span class="check-stat__val">{{ leftRows.length }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">右表笔数</span><span class="check-stat__val">{{ rightRows.length }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">已对账笔数</span><span class="check-stat__val">{{ checkedCount }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">未对账笔数</span><span class="check-stat__val">{{ uncheckedCount }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">左表合计金额</span><span class="check-stat__val">{{ leftTotal }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">右表合计金额</span><span class="check-stat__val">{{ rightTotal }}</span></div>
      <div class="check-stat__item"><span class="check-stat__label">差额</span><span class="check-stat__val" :class="{ 'is-diff': diffAmount !== 0 }">{{ diffAmount }}</span></div>
    </div>

    <!-- 对账操作：源页为拖拽对账（vxe），vxe 不可用，改为勾选配对 -->
    <div class="check-ops">
      <el-button type="primary" size="small" @click="pairReconcile">对账 →</el-button>
      <el-button size="small" @click="cancelReconcile">取消对账</el-button>
    </div>

    <div class="check-tables">
      <!-- 左表：回款明细 -->
      <div class="check-tables__col">
        <div class="check-tables__title">回款明细</div>
        <el-table ref="leftTableRef" :data="leftRows" border size="small" height="420" row-key="id" @selection-change="rows => leftSel = rows">
          <el-table-column type="selection" width="45" reserve-selection />
          <el-table-column prop="payDate" label="回款日期" width="110" />
          <el-table-column prop="custName" label="客户名称" min-width="120" show-overflow-tooltip />
          <el-table-column label="收款方式" width="90">
            <template #default="{ row }">{{ lookup(SOURCE_LIST, row.payMethod) }}</template>
          </el-table-column>
          <el-table-column prop="payAccount" label="账号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="serialNumber" label="流水号" width="110" />
          <el-table-column prop="currencyName" label="货币" width="70" />
          <el-table-column prop="amount" label="金额" width="100" align="right" />
          <el-table-column label="对账状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.ifChecking === 1 ? 'success' : 'info'">{{ row.ifChecking === 1 ? '已对账' : '未对账' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 右表：银行数据 -->
      <div class="check-tables__col">
        <div class="check-tables__title">银行数据</div>
        <el-table ref="rightTableRef" :data="rightRows" border size="small" height="420" row-key="id" @selection-change="rows => rightSel = rows">
          <el-table-column type="selection" width="45" reserve-selection />
          <el-table-column prop="payDate" label="交易日期" width="110" />
          <el-table-column prop="custName" label="对方户名" min-width="120" show-overflow-tooltip />
          <el-table-column prop="payAccount" label="账号" min-width="120" show-overflow-tooltip />
          <el-table-column prop="serialNumber" label="流水号" width="110" />
          <el-table-column prop="currencyName" label="货币" width="70" />
          <el-table-column prop="amount" label="金额" width="100" align="right" />
          <el-table-column label="对账状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.ifChecking === 1 ? 'success' : 'info'">{{ row.ifChecking === 1 ? '已对账' : '未对账' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </PageCard>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import { checkApi, checkBillApi, CHECK_TYPE_LIST, CLOSE_LIST, SOURCE_LIST, lookup } from '@/api/modules/financial'

const props = defineProps({
  rowId: { type: [Number, String], default: null }
})
defineEmits(['back'])

const header = reactive({ fisCalName: '', type: '', ifClose: 0 })
const leftRows = ref([])
const rightRows = ref([])
const leftTableRef = ref(null)
const rightTableRef = ref(null)
let leftSel = []
let rightSel = []

const sumAmount = rows => Number(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0).toFixed(2))
const checkedCount = computed(() => leftRows.value.filter(r => r.ifChecking === 1).length + rightRows.value.filter(r => r.ifChecking === 1).length)
const uncheckedCount = computed(() => leftRows.value.filter(r => r.ifChecking !== 1).length + rightRows.value.filter(r => r.ifChecking !== 1).length)
const leftTotal = computed(() => sumAmount(leftRows.value))
const rightTotal = computed(() => sumAmount(rightRows.value))
const diffAmount = computed(() => Number((leftTotal.value - rightTotal.value).toFixed(2)))

onMounted(async () => {
  if (props.rowId == null) return
  const res = await checkApi.res.get(props.rowId)
  if (res.data) Object.assign(header, { fisCalName: res.data.fisCalName, type: res.data.type, ifClose: res.data.ifClose })
  const left = (await checkBillApi.res.query(o => o.checkId === Number(props.rowId) && o.side === 'L', { page: 1, size: 100 })).data.list
  const right = (await checkBillApi.res.query(o => o.checkId === Number(props.rowId) && o.side === 'R', { page: 1, size: 100 })).data.list
  // 兜底：无匹配 checkId 时取前 8 条对应 side 数据，保证 demo 有数据
  leftRows.value = left.length ? left : (await checkBillApi.res.query(o => o.side === 'L', { page: 1, size: 8 })).data.list
  rightRows.value = right.length ? right : (await checkBillApi.res.query(o => o.side === 'R', { page: 1, size: 8 })).data.list
})

// 持久化对账状态
const persist = row => { checkBillApi.res.update(row.id, { ifChecking: row.ifChecking }) }

// 导入桩：源页为文件导入，无后端
const onImport = () => ElMessage.success('导入成功')

// 自动对账：每个左表行找一条金额+货币一致且未对账的右表行，双方置 ifChecking=1
const autoReconcile = () => {
  let n = 0
  const usedRight = new Set()
  leftRows.value.forEach(l => {
    if (l.ifChecking === 1) return
    const r = rightRows.value.find(x => x.ifChecking !== 1 && !usedRight.has(x.id) && Number(x.amount) === Number(l.amount) && x.currencyId === l.currencyId)
    if (r) {
      l.ifChecking = 1; r.ifChecking = 1
      usedRight.add(r.id)
      persist(l); persist(r)
      n++
    }
  })
  ElMessage.success(`已自动对账 ${n} 笔`)
}

// 勾选配对对账（替代源页拖拽）：左右选中数量相等且金额合计相等时置为已对账
const pairReconcile = () => {
  if (!leftSel.length || !rightSel.length) return ElMessage.warning('请在左右两表分别勾选要对账的记录')
  if (leftSel.length !== rightSel.length) return ElMessage.warning('左右两表勾选笔数需一致')
  if (sumAmount(leftSel) !== sumAmount(rightSel)) return ElMessage.warning('左右两表勾选金额合计不一致')
  leftSel.forEach(r => { r.ifChecking = 1; persist(r) })
  rightSel.forEach(r => { r.ifChecking = 1; persist(r) })
  ElMessage.success(`已对账 ${leftSel.length} 笔`)
  leftTableRef.value?.clearSelection()
  rightTableRef.value?.clearSelection()
}

// 取消对账：清除选中行的对账状态
const cancelReconcile = () => {
  const sel = [...leftSel, ...rightSel]
  if (!sel.length) return ElMessage.warning('请勾选要取消对账的记录')
  sel.forEach(r => { r.ifChecking = 0; persist(r) })
  ElMessage.success('已取消对账')
  leftTableRef.value?.clearSelection()
  rightTableRef.value?.clearSelection()
}
</script>

<style scoped lang="scss">
.fin-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  &__title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500; color: $text-primary; }
}
.check-stat { display: flex; flex-wrap: wrap; gap: 24px; padding: 12px 16px; margin-bottom: 12px;
  background: $bg-hover; border-radius: $radius-base;
  &__item { display: flex; align-items: center; gap: 6px; }
  &__label { font-size: $font-sm; color: $text-secondary; }
  &__val { font-size: $font-sm; font-weight: 500; color: $text-primary;
    &.is-diff { color: $danger-color; } }
}
.check-ops { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
.check-tables { display: flex; gap: 16px;
  &__col { flex: 1; width: 50%; min-width: 0; }
  &__title { font-size: 14px; font-weight: 500; color: $text-primary; margin-bottom: 8px; }
}
</style>
