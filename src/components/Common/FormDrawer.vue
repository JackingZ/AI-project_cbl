<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :close-on-click-modal="false"
    append-to-body
    class="common-drawer"
    @closed="$emit('closed')"
  >
    <slot />
    <template #footer>
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button type="primary" :loading="confirmLoading" @click="$emit('confirm')">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed } from 'vue'

// 全局统一右侧抽屉：与 Modal 同 API，用于新增/编辑表单（对齐原项目 app-drawer 交互）
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  size: { type: String, default: '540px' },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  confirmLoading: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue', 'confirm', 'closed'])

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const handleCancel = () => (visible.value = false)
</script>

<style scoped lang="scss">
.common-drawer :deep(.el-drawer__footer) {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: $space-md;
}
</style>
