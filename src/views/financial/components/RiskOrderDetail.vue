<template>
  <PageCard>
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>风险订单详情</span>
        <span class="fin-detail-head__code">原单号：{{ form.code }}</span>
        <el-tag size="small" :type="auditTag(form.audit)">{{ lookup(ORDER_AUDIT_LIST, form.audit) }}</el-tag>
        <el-tag v-if="form.overdue" size="small" type="danger">逾期</el-tag>
        <el-tag v-if="form.insufficient" size="small" type="warning">信用不足</el-tag>
        <el-tag v-if="form.ifFrozen" size="small" type="info">冻结</el-tag>
        <el-tag v-if="form.ifLocked" size="small">锁定</el-tag>
      </div>
      <div>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="fin-sub">
      <div class="fin-sub__bar"><span class="fin-sub__title">基本信息</span></div>
      <el-form label-width="100px" class="fin-form" :disabled="true">
        <el-form-item label="原单号"><el-input v-model="form.code" readonly /></el-form-item>
        <el-form-item label="运输方式"><el-input :model-value="lookup(BIZ_TYPE_LIST, form.type)" readonly /></el-form-item>
        <el-form-item label="专线"><el-input v-model="form.lscValue" readonly /></el-form-item>
        <el-form-item label="客户"><el-input v-model="form.custName" readonly /></el-form-item>
        <el-form-item label="收货人"><el-input v-model="form.buyerName" readonly /></el-form-item>
        <el-form-item label="发货人"><el-input v-model="form.sellerName" readonly /></el-form-item>
        <el-form-item label="创建时间"><el-input v-model="form.createTime" readonly /></el-form-item>
        <el-form-item label="仓库"><el-input v-model="form.warehouseName" readonly /></el-form-item>
        <el-form-item label="报关方式"><el-input :model-value="lookup(CUSTOMS_LIST, form.customs0)" readonly /></el-form-item>
        <el-form-item label="提货方式"><el-input :model-value="lookup(PICK_LIST, form.pickType)" readonly /></el-form-item>
        <el-form-item label="派送方式"><el-input :model-value="lookup(DELIVERY_WAY_LIST, form.deliveryWay)" readonly /></el-form-item>
        <el-form-item label="件数"><el-input :model-value="String(form.packages ?? '')" readonly /></el-form-item>
        <el-form-item label="货值"><el-input :model-value="`${form.value ?? ''}(${form.currencyKey || ''})`" readonly /></el-form-item>
        <el-form-item label="截止时间"><el-input v-model="form.cutoffTime" readonly /></el-form-item>
        <el-form-item label="冻结原因"><el-input :model-value="form.freezeRemark || '--'" readonly /></el-form-item>
        <el-form-item label="运单号"><el-input :model-value="form.trackingNos || '--'" readonly /></el-form-item>
        <el-form-item label="入库"><el-input :model-value="String(form.wsIn ?? '')" readonly /></el-form-item>
        <el-form-item label="出库"><el-input :model-value="String(form.wsOut ?? '')" readonly /></el-form-item>
        <el-form-item label="计量"><el-input :model-value="String(form.measure ?? '')" readonly /></el-form-item>
        <el-form-item label="验货"><el-input :model-value="String(form.examine ?? '')" readonly /></el-form-item>
        <el-form-item label="报关行"><el-input :model-value="String(form.customDeclaration ?? '')" readonly /></el-form-item>
        <el-form-item label="总价"><el-input :model-value="`${form.totalPrice ?? ''}(${form.priceCurrency || ''})`" readonly /></el-form-item>
        <el-form-item v-if="form.auditReason" label="审核原因" class="fin-form__full"><el-input v-model="form.auditReason" type="textarea" :rows="2" readonly /></el-form-item>
      </el-form>
    </div>

    <!-- 单证/文件 -->
    <div class="fin-sub">
      <div class="fin-sub__bar"><span class="fin-sub__title">单证/文件</span></div>
      <el-table :data="form.files" border size="small">
        <el-table-column type="index" label="行号" width="60" />
        <el-table-column prop="fileName" label="文件名" min-width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }"><el-tag size="small" :type="auditTag(row.status)">{{ lookup(ORDER_AUDIT_LIST, row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="auditName" label="审核人" width="120" />
        <el-table-column prop="auditTime" label="审核时间" width="180" />
      </el-table>
    </div>
  </PageCard>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import {
  riskOrderApi, ORDER_AUDIT_LIST, BIZ_TYPE_LIST, CUSTOMS_LIST,
  PICK_LIST, DELIVERY_WAY_LIST, lookup
} from '@/api/modules/financial'

const props = defineProps({
  rowId: { type: [Number, String], default: null }
})
defineEmits(['back'])

const auditTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')

const defaultForm = () => ({
  id: null, code: '', type: '', lscValue: '', custName: '', buyerName: '', sellerName: '',
  createTime: '', warehouseName: '', customs0: '', pickType: '', deliveryWay: '', packages: '',
  value: '', currencyKey: '', cutoffTime: '', freezeRemark: '', trackingNos: '',
  wsIn: '', wsOut: '', measure: '', examine: '', customDeclaration: '', totalPrice: '', priceCurrency: '',
  audit: '0', auditReason: '', overdue: false, insufficient: false, ifFrozen: false, ifLocked: false,
  files: []
})
const form = reactive(defaultForm())

onMounted(async () => {
  if (props.rowId != null) {
    const res = await riskOrderApi.res.get(props.rowId)
    if (res.data) Object.assign(form, JSON.parse(JSON.stringify(res.data)))
  }
})
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
