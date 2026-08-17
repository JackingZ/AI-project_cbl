<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>开票信息</span>
        <el-tag v-if="!isOnce" size="small" :type="statusTag(form.status)">{{ lookup(INV_STATUS_LIST, form.status) }}</el-tag>
      </div>
      <div>
        <el-button v-if="!isView" type="primary" @click="submit">{{ isOnce ? '提交' : '重新提交' }}</el-button>
        <el-button v-else @click="handleExport">导出</el-button>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" :disabled="isView" class="fin-form">
      <el-form-item label="客户" prop="clientName">
        <el-input v-model="form.clientName" readonly placeholder="请选择">
          <template v-if="!isView" #append><el-button :icon="Search" @click="openCustomer" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="服务类型" prop="serviceTypeId">
        <el-select v-model="form.serviceTypeId" placeholder="请选择" style="width: 100%">
          <el-option v-for="s in SERVICE_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="开票日期" prop="invDate">
        <el-date-picker v-model="form.invDate" type="date" value-format="YYYY-MM-DD" placeholder="请选择" style="width: 100%" />
      </el-form-item>
      <el-form-item v-if="isView" label="审核时间"><el-input v-model="form.auditTime" readonly /></el-form-item>
      <el-form-item label="是否税务开票" prop="ifBill">
        <el-radio-group v-model="form.ifBill">
          <el-radio value="0">否</el-radio>
          <el-radio value="1">是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" class="fin-form__full">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <!-- 明细行：全部/已选择 模式 -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <el-radio-group v-if="!isView" v-model="mode" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="selected">已选择</el-radio-button>
        </el-radio-group>
        <span v-if="mode === 'selected' || isView" class="fin-sub__title">
          本币总金额：{{ selfTotal }}
          <span v-for="a in amountList" :key="a.cur" style="margin-left: 12px">{{ a.cur }}: {{ a.amount }}</span>
        </span>
      </div>

      <!-- 全部模式：可勾选发票 -->
      <el-table v-if="mode === 'all' && !isView" :data="allInvoices" border size="small" height="360" row-key="id" @selection-change="onSelect">
        <el-table-column type="selection" width="45" reserve-selection />
        <el-table-column label="原单号" min-width="120">
          <template #default="{ row }">{{ ['02','06'].includes(row.businessType) ? (row.soNoList || row.billNoList) : row.orderCode }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90"><template #default="{ row }">{{ lookup(INV_STATUS_LIST, row.status) }}</template></el-table-column>
        <el-table-column label="核销状态" width="90"><template #default="{ row }">{{ row.ifVerify === '1' ? '已核销' : '未核销' }}</template></el-table-column>
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="clientName" label="客户名称" min-width="120" />
        <el-table-column label="客户属性" width="100"><template #default="{ row }">{{ clientProperty(row.clientType, row.clientSubtype) }}</template></el-table-column>
        <el-table-column label="货币" width="80"><template #default="{ row }">{{ row.currencyId }}</template></el-table-column>
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="selfAmount" label="本币金额" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
      </el-table>

      <!-- 已选择模式 / 查看 -->
      <el-table v-else :data="selectedInvoices" border size="small">
        <el-table-column label="原单号" min-width="120">
          <template #default="{ row }">{{ ['02','06'].includes(row.businessType) ? (row.soNoList || row.billNoList) : row.orderCode }}</template>
        </el-table-column>
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="clientName" label="客户名称" min-width="120" />
        <el-table-column label="货币" width="80"><template #default="{ row }">{{ row.currencyId }}</template></el-table-column>
        <el-table-column prop="amount" label="金额" width="100" />
        <el-table-column prop="selfAmount" label="本币金额" width="100" />
        <el-table-column v-if="!isView" label="操作" width="70" fixed="right">
          <template #default="{ row }"><el-button link type="danger" size="small" @click="unselect(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 选择客户 -->
    <Modal v-model="custDlg.visible" title="选择客户" width="720px" @confirm="confirmCustomer">
      <SearchBar :model="custDlg.query" @search="loadCustomers" @reset="() => { custDlg.query.name = ''; loadCustomers() }">
        <el-form-item label="名称"><el-input v-model="custDlg.query.name" placeholder="请输入名称" clearable style="width: 180px" /></el-form-item>
      </SearchBar>
      <el-table :data="custDlg.list" border height="340" @current-change="r => custDlg.picked = r" highlight-current-row>
        <el-table-column width="50"><template #default="{ row }"><el-radio :model-value="custDlg.picked?.id" :value="row.id" @change="custDlg.picked = row"><span></span></el-radio></template></el-table-column>
        <el-table-column prop="name" label="客户名称" min-width="180" />
        <el-table-column prop="subtype" label="属性" width="100" />
      </el-table>
    </Modal>
  </PageCard>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import { required } from '@/utils/validate'
