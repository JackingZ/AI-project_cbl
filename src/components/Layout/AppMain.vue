<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <!-- 仅入场动画、去掉 mode=out-in：避免快速切换时 out-in 的离场回调卡住导致空白 -->
      <transition name="fade-slide">
        <keep-alive :include="cachedViews" :max="20">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// keep-alive include 白名单：取所有 meta.keepAlive 路由的组件 name。
// 要求页面通过 defineOptions({ name }) 声明的组件名与路由 name 一致，方可命中缓存。
const cachedViews = computed(() => {
  const layout = router.options.routes.find(r => r.path === '/')
  return (layout?.children || [])
    .filter(c => c.meta?.keepAlive && c.name)
    .map(c => c.name)
})
</script>

<style scoped lang="scss">
.app-main {
  padding: $page-padding;
  min-height: calc(100vh - #{$header-height});
  box-sizing: border-box;
}
/* 仅过渡 opacity（避免 all + transform 触发额外重排/合成），时长更短，切换更跟手 */
.fade-slide-enter-active { transition: opacity 0.12s ease; }
.fade-slide-enter-from { opacity: 0; }
</style>
