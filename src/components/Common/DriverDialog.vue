<template>
  <Modal :model-value="modelValue" title="司机信息" width="480px" @update:model-value="close">
    <el-descriptions v-if="record" :column="1" border size="small">
      <el-descriptions-item label="司机姓名">{{ record.driverName || '未派车' }}</el-descriptions-item>
      <el-descriptions-item label="联系电话">{{ record.driverPhone || '-' }}</el-descriptions-item>
      <el-descriptions-item label="车牌号">{{ record.cardId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="提货日期">{{ record.pickTime || '-' }}</el-descriptions-item>
      <el-descriptions-item label="送货日期">{{ record.planTime || '-' }}</el-descriptions-item>
    </el-descriptions>
    <template #footer><el-button type="primary" @click="close">关闭</el-button></template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/Common/Modal.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)
</script>
