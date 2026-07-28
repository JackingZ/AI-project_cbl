<template>
  <Modal :model-value="modelValue" title="订单进度" width="560px" @update:model-value="close">
    <el-steps v-if="record" :active="activeStep" direction="vertical" finish-status="success">
      <el-step v-for="(s, i) in steps" :key="i" :title="s.title" :description="s.desc" />
    </el-steps>
    <template #footer><el-button type="primary" @click="close">关闭</el-button></template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from '@/components/Common/Modal.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue'])
const close = () => emit('update:modelValue', false)

const steps = computed(() => {
  const r = props.record || {}
  return [
    { title: '已下单', desc: r.createTime || '' },
    { title: '已入库', desc: r.inStatus || '' },
    { title: '已出库', desc: r.outStatus || '' },
    { title: '运输中', desc: r.status || '' },
    { title: '已签收', desc: r.signTime || r.signStatus || '' }
  ]
})
const activeStep = computed(() => {
  const map = { 待处理: 1, 处理中: 3, 已完成: 5, 已取消: 0 }
  return map[props.record?.status] ?? 1
})
</script>
