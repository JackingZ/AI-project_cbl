<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="订单状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in ORDER_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="t in TRANSPORT_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 300px">
          <template #prepend>
            <el-select v-model="query.keyField" style="width: 110px">
              <el-option v-for="o in KEY_FIELDS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <template v-if="showMore">
        <el-form-item label="一级代理商">
          <el-select v-model="query.topAgent" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="a in TOP_AGENTS" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="query.orderType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="t in ORDER_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="公司类型">
          <el-select v-model="query.companyType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in COMPANY_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="query.companyName" placeholder="全部" clearable filterable style="width: 140px">
            <el-option v-for="n in COMPANY_NAMES" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的国家">
          <el-select v-model="query.destinationCountry" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="FBA仓库">
          <el-select v-model="query.fbaWarehouse" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="w in FBA_WAREHOUSES" :key="w" :label="w" :value="w" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务">
          <el-select v-model="query.serviceName" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="s in SERVICES" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库状态">
          <el-select v-model="query.inStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in IN_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="计量状态">
          <el-select v-model="query.measureStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in MEASURE_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="验货状态">
          <el-select v-model="query.inspectStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in INSPECT_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="报关状态">
          <el-select v-model="query.declareStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="s in DECLARE_STATUS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否发货">
          <el-select v-model="query.ifShip" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="s in SHIP_OPTIONS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="派送方式">
          <el-select v-model="query.deliverMethod" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="m in DELIVER_METHODS" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="报关方式">
          <el-select v-model="query.declareMethod" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="m in DECLARE_METHODS" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否冻结">
          <el-select v-model="query.frozen" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="s in YES_NO" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="query.dateRange" type="daterange" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
        </el-form-item>
      </template>
      <template #actions>
        <el-button link type="primary" @click="showMore = !showMore">{{ showMore ? '收起筛选' : '更多筛选' }}</el-button>
        <el-button @click="demoAction('导出当前数据')">导出当前数据</el-button>
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
        :action-width="140"
        @change="loadData"
      >
        <template #col-orderInfo="{ row }">
          <div class="ol-cell">
            <div><el-tag size="small" effect="plain">{{ row.businessType }}</el-tag> {{ row.serviceName }}</div>
            <div class="ol-cell__sub">原单号：{{ row.code }}</div>
          </div>
        </template>
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #col-estimateFee="{ row }">{{ formatMoney(row.estimateFee) }}</template>
        <template #col-ifShip="{ row }">
          <el-tag size="small" :type="row.ifShip === '已发货' ? 'success' : 'info'">{{ row.ifShip }}</el-tag>
        </template>
        <template #col-audit="{ row }">
          <el-tag :type="auditStatusTag(row.audit)" size="small" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-overdueDays="{ row }">
          <span :class="{ 'ol-overdue': row.overdueDays > 0 }">{{ row.overdueDays || 0 }}</span>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button
            v-if="row.signStatus === '待签收'"
            link type="success" size="small" :disabled="!can('sign')"
            @click="openSign(row)"
          >签收</el-button>
          <el-button v-else link type="info" size="small" disabled>已签收</el-button>
        </template>
      </ProTable>
    </PageCard>

    <OrderDetailDialog v-model="detailVisible" :record="current" />

    <el-dialog v-model="signVisible" title="订单签收" width="480px" @closed="resetSign">
      <el-form ref="signFormRef" :model="signForm" :rules="signRules" label-width="90px">
        <el-form-item label="签收时间" prop="signTime">
          <el-date-picker
            v-model="signForm.signTime"
            type="datetime"
            placeholder="请选择签收时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="签收单" prop="signFile">
          <div v-if="signForm.signFile" class="sign-file">
            <img :src="signForm.signFile.url" alt="签收单" @click="previewSign" />
            <i class="sign-file__del" @click="removeSignFile"><el-icon><Close /></el-icon></i>
          </div>
          <el-upload
            v-else
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            :on-change="onSignFileChange"
          >
            <div class="sign-file__add"><el-icon><Plus /></el-icon><span>上传</span></div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="signVisible = false">取消</el-button>
        <el-button type="primary" :loading="signLoading" @click="submitSign">确定签收</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="signPreview.visible" title="签收单预览" width="600px">
      <img :src="signPreview.url" alt="签收单" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, Close } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import OrderDetailDialog from '@/components/Common/OrderDetailDialog.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { formatMoney } from '@/utils/format'
import {
  getSignOrders, signOrder,
  TRANSPORT_TYPES, ORDER_STATUS, AUDIT_STATUS, ORDER_TYPES, COMPANY_TYPES, COMPANY_NAMES,
  COUNTRIES, FBA_WAREHOUSES, SERVICES, TOP_AGENTS, IN_STATUS, MEASURE_STATUS, INSPECT_STATUS,
  DECLARE_METHODS, DELIVER_METHODS, auditStatusTag
} from '@/api/modules/orderlist'

