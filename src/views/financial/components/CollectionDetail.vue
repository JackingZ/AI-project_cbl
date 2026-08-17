<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>收款单</span>
        <span v-if="!isOnce" class="fin-detail-head__code">编号：{{ form.id }}</span>
        <el-checkbox v-model="form.ifOut" :true-value="1" :false-value="0" :disabled="isView">开票</el-checkbox>
      </div>
      <div>
        <el-button v-if="!isView" type="primary" @click="submit">{{ isOnce ? '提交' : '重新提交' }}</el-button>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isView" class="fin-form">
      <el-form-item v-if="!isOnce" label="收款单号">
        <el-input v-model="form.id" disabled />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" disabled placeholder="请选择" style="width: 100%">
          <el-option v-for="s in RECEIVE_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-input v-model="form.custName" readonly placeholder="请选择">
          <template v-if="!isView" #append><el-button :icon="Search" @click="openCustomer" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="收款流水号" prop="serialNumber">
        <el-input v-model="form.serialNumber" placeholder="请输入" />
      </el-form-item>
      <el-form-item label="账号" prop="payAccount">
        <el-input v-model="form.payAccount" readonly placeholder="请选择">
          <template v-if="!isView" #append><el-button :icon="Search" @click="openAccount" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="收款方式" prop="payMethod">
        <el-select v-model="form.payMethod" disabled placeholder="请选择" style="width: 100%">
          <el-option v-for="s in SOURCE_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <!-- 源页 收款类型 payType v-if=false，保持隐藏 -->
      <!-- <el-form-item label="收款类型" prop="payType">
        <el-select v-model="form.payType" placeholder="请选择" style="width: 100%">
          <el-option v-for="c in CATEGORY_LIST" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item> -->
      <el-form-item label="回款日期" prop="payDate">
        <el-date-picker v-model="form.payDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择" style="width: 100%" />
      </el-form-item>
      <el-form-item label="货币" prop="currencyId">
        <el-select v-model="form.currencyId" placeholder="请选择" style="width: 100%" @change="onCurrency">
          <el-option v-for="c in currencyOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="汇率" prop="exRate">
        <el-input-number v-model="form.exRate" :min="0" :precision="4" :controls="false" style="width: 100%" />
      </el-form-item>
      <el-form-item label="回款金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" @change="calcSelf" />
      </el-form-item>
      <el-form-item label="本币金额" prop="selfAmount">
        <el-input-number v-model="form.selfAmount" :precision="2" :controls="false" disabled style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注" class="fin-form__full">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <!-- 关联回款 -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <span class="fin-sub__title">关联回款</span>
        <el-button v-if="!isView" type="primary" size="small" @click="openRelation">选择回款</el-button>
      </div>
      <el-table :data="relationRows" border size="small">
        <el-table-column prop="id" label="回款单号" width="110" />
        <el-table-column prop="payDate" label="回款日期" width="160" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="surplus" label="回款本币结余" width="120" />
        <el-table-column v-if="!isView" label="操作" width="80" fixed="right">
          <template #default="{ row }"><el-button link type="danger" size="small" @click="delRelation(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 核销发票 -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <span class="fin-sub__title">核销发票</span>
        <div v-if="!isView">
          <el-button type="primary" size="small" @click="openOutInvoice">选择开票</el-button>
          <el-button type="primary" size="small" @click="openOrder">选择发票</el-button>
        </div>
      </div>
      <el-table :data="writeoffRows" border size="small">
        <el-table-column prop="code" label="发票编号" width="130" />
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="auditTime" label="审核时间" width="160" />
        <el-table-column prop="orderCode" label="原单号" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="110" />
        <el-table-column v-if="!isView" label="操作" width="80" fixed="right">
          <template #default="{ row }"><el-button link type="danger" size="small" @click="delWriteoff(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 选择客户 -->
    <Modal v-model="custDlg.visible" title="选择客户" width="760px" @confirm="confirmCustomer">
      <SearchBar :model="custDlg.query" @search="loadCustomers" @reset="resetCustomers">
        <el-form-item label="名称"><el-input v-model="custDlg.query.name" placeholder="请输入名称" clearable style="width: 180px" /></el-form-item>
      </SearchBar>
      <el-table :data="custDlg.list" border height="360" highlight-current-row @current-change="r => custDlg.picked = r">
        <el-table-column width="50">
          <template #default="{ row }"><el-radio :model-value="custDlg.picked?.id" :value="row.id" @change="custDlg.picked = row"><span></span></el-radio></template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="subtype" label="属性" width="120"><template #default="{ row }">{{ row.subtype || '--' }}</template></el-table-column>
        <el-table-column prop="parentName" label="所属上级" min-width="140"><template #default="{ row }">{{ row.parentName || '--' }}</template></el-table-column>
      </el-table>
    </Modal>

    <!-- 选择账号 -->
    <Modal v-model="acctDlg.visible" title="选择账号" width="820px" @confirm="confirmAccount">
      <el-table :data="acctDlg.list" border height="360" highlight-current-row @current-change="r => acctDlg.picked = r">
        <el-table-column width="50">
          <template #default="{ row }"><el-radio :model-value="acctDlg.picked?.id" :value="row.id" @change="acctDlg.picked = row"><span></span></el-radio></template>
        </el-table-column>
        <el-table-column prop="acctName" label="账户名称" min-width="160" />
        <el-table-column prop="acctNo" label="账号" width="150" />
        <el-table-column label="收款方式" width="100"><template #default="{ row }">{{ lookup(SOURCE_LIST, row.type) }}</template></el-table-column>
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="countryName" label="国家" width="90" />
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="acctDlg.total" :current-page="acctDlg.page" :page-size="10" @current-change="p => { acctDlg.page = p; loadAccounts() }" />
        <div style="margin-top: 8px">
          <el-button @click="acctDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmAccount">确定</el-button>
        </div>
      </template>
    </Modal>

    <!-- 选择回款（多选） -->
    <Modal v-model="relDlg.visible" title="选择回款" width="860px" @confirm="confirmRelation">
      <el-table :data="relDlg.list" border height="380" @selection-change="r => relDlg.picked = r">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="回款单号" width="110" />
        <el-table-column prop="payDate" label="回款日期" width="160" />
        <el-table-column prop="custName" label="客户名称" min-width="130" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="surplus" label="回款本币结余" width="120" />
      </el-table>
    </Modal>

    <!-- 选择开票（多选） -->
    <Modal v-model="outDlg.visible" title="选择开票" width="860px" @confirm="confirmOutInvoice">
      <el-table :data="outDlg.list" border height="380" @selection-change="r => outDlg.picked = r">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="code" label="发票编号" width="130" />
        <el-table-column prop="clientName" label="客户名称" min-width="130" />
        <el-table-column prop="invDate" label="发票日期" width="120" />
        <el-table-column label="状态" width="90"><template #default="{ row }">{{ lookup(INV_STATUS_LIST, row.status) }}</template></el-table-column>
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column label="是否开票" width="90"><template #default="{ row }">{{ row.ifBill === '1' ? '是' : '否' }}</template></el-table-column>
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="outDlg.total" :current-page="outDlg.page" :page-size="10" @current-change="p => { outDlg.page = p; loadOutInvoices() }" />
        <div style="margin-top: 8px">
          <el-button @click="outDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmOutInvoice">确定</el-button>
        </div>
      </template>
    </Modal>

    <!-- 选择发票（多选） -->
    <Modal v-model="orderDlg.visible" title="选择发票" width="960px" @confirm="confirmOrder">
      <el-table :data="orderDlg.list" border height="380" @selection-change="r => orderDlg.picked = r">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="orderCode" label="原单号" min-width="130" />
        <el-table-column prop="clientName" label="客户名称" min-width="130" />
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="auditTime" label="审核时间" width="160" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="110" />
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="orderDlg.total" :current-page="orderDlg.page" :page-size="10" @current-change="p => { orderDlg.page = p; loadOrders() }" />
        <div style="margin-top: 8px">
          <el-button @click="orderDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmOrder">确定</el-button>
        </div>
      </template>
    </Modal>
  </PageCard>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import { required, noChineseRule } from '@/utils/validate'
