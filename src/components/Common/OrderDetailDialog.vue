<template>
  <Modal :model-value="modelValue" title="订单详情" width="760px" @update:model-value="close">
    <div v-if="record" class="order-detail">
      <el-descriptions :column="2" border size="small" title="基础信息">
        <el-descriptions-item label="订单号">{{ record.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="原单号">{{ record.code }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ record.businessType }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ record.customerName }}</el-descriptions-item>
        <el-descriptions-item label="下单客户">{{ record.orderCustomerName }}</el-descriptions-item>
        <el-descriptions-item label="目的国">{{ record.destinationCountry }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="orderStatusTag(record.status)" size="small">{{ record.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="auditStatusTag(record.audit)" size="small" effect="light">{{ record.audit }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="件数">{{ record.packages }}</el-descriptions-item>
        <el-descriptions-item label="箱数">{{ record.totalBox }}</el-descriptions-item>
        <el-descriptions-item label="重量(kg)">{{ record.weight }}</el-descriptions-item>
        <el-descriptions-item label="体积(m³)">{{ record.volume }}</el-descriptions-item>
        <el-descriptions-item label="金额">{{ formatMoney(record.amount) }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ record.supplierName || '未指派' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ record.createTime }}</el-descriptions-item>
        <el-descriptions-item label="截止付款">{{ record.cutoffTime }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions class="order-detail__section" :column="2" border size="small" :title="`${record.businessType}专属信息`">
        <template v-if="record.businessType === '快递'">
          <el-descriptions-item label="快递公司">{{ record.expressCompany }}</el-descriptions-item>
          <el-descriptions-item label="快递单号">{{ record.expressNo }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ record.consignee }}</el-descriptions-item>
          <el-descriptions-item label="收件邮编">{{ record.consigneeZip }}</el-descriptions-item>
        </template>
        <template v-else-if="record.businessType === '订舱'">
          <el-descriptions-item label="SO号">{{ record.soCode }}</el-descriptions-item>
          <el-descriptions-item label="提单号">{{ record.billNo }}</el-descriptions-item>
          <el-descriptions-item label="起运港">{{ record.portFrom }}</el-descriptions-item>
          <el-descriptions-item label="目的港">{{ record.portTo }}</el-descriptions-item>
          <el-descriptions-item label="柜号">{{ record.markNo }}</el-descriptions-item>
        </template>
        <template v-else-if="record.businessType === '卡派'">
          <el-descriptions-item label="货物">{{ record.goodsName }}</el-descriptions-item>
          <el-descriptions-item label="提货日期">{{ record.pickTime }}</el-descriptions-item>
          <el-descriptions-item label="送货日期">{{ record.planTime }}</el-descriptions-item>
          <el-descriptions-item label="司机">{{ record.driverName || '未派车' }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ record.cardId || '-' }}</el-descriptions-item>
        </template>
        <template v-else-if="record.businessType === '拖车'">
          <el-descriptions-item label="SO号">{{ record.soCode }}</el-descriptions-item>
          <el-descriptions-item label="拖车类型">{{ record.trailerType }}</el-descriptions-item>
          <el-descriptions-item label="进仓时间">{{ record.warehouseTime }}</el-descriptions-item>
          <el-descriptions-item label="取货时间">{{ record.pickTime }}</el-descriptions-item>
        </template>
        <template v-else-if="record.businessType === '报关'">
          <el-descriptions-item label="报关单号">{{ record.declarationNo }}</el-descriptions-item>
          <el-descriptions-item label="进出口">{{ record.ioType }}</el-descriptions-item>
          <el-descriptions-item label="报关状态">{{ record.declareStatus }}</el-descriptions-item>
          <el-descriptions-item label="报检状态">{{ record.inspectionStatus }}</el-descriptions-item>
          <el-descriptions-item label="起运国">{{ record.startCountry }}</el-descriptions-item>
          <el-descriptions-item label="柜号/提单">{{ record.containerNo }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button type="primary" @click="close">关闭</el-button>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/Common/Modal.vue'
import { formatMoney } from '@/utils/format'
import { orderStatusTag, auditStatusTag } from '@/api/modules/orderlist'

defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
</script>

<style scoped lang="scss">
.order-detail__section { margin-top: $space-lg; }
</style>