defineOptions({ name: 'OlSign' })

const { can } = usePagePerms()

// 关键字搜索字段（前置下拉，对齐源页：原单号/客户名称/柜号）
const KEY_FIELDS = [
  { label: '原单号', value: 'code' },
  { label: '客户名称', value: 'customerName' },
  { label: '柜号', value: 'containerNo' }
]
// 更多筛选状态类静态占位选项（对齐源 searchMore，不参与真实过滤）
const DECLARE_STATUS = ['待报关', '报关中', '已放行']
const SHIP_OPTIONS = ['已发货', '未发货']
const YES_NO = ['是', '否']

const showMore = ref(false)
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getSignOrders, {
    keyword: '', keyField: 'code', status: '', audit: '', businessType: '', topAgent: '', orderType: '',
    companyType: '', companyName: '', destinationCountry: '', fbaWarehouse: '', serviceName: '',
    inStatus: '', measureStatus: '', inspectStatus: '', declareStatus: '', ifShip: '',
    deliverMethod: '', declareMethod: '', frozen: '', dateRange: []
  })

const columns = [
  { prop: 'orderInfo', label: '订单信息', minWidth: 200, fixed: 'left' },
  { prop: 'customerName', label: '客户名称', minWidth: 120 },
  { prop: 'orderCustomerName', label: '下单客户', width: 110 },
  { prop: 'createTime', label: '下单时间', width: 160 },
  { prop: 'orderWarehouse', label: '下单仓库', width: 120 },
  { prop: 'goodsWarehouse', label: '货物所在仓', width: 120 },
  { prop: 'declareMethod', label: '报关方式', width: 110 },
  { prop: 'pickMethod', label: '提货方式', width: 110 },
  { prop: 'deliverMethod', label: '派送方式', width: 110 },
  { prop: 'packages', label: '件数', width: 70, align: 'center' },
  { prop: 'amount', label: '金额', width: 120 },
  { prop: 'ifShip', label: '是否发货', width: 90, align: 'center' },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'inStatus', label: '入库状态', width: 100 },
  { prop: 'outStatus', label: '出库状态', width: 100 },
  { prop: 'measureStatus', label: '计量状态', width: 100 },
  { prop: 'inspectStatus', label: '验货状态', width: 100 },
  { prop: 'declareStatus', label: '报关状态', width: 100 },
  { prop: 'estimateFee', label: '预估运费', width: 110 },
  { prop: 'payDeadline', label: '截止付款时间', width: 170 },
  { prop: 'overdueDays', label: '逾期天数', width: 90, align: 'center' }
]

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

// 签收弹窗：签收时间（datetime，必填）+ 签收单上传（本地读为 base64，必填）
const now = () => {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const signVisible = ref(false)
const signLoading = ref(false)
const signFormRef = ref(null)
const signForm = reactive({ id: null, signTime: '', signFile: null })
const signPreview = reactive({ visible: false, url: '' })
const signRules = {
  signTime: [{ required: true, message: '请选择签收时间', trigger: 'change' }],
  signFile: [{ required: true, message: '请上传签收单', trigger: 'change' }]
}
const resetSign = () => { signForm.id = null; signForm.signTime = ''; signForm.signFile = null }
const openSign = row => {
  resetSign()
  signForm.id = row.id
  signForm.signTime = now()
  signVisible.value = true
  signFormRef.value?.clearValidate()
}
const onSignFileChange = file => {
  const raw = file.raw
  if (raw.size > 1024 * 1024) return ElMessage.warning('单张图片不能超过 1MB')
  const reader = new FileReader()
  reader.onload = e => {
    signForm.signFile = { name: raw.name, url: e.target.result }
    signFormRef.value?.validateField('signFile')
  }
  reader.readAsDataURL(raw)
}
const removeSignFile = () => { signForm.signFile = null }
const previewSign = () => { signPreview.url = signForm.signFile.url; signPreview.visible = true }
const submitSign = async () => {
  await signFormRef.value.validate()
  signLoading.value = true
  try {
    await signOrder(signForm.id, { signTime: signForm.signTime })
    ElMessage.success('签收成功')
    signVisible.value = false
    loadData()
  } finally {
    signLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.ol-cell { line-height: 1.5; }
.ol-cell__sub { color: $text-secondary; font-size: $font-sm; }
.ol-overdue { color: var(--el-color-danger); font-weight: 600; }
.sign-file {
  position: relative;
  width: 100px;
  height: 100px;
  img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; cursor: pointer; }
  &__del {
    position: absolute; top: -8px; right: -8px; cursor: pointer;
    background: var(--el-color-danger); color: #fff; border-radius: 50%;
    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 12px;
  }
  &__add {
    width: 100px; height: 100px; border: 1px dashed var(--el-border-color);
    border-radius: 4px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; color: $text-secondary; font-size: $font-sm; cursor: pointer;
    &:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
  }
}
</style>
