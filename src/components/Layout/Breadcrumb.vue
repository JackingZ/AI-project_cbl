<template>
  <el-breadcrumb separator="/" class="app-breadcrumb">
    <el-breadcrumb-item>
      <span class="app-breadcrumb__home" @click="goHome">首页</span>
    </el-breadcrumb-item>
    <el-breadcrumb-item v-for="(item, i) in crumbs" :key="i">
      {{ item.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 面包屑根据当前路由 meta 的模块(group)与页面标题生成，页面无需单独编写
const crumbs = computed(() => {
  if (route.name === 'Dashboard') return []
  const list = []
  if (route.meta?.groupTitle) list.push({ title: route.meta.groupTitle })
  if (route.meta?.title) list.push({ title: route.meta.title })
  return list
})

const goHome = () => {
  if (route.name !== 'Dashboard') router.push('/dashboard')
}
</script>

<style scoped lang="scss">
.app-breadcrumb {
  font-size: $font-base;
  :deep(.el-breadcrumb__inner) { color: $text-secondary; }
  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: $text-primary;
    font-weight: 600;
  }
  &__home {
    cursor: pointer;
    &:hover { color: $primary-color; }
  }
}
</style>
