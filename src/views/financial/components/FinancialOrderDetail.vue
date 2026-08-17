<template>
  <PageCard v-loading="loading">
    <div class="fin-detail-head">
      <div class="fin-detail-head__title">
        <span>专线订单详情</span>
        <span class="fin-detail-head__code">原单号：{{ form.code }}</span>
        <el-tag size="small" :type="auditTag(form.audit)">{{ lookup(ORDER_AUDIT_LIST, form.audit) }}</el-tag>
      </div>
      <div>
        <el-button @click="$emit('back')">返回</el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="fin-tabs">
      <!-- 1. 商品信息 -->
      <el-tab-pane label="商品信息" name="goods">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="原单号">{{ form.code || '--' }}</el-descriptions-item>
          <el-descriptions-item label="运输方式">{{ lookup(BIZ_TYPE_LIST, form.type) }}</el-descriptions-item>
          <el-descriptions-item label="专线">{{ form.lscValue || '--' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ form.orderStatusName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ form.custName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ form.buyerName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="发货人">{{ form.sellerName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="业务员">{{ form.salesman || '--' }}</el-descriptions-item>
          <el-descriptions-item label="财务">{{ form.finances || '--' }}</el-descriptions-item>
          <el-descriptions-item label="客服">{{ form.customers || '--' }}</el-descriptions-item>
          <el-descriptions-item label="国家">{{ form.country || '--' }}</el-descriptions-item>
          <el-descriptions-item label="省份">{{ form.province || '--' }}</el-descriptions-item>
          <el-descriptions-item label="城市">{{ form.city || '--' }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ form.warehouse || '--' }}</el-descriptions-item>
          <el-descriptions-item label="入仓时间">{{ form.wsInTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="报关方式">{{ lookup(CUSTOMS_LIST, form.customs0) }}</el-descriptions-item>
          <el-descriptions-item label="派送方式">{{ lookup(DELIVERY_WAY_LIST, form.deliveryWay) }}</el-descriptions-item>
          <el-descriptions-item label="快递">{{ form.expressName || '--' }}</el-descriptions-item>
          <el-descriptions-item label="柜号">{{ form.containerNo || '--' }}</el-descriptions-item>
          <el-descriptions-item label="提单号">{{ form.billNo || '--' }}</el-descriptions-item>
          <el-descriptions-item label="运单号">{{ form.trackingNos || '--' }}</el-descriptions-item>
          <el-descriptions-item label="批次">{{ form.batch || '--' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ form.remarks || '--' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 2. 计量信息 -->
      <el-tab-pane label="计量信息" name="measure">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="件数">{{ form.packages ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="总体积">{{ form.totalVolume ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="总重量">{{ form.totalWeight ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="计费体积">{{ form.priceVolume ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="计费重量">{{ form.priceWeight ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="计费方式">{{ form.priceUnit === '2' ? '按体积' : form.priceUnit === '3' ? '按重量' : '--' }}</el-descriptions-item>
          <el-descriptions-item label="泡比">{{ form.bulky || '--' }}</el-descriptions-item>
          <el-descriptions-item label="计量方式">{{ form.method ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="是否含税">{{ form.includeTax ? '是' : '否' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <!-- 3. 验货信息（源页含验货数据，mock 无专属字段，用可用字段占位展示，保留该 tab 结构） -->
      <el-tab-pane label="验货信息" name="inspect">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="入仓时间">{{ form.wsInTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ form.warehouse || '--' }}</el-descriptions-item>
          <el-descriptions-item label="件数">{{ form.packages ?? '--' }}</el-descriptions-item>
        </el-descriptions>
        <el-empty description="暂无更多验货明细数据" :image-size="80" />
      </el-tab-pane>

      <!-- 4. 账单信息 -->
      <el-tab-pane label="账单信息" name="bill">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="信用">{{ form.credit ?? '--' }}</el-descriptions-item>
          <el-descriptions-item label="信用等级">{{ form.creditRating || '--' }}</el-descriptions-item>
          <el-descriptions-item label="发票时间">{{ form.invoiceTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ form.amount ?? '--' }} {{ form.amountUnit || '' }}</el-descriptions-item>
          <el-descriptions-item label="本币金额">{{ form.selfAmount ?? '--' }} {{ form.selfAmountUnit || '' }}</el-descriptions-item>
          <el-descriptions-item label="付款时间">{{ form.payTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="是否付款">
            <el-tag size="small" :type="form.isPayment ? 'success' : 'info'">{{ form.isPayment ? '已付款' : '未付款' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ form.cutoffTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="逾期天数">{{ form.overDay ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag size="small" :type="auditTag(form.audit)">{{ lookup(ORDER_AUDIT_LIST, form.audit) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </PageCard>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import { finOrderApi, BIZ_TYPE_LIST, DELIVERY_WAY_LIST, CUSTOMS_LIST, ORDER_AUDIT_LIST, lookup } from '@/api/modules/financial'

const props = defineProps({
  rowId: { type: [Number, String], default: null }
})
defineEmits(['back'])

const auditTag = a => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[a] || 'info')

const activeTab = ref('goods')
const loading = ref(false)
const form = reactive({})

onMounted(async () => {
  if (props.rowId == null) return
  loading.value = true
  try {
    const res = await finOrderApi.res.get(props.rowId)
    if (res.data) Object.assign(form, JSON.parse(JSON.stringify(res.data)))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.fin-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  &__title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 500; color: $text-primary; }
  &__code { font-size: 13px; color: $text-secondary; font-weight: 400; }
}
.fin-tabs { :deep(.el-descriptions) { margin-bottom: $space-md; } }
</style>