import {
  receiveApi, outInvoiceApi, RECEIVE_STATUS_LIST, SOURCE_LIST, INV_STATUS_LIST,
  getCurrencyOptions, getExRateValue, getBankAccounts, getSelectableOrders,
  lookup, countNum
} from '@/api/modules/financial'
import { getCustomerList } from '@/api/modules/organizers'

const props = defineProps({
  mode: { type: String, default: 'add' },   // add | edit | view
  rowId: { type: [Number, String], default: null }
})
const emit = defineEmits(['back', 'saved'])

const isOnce = props.mode === 'add'
const isView = props.mode === 'view'

const formRef = ref(null)
const currencyOptions = ref([])
const defaultForm = () => ({
  id: null, status: 0, checked: 0, ifChecking: 0, ifOut: 0,
  custId: null, custName: '', custType: '', custSubtype: '',
  serialNumber: '', payAccount: '', payMethod: '', payType: '',
  payDate: '', currencyId: '', currencyName: '', exRate: undefined,
  amount: undefined, selfAmount: undefined, surplus: '', remark: '',
  relationList: [], writeoffList: []
})
const form = reactive(defaultForm())

const rules = {
  status: [required('请选择状态', 'change')],
  custId: [required('请选择客户', 'change')],
  serialNumber: [noChineseRule('不能输入中文')],
  payAccount: [required('请选择账号', 'change')],
  payMethod: [required('请选择收款方式', 'change')],
  payDate: [required('请选择回款日期', 'change')],
  currencyId: [required('请选择货币', 'change')],
  exRate: [required('请输入汇率', 'change')],
  amount: [required('请输入回款金额', 'change')],
  selfAmount: [required('请输入本币金额', 'change')]
}

