<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>付款单</span>
        <span v-if="!isOnce" class="fin-detail-head__code">编号：{{ form.id }}</span>
        <el-tag v-if="!isOnce" size="small" :type="statusTag(form.status)">{{ lookup(INV_STATUS_LIST, form.status) }}</el-tag>
      </div>
      <div>
        <el-button v-if="!isView" type="primary" @click="submit">{{ isOnce ? '提交' : '重新提交' }}</el-button>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :disabled="isView" class="fin-form">
      <el-form-item v-if="!isOnce" label="付款单号">
        <el-input v-model="form.id" disabled />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" disabled placeholder="请选择" style="width: 100%">
          <el-option v-for="s in INV_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户" prop="custId">
        <el-input v-model="form.custName" readonly placeholder="请选择">
          <template v-if="isOnce" #append><el-button :icon="Search" @click="openCustomer" /></template>
        </el-input>
      </el-form-item>
      <el-form-item label="付款流水号" prop="serialNumber">
        <el-input v-model="form.serialNumber" placeholder="请输入付款流水号" />
      </el-form-item>
      <el-form-item label="付款类型" prop="payType">
        <el-select v-model="form.payType" placeholder="请选择" style="width: 100%">
          <el-option v-for="c in CATEGORY_LIST" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="付款方式" prop="payMethod">
        <el-select v-model="form.payMethod" placeholder="请选择" style="width: 100%">
          <el-option v-for="s in SOURCE_LIST" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="付款日期" prop="payTime">
        <el-date-picker v-model="form.payTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="请选择" style="width: 100%" />
      </el-form-item>
      <el-form-item label="货币" prop="currencyId">
        <el-select v-model="form.currencyId" filterable placeholder="请选择" style="width: 100%" @change="onCurrency">
          <el-option v-for="c in currencyOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="汇率" prop="exRate">
        <el-input-number v-model="form.exRate" :min="0" :max="9999" :precision="4" :controls="false" style="width: 100%" />
      </el-form-item>
      <el-form-item label="付款金额" prop="payAmount">
        <el-input-number v-model="form.payAmount" :min="0" :precision="2" :controls="false" style="width: 100%" @change="onAmount" />
      </el-form-item>
      <el-form-item label="本币金额" prop="selfAmount">
        <el-input-number v-model="form.selfAmount" :precision="2" :controls="false" disabled style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注" class="fin-form__full">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <!-- 冲销明细（请款申请单） -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <span class="fin-sub__title">冲销明细（总计请款金额：{{ totalRequestAmount }}）</span>
        <el-button v-if="!isView" type="primary" size="small" @click="openRequest">选择请款申请单</el-button>
      </div>
      <el-table :data="requestList" border size="small">
        <el-table-column type="index" label="行号" width="60" />
        <el-table-column prop="id" label="请款申请单号" min-width="130" />
        <el-table-column prop="applyTime" label="请款日期" width="160" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="payAmount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="120" />
        <el-table-column v-if="!isView" label="操作" width="80" fixed="right">
          <template #default="{ row }"><el-button link type="danger" size="small" @click="delRequest(row)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 关联发票 -->
    <div class="fin-sub">
      <div class="fin-sub__bar">
        <span class="fin-sub__title">关联发票（总计发票金额：{{ totalInvoiceAmount }}）</span>
        <el-button v-if="!isView" type="primary" size="small" @click="openInvoice">选择发票</el-button>
      </div>
      <el-table :data="invoiceList" border size="small">
        <el-table-column type="index" label="行号" width="60" />
        <el-table-column prop="code" label="发票编号" min-width="130" />
        <el-table-column prop="orderCode" label="原单号" min-width="130" />
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="auditTime" label="审核时间" width="160" />
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="120" />
        <el-table-column v-if="!isView" label="操作" width="80" fixed="right">
          <template #default="{ row }"><el-button link type="danger" size="small" @click="delInvoice(row)">删除</el-button></template>
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
        <el-table-column prop="name" label="客户名称" min-width="180" />
        <el-table-column label="属性" width="120"><template #default="{ row }">{{ clientProperty(row.type, row.subtype) }}</template></el-table-column>
        <el-table-column prop="parentName" label="所属上级" min-width="140"><template #default="{ row }">{{ row.parentName || '--' }}</template></el-table-column>
      </el-table>
    </Modal>

    <!-- 选择请款申请单 -->
    <Modal v-model="reqDlg.visible" title="选择请款申请单" width="960px" @confirm="confirmRequest">
      <el-table :data="reqDlg.list" border height="380" @selection-change="r => reqDlg.picked = r">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="请款申请单号" min-width="130" />
        <el-table-column prop="applyTime" label="请款日期" width="160" />
        <el-table-column prop="custName" label="客户名称" min-width="130" />
        <el-table-column label="来源" width="110"><template #default="{ row }">{{ lookup(SOURCE_LIST, row.payMethod) }}</template></el-table-column>
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="payAmount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="120" />
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="reqDlg.total" :current-page="reqDlg.page" :page-size="10" @current-change="p => { reqDlg.page = p; loadRequests() }" />
        <div style="margin-top: 8px">
          <el-button @click="reqDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmRequest">确定</el-button>
        </div>
      </template>
    </Modal>

    <!-- 选择发票 -->
    <Modal v-model="invDlg.visible" title="选择发票" width="960px" @confirm="confirmInvoice">
      <SearchBar :model="invDlg.query" @search="loadInvoices" @reset="resetInvoices">
        <el-form-item>
          <el-input v-model="invDlg.query.keyWord" placeholder="请输入" clearable style="width: 260px">
            <template #prepend>
              <el-select v-model="invDlg.query.selectType" style="width: 100px">
                <el-option label="原单号" value="1" /><el-option label="提单号" value="4" />
                <el-option label="SO号" value="5" /><el-option label="柜号" value="6" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
      </SearchBar>
      <el-table :data="invDlg.list" border height="380" @selection-change="r => invDlg.picked = r">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="orderCode" label="原单号" min-width="130" />
        <el-table-column prop="invDate" label="发票日期" width="160" />
        <el-table-column prop="auditTime" label="审核时间" width="160" />
        <el-table-column prop="currencyName" label="货币" width="90" />
        <el-table-column prop="exRate" label="汇率" width="90" />
        <el-table-column prop="amount" label="金额" width="110" />
        <el-table-column prop="selfAmount" label="本币金额" width="120" />
      </el-table>
      <template #footer>
        <el-pagination layout="prev, pager, next" :total="invDlg.total" :current-page="invDlg.page" :page-size="10" @current-change="p => { invDlg.page = p; loadInvoices() }" />
        <div style="margin-top: 8px">
          <el-button @click="invDlg.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmInvoice">确定</el-button>
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
  paymentApi, INV_STATUS_LIST, CATEGORY_LIST, SOURCE_LIST,
  getCurrencyOptions, getExRateValue, getSelectableOrders, getApprovedRequests,
  lookup, clientProperty, countNum
} from '@/api/modules/financial'
import { getSupplierList } from '@/api/modules/organizers'

