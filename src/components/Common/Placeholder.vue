<template>
  <PageCard>
    <el-empty :description="`「${title}」页面待迁移`">
      <template #image>
        <el-icon :size="60" color="#C0C4CC"><Coin /></el-icon>
      </template>
      <p class="placeholder-tip">该模块页面尚未从聚货通迁移，菜单与路由已就位。</p>
    </el-empty>
  </PageCard>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Coin } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'

// 占位页统一读取当前路由标题，未迁移页面共用此组件
const route = useRoute()
const title = computed(() => route.meta?.title || '页面')
</script>

<style scoped lang="scss">
.placeholder-tip {
  color: $text-placeholder;
  font-size: $font-sm;
  margin-top: $space-sm;
}
</style>
