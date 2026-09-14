<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    append-to-body
    class="common-modal"
    @closed="$emit('closed')"
  >
    <template v-if="$slots.title" #header>
      <slot name="title" />
    </template>
    <slot />
    <template v-if="footer" #footer>
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="$emit('confirm')">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

// 全局统一弹窗：统一遮罩、层级、footer，页面禁止直接手写 el-dialog
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  width: { type: String, default: '520px' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmLoading: { type: Boolean, default: false },
  footer: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'closed'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const handleCancel = () => (visible.value = false)
</script>