const props = defineProps({
  mode: { type: String, default: 'add' },   // add | edit | view
  rowId: { type: [Number, String], default: null }
})
const emit = defineEmits(['back', 'saved'])

const isOnce = props.mode === 'add'
const isView = props.mode === 'view'
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')

const formRef = ref(null)
const currencyOptions = ref([])
const defaultForm = () => ({
  id: null, status: '0', custId: null, custName: '', custType: '', custSubtype: '',
  serialNumber: '', payType: '', payMethod: '', payTime: '', currencyId: '', currencyName: '', exRate: undefined,
  payAmount: undefined, selfAmount: undefined, remark: '', tableData1: [], tableData2: []
})
const form = reactive(defaultForm())
const rules = {
  status: [required('请选择状态', 'change')],
  custId: [required('请选择客户', 'change')],
  serialNumber: [noChineseRule('付款流水号不能包含中文')],
  payType: [required('请选择付款类型', 'change')],
  payMethod: [required('请选择付款方式', 'change')],
  payTime: [required('请选择付款日期', 'change')],
  currencyId: [required('请选择货币', 'change')],
  exRate: [required('请输入汇率', 'change')],
  payAmount: [required('请输入付款金额', 'change')],
  selfAmount: [required('请输入本币金额', 'change')]
}

// 冲销明细（请款申请单）+ 关联发票，过滤软删除 tag==='X'
const requestList = computed(() => form.tableData1.filter(i => i.tag !== 'X'))
const invoiceList = computed(() => form.tableData2.filter(i => i.tag !== 'X'))
const totalRequestAmount = computed(() => Number(requestList.value.reduce((s, i) => s + (Number(i.selfAmount) || 0), 0).toFixed(2)))
const totalInvoiceAmount = computed(() => Number(invoiceList.value.reduce((s, i) => s + (Number(i.selfAmount) || 0), 0).toFixed(2)))

onMounted(async () => {
  currencyOptions.value = (await getCurrencyOptions()).data
  if (!isOnce && props.rowId != null) {
    const res = await paymentApi.res.get(props.rowId)
    if (res.data) Object.assign(form, JSON.parse(JSON.stringify(res.data)))
  }
})

