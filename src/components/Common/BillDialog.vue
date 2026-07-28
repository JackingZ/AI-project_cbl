<template>
  <Modal :model-value="modelValue" title="账单信息" width="640px" @update:model-value="close">
    <div v-if="record">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="订单号">{{ record.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="账单状态">{{ record.billStatus }}</el-descriptions-item>
        <el-descriptions-item label="预估运费">{{ formatMoney(record.estimateFee) }}</el-descriptions-item>
        <el-descriptions-item label="订单金额">{{ formatMoney(record.amount) }}</el-descriptions-item>
        <el-descriptions-item label="截止付款时间">{{ record.payDeadline }}</el-descriptions-item>
        <el-descriptions-item label="逾期天数">{{ record.overdueDays || 0 }} 天</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ record.supplierName || '未指派' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ record.customerName }}</el-descriptions-item>
      </el-descriptions>
    </div>
    <template #footer><el-button type="primary" @click="close">关闭</el-button></template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/Common/Modal.vue'
import { formatMoney } from '@/utils/format'

defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
</script>