import { outInvoiceApi, invoiceApi, INV_STATUS_LIST, SERVICE_LIST, lookup, clientProperty, countNum } from '@/api/modules/financial'
import { getCustomerList } from '@/api/modules/organizers'

const props = defineProps({ mode: { type: String, default: 'add' }, rowId: { type: [Number, String], default: null } })
const emit = defineEmits(['back', 'saved'])
const isOnce = props.mode === 'add'
const isView = props.mode === 'view'
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')

const formRef = ref(null)
const mode = ref('all')
const defaultForm = () => ({ id: null, clientName: '', clientId: null, serviceTypeId: '', invDate: '', ifBill: '0', remark: '', status: '0', auditTime: '', invoiceIds: [] })
const form = reactive(defaultForm())
const rules = { clientName: [required('请选择客户')], serviceTypeId: [required('请选择服务类型', 'change')], invDate: [required('请选择开票日期', 'change')] }

const allInvoices = ref([])
const selected = ref([])
const selectedInvoices = computed(() => selected.value)
const onSelect = rows => { selected.value = rows }
const unselect = row => { selected.value = selected.value.filter(r => r.id !== row.id) }
const selfTotal = computed(() => Number(selected.value.reduce((s, r) => s + (r.selfAmount || 0), 0).toFixed(2)))
const amountList = computed(() => {
  const map = {}
  selected.value.forEach(r => { map[r.currencyId] = Number(((map[r.currencyId] || 0) + (r.amount || 0)).toFixed(2)) })
  return Object.entries(map).map(([cur, amount]) => ({ cur, amount }))
})

onMounted(async () => {
  allInvoices.value = (await invoiceApi.listRecv({ page: 1, size: 100 })).data.list
  if (!isOnce && props.rowId != null) {
    const res = await outInvoiceApi.res.get(props.rowId)
    if (res.data) {
      Object.assign(form, { ...res.data })
      mode.value = 'selected'
      selected.value = allInvoices.value.filter(r => (res.data.invoiceIds || []).includes(r.id))
    }
  }
})

const custDlg = reactive({ visible: false, query: { name: '' }, list: [], picked: null })
const loadCustomers = async () => { custDlg.list = (await getCustomerList({ name: custDlg.query.name, page: 1, size: 50 })).data.list }
const openCustomer = () => { custDlg.visible = true; custDlg.picked = null; loadCustomers() }
const confirmCustomer = () => { if (!custDlg.picked) return ElMessage.warning('请选择一条记录'); form.clientName = custDlg.picked.name; form.clientId = custDlg.picked.id; custDlg.visible = false }

const submit = async () => {
  await formRef.value.validate()
  if (!selected.value.length) return ElMessage.warning('请选择发票')
  // 税务开票不能选择多个币种
  if (form.ifBill === '1' && new Set(selected.value.map(r => r.currencyId)).size > 1) return ElMessage.warning('税务开票不能选择多个币种')
  const payload = { ...form, invoiceIds: selected.value.map(r => r.id), amount: selfTotal.value, currencyId: selected.value[0]?.currencyId, currencyName: selected.value[0]?.currencyName }
  if (isOnce) await outInvoiceApi.add(payload)
  else await outInvoiceApi.update(form.id, payload)
  ElMessage.success('提交成功')
  emit('saved')
}
const handleExport = () => ElMessage.success('已导出')
</script>

<style scoped lang="scss">
.fin-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  &__title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500; color: $text-primary; } }
.fin-form { display: flex; flex-wrap: wrap; :deep(.el-form-item) { width: 50%; } &__full { width: 100% !important; } }
.fin-sub { margin-top: 12px; &__bar { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
  &__title { font-size: 13px; color: $text-secondary; } }
</style>