const onCurrency = async v => {
  form.exRate = (await getExRateValue(v)).data
  form.currencyName = (currencyOptions.value.find(c => c.id === v) || {}).name || ''
  form.selfAmount = countNum(form.payAmount, form.exRate)
}
const onAmount = () => { form.selfAmount = countNum(form.payAmount, form.exRate) }

/* 选择客户 */
const custDlg = reactive({ visible: false, query: { name: '' }, list: [], picked: null })
const loadCustomers = async () => {
  custDlg.list = (await getSupplierList({ name: custDlg.query.name, page: 1, size: 50 })).data.list
}
const resetCustomers = () => { custDlg.query.name = ''; loadCustomers() }
const openCustomer = () => { custDlg.visible = true; custDlg.picked = null; loadCustomers() }
const confirmCustomer = () => {
  if (!custDlg.picked) return ElMessage.warning('请选择一条记录')
  form.custName = custDlg.picked.name
  form.custId = custDlg.picked.id
  form.custType = custDlg.picked.type
  form.custSubtype = custDlg.picked.subtype
  custDlg.visible = false
}

/* 选择请款申请单 */
const reqDlg = reactive({ visible: false, list: [], picked: [], page: 1, total: 0 })
const loadRequests = async () => {
  const res = await getApprovedRequests({ page: reqDlg.page, size: 10 })
  reqDlg.list = res.data.list
  reqDlg.total = res.data.total
}
const openRequest = () => { reqDlg.visible = true; reqDlg.picked = []; reqDlg.page = 1; loadRequests() }
const confirmRequest = () => {
  if (!reqDlg.picked.length) return ElMessage.warning('请选择一条记录')
  reqDlg.picked.forEach(o => {
    if (form.tableData1.some(i => i.tag !== 'X' && i.id === o.id)) return
    form.tableData1.push({
      id: o.id, applyTime: o.applyTime, remark: o.remark || '', currencyName: o.currencyName, currencyId: o.currencyId,
      exRate: o.exRate, payAmount: o.payAmount, selfAmount: o.selfAmount, tag: ''
    })
  })
  reqDlg.visible = false
}
const delRequest = row => {
  const idx = form.tableData1.findIndex(i => i === row)
  if (idx < 0) return
  if (form.tableData1[idx].dbTag) form.tableData1[idx].tag = 'X'
  else form.tableData1.splice(idx, 1)
}

/* 选择发票 */
const invDlg = reactive({ visible: false, query: { keyWord: '', selectType: '1' }, list: [], picked: [], page: 1, total: 0 })
const loadInvoices = async () => {
  const res = await getSelectableOrders({ page: invDlg.page, size: 10 })
  let rows = res.data.list
  // vxe 不可用，客户端过滤 keyWord
  if (invDlg.query.keyWord) {
    const map = { 1: 'orderCode', 4: 'billNoList', 5: 'soNoList', 6: 'containerNoList' }
    const field = map[invDlg.query.selectType] || 'orderCode'
    rows = rows.filter(r => String(r[field] ?? '').includes(invDlg.query.keyWord))
  }
  invDlg.list = rows
  invDlg.total = res.data.total
}
const resetInvoices = () => { invDlg.query.keyWord = ''; invDlg.query.selectType = '1'; invDlg.page = 1; loadInvoices() }
const openInvoice = () => { invDlg.visible = true; invDlg.picked = []; invDlg.page = 1; loadInvoices() }
const confirmInvoice = () => {
  if (!invDlg.picked.length) return ElMessage.warning('请选择一条记录')
  invDlg.picked.forEach(o => {
    if (form.tableData2.some(i => i.tag !== 'X' && i.id === o.id)) return
    form.tableData2.push({
      id: o.id, code: o.code || `FP${o.id}`, orderCode: o.orderCode, invDate: o.invDate,
      auditTime: o.auditTime, remark: '', currencyName: o.currencyName, currencyId: o.currencyId,
      exRate: o.exRate, amount: o.amount, selfAmount: o.selfAmount, tag: ''
    })
  })
  invDlg.visible = false
}
const delInvoice = row => {
  const idx = form.tableData2.findIndex(i => i === row)
  if (idx < 0) return
  if (form.tableData2[idx].dbTag) form.tableData2[idx].tag = 'X'
  else form.tableData2.splice(idx, 1)
}

const submit = async () => {
  await formRef.value.validate()
  if (!requestList.value.length && !invoiceList.value.length) return ElMessage.warning('请至少选择一条请款申请单或发票')
  const payload = {
    ...JSON.parse(JSON.stringify(form)),
    tableData1: form.tableData1.filter(i => i.tag !== 'X'),
    tableData2: form.tableData2.filter(i => i.tag !== 'X')
  }
  if (isOnce) { payload.status = '0'; await paymentApi.add(payload) }
  else await paymentApi.update(form.id, payload)
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