const relationRows = computed(() => form.relationList.filter(r => r.tag !== 'X'))
const writeoffRows = computed(() => form.writeoffList.filter(r => r.tag !== 'X'))

onMounted(async () => {
  currencyOptions.value = (await getCurrencyOptions()).data
  if (!isOnce && props.rowId != null) {
    const res = await receiveApi.res.get(props.rowId)
    if (res.data) Object.assign(form, JSON.parse(JSON.stringify(res.data)))
  }
})

const onCurrency = async v => {
  form.exRate = (await getExRateValue(v)).data
  form.currencyName = (currencyOptions.value.find(c => c.id === v) || {}).name || ''
  calcSelf()
}
const calcSelf = () => { form.selfAmount = countNum(form.amount, form.exRate) }

/* 选择客户 */
const custDlg = reactive({ visible: false, query: { name: '' }, list: [], picked: null })
const loadCustomers = async () => { custDlg.list = (await getCustomerList({ name: custDlg.query.name, page: 1, size: 50 })).data.list }
const resetCustomers = () => { custDlg.query.name = ''; loadCustomers() }
const openCustomer = () => { custDlg.visible = true; custDlg.picked = null; loadCustomers() }
const confirmCustomer = () => {
  if (!custDlg.picked) return ElMessage.warning('请选择一条记录')
  form.custId = custDlg.picked.id
  form.custName = custDlg.picked.name
  form.custSubtype = custDlg.picked.subtype ?? ''
  custDlg.visible = false
}

/* 选择账号 */
const acctDlg = reactive({ visible: false, list: [], picked: null, page: 1, total: 0 })
const loadAccounts = async () => {
  const res = await getBankAccounts({ page: acctDlg.page, size: 10 })
  acctDlg.list = res.data.list; acctDlg.total = res.data.total
}
const openAccount = () => { acctDlg.visible = true; acctDlg.picked = null; acctDlg.page = 1; loadAccounts() }
const confirmAccount = () => {
  if (!acctDlg.picked) return ElMessage.warning('请选择一条记录')
  form.payAccount = acctDlg.picked.acctNo
  form.payMethod = acctDlg.picked.type
  acctDlg.visible = false
}

