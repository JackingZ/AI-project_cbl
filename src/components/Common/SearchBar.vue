<template>
  <div class="search-bar">
    <el-form :inline="true" :model="model" class="search-bar__form" @submit.prevent>
      <slot />
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="$emit('search')">查询</el-button>
        <el-button :icon="Refresh" @click="$emit('reset')">重置</el-button>
        <slot name="actions" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { Search, Refresh } from '@element-plus/icons-vue'

// 通用筛选栏：默认插槽放筛选项，actions 插槽放新增等操作按钮
defineProps({
  model: { type: Object, default: () => ({}) }
})
defineEmits(['search', 'reset'])
</script>

<style scoped lang="scss">
.search-bar {
  background: $bg-card;
  border-radius: $card-radius;
  box-shadow: $shadow-sm;
  padding: $page-padding $page-padding $space-xs;
  margin-bottom: $space-md;

  &__form {
    :deep(.el-form-item) { margin-bottom: $space-md; }
  }
}
</style>