/* 选择回款（多选） */
const relDlg = reactive({ visible: false, list: [], picked: [] })
const openRelation = async () => {
  relDlg.visible = true; relDlg.picked = []
  const res = await receiveApi.list({ page: 1, size: 50 })
  relDlg.list = res.data.list.filter(o => String(o.id) !== String(form.id))
}
const confirmRelation = () => {
  if (!relDlg.picked.length) return ElMessage.warning('请选择记录')
  relDlg.picked.forEach(o => {
    if (form.relationList.some(r => r.tag !== 'X' && String(r.id) === String(o.id))) return
    form.relationList.push({ id: o.id, payDate: o.payDate, remark: o.remark, currencyName: o.currencyName, exRate: o.exRate, surplus: o.surplus })
  })
  relDlg.visible = false
}
const delRelation = row => { row.tag = 'X' }

/* 选择开票（多选） */
const outDlg = reactive({ visible: false, list: [], picked: [], page: 1, total: 0 })
const loadOutInvoices = async () => {
  const res = await outInvoiceApi.list({ page: outDlg.page, size: 10 })
  outDlg.list = res.data.list; outDlg.total = res.data.total
}
const openOutInvoice = () => { outDlg.visible = true; outDlg.picked = []; outDlg.page = 1; loadOutInvoices() }
const confirmOutInvoice = () => {
  if (!outDlg.picked.length) return ElMessage.warning('请选择记录')
  outDlg.picked.forEach(o => {
    if (form.writeoffList.some(r => r.tag !== 'X' && r.code === o.code)) return
    form.writeoffList.push({ code: o.code, invDate: o.invDate, auditTime: o.auditTime, orderCode: '', remark: o.remark, currencyName: o.currencyName, exRate: o.exRate ?? '', amount: o.amount, selfAmount: '' })
  })
  outDlg.visible = false
}

/* 选择发票（多选） */
const orderDlg = reactive({ visible: false, list: [], picked: [], page: 1, total: 0 })
const loadOrders = async () => {
  const res = await getSelectableOrders({ page: orderDlg.page, size: 10 })
  orderDlg.list = res.data.list; orderDlg.total = res.data.total
}
const openOrder = () => { orderDlg.visible = true; orderDlg.picked = []; orderDlg.page = 1; loadOrders() }
const confirmOrder = () => {
  if (!orderDlg.picked.length) return ElMessage.warning('请选择记录')
  orderDlg.picked.forEach(o => {
    if (form.writeoffList.some(r => r.tag !== 'X' && r.orderCode === o.orderCode && r.code === (o.code || ''))) return
    form.writeoffList.push({ code: o.code || '', invDate: o.invDate, auditTime: o.auditTime, orderCode: o.orderCode, remark: '', currencyName: o.currencyName, exRate: o.exRate, amount: o.amount, selfAmount: o.selfAmount })
  })
  orderDlg.visible = false
}
const delWriteoff = row => { row.tag = 'X' }

const submit = async () => {
  await formRef.value.validate()
  const payload = {
    ...JSON.parse(JSON.stringify(form)),
    relationList: form.relationList.filter(r => r.tag !== 'X'),
    writeoffList: form.writeoffList.filter(r => r.tag !== 'X')
  }
  if (isOnce) { payload.status = 0; payload.checked = 0; await receiveApi.add(payload) }
  else await receiveApi.update(form.id, payload)
  ElMessage.success('提交成功')
  emit('saved')
}
</script>

<style scoped lang="scss">
.fin-detail-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
  &__title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500; color: $text-primary; }
  &__code { font-size: 13px; color: $text-secondary; font-weight: 400; }
}
.fin-form { display: flex; flex-wrap: wrap; :deep(.el-form-item) { width: 50%; } &__full { width: 100% !important; } }
.fin-sub { margin-top: 12px; &__bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  &__title { font-size: 14px; font-weight: 500; color: $text-primary; } }
</style>
