<template>
  <div class="sidebar">
    <div class="logo" @click="goHome">跨境物流系统</div>
    <!-- 独立滚动容器：菜单过长时在此内部滚动，滚动条隐藏 -->
    <div class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        :background-color="sidebarBg"
        text-color="#C0C4CC"
        active-text-color="#FFFFFF"
        unique-opened
        @select="handleSelect"
      >
        <template v-for="item in menuList" :key="item.path">
          <!-- 含子页面的模块 → 二级子菜单 -->
          <el-sub-menu v-if="item.children.length" :index="item.path">
            <template #title>
              <el-icon v-if="item.meta.icon"><component :is="item.meta.icon" /></el-icon>
              <span>{{ item.meta.title }}</span>
            </template>
            <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
              {{ child.meta.title }}
            </el-menu-item>
          </el-sub-menu>
          <!-- 无子页面的单页（如数据概览） -->
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.meta.icon"><component :is="item.meta.icon" /></el-icon>
            <span>{{ item.meta.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePermissionStore } from '@/store/permission'

const route = useRoute()
const router = useRouter()
const permStore = usePermissionStore()

// el-menu 只接受字符串背景色，此处引用与变量一致的侧边栏色值
const sidebarBg = '#001529'

// 侧边栏菜单自动读取“扁平路由”，按 meta.group 还原两级层级：
// 带 group 的叶子归入对应模块子菜单，不带 group 的（如数据概览）作为顶级单项。
// 同时按当前用户菜单权限过滤：无权限的页面不展示，模块下无可见页面则整块隐藏。
const menuList = computed(() => {
  const layout = router.options.routes.find(r => r.path === '/')
  const children = (layout?.children || []).filter(
    c => c.meta?.title && !c.meta?.hidden && permStore.hasPerm('/' + c.path)
  )
  const groups = []
  const groupMap = {}
  for (const c of children) {
    const path = '/' + c.path
    if (c.meta.group) {
      let g = groupMap[c.meta.group]
      if (!g) {
        g = { path: '/' + c.meta.group, meta: { title: c.meta.groupTitle, icon: c.meta.groupIcon }, children: [] }
        groupMap[c.meta.group] = g
        groups.push(g)
      }
      g.children.push({ path, meta: { title: c.meta.title } })
    } else {
      groups.push({ path, meta: { title: c.meta.title, icon: c.meta.icon }, children: [] })
    }
  }
  return groups
})

// 详情/新增页高亮对应列表菜单
const activeMenu = computed(() => route.meta?.activeMenu || route.path)

// 显式处理菜单点击跳转，避免 el-menu router 模式在个别环境下不生效
const handleSelect = index => {
  if (index !== route.path) router.push(index)
}

// 点击左上角项目名称回到首页
const goHome = () => router.push('/dashboard')
</script>

<style scoped lang="scss">
.sidebar {
  width: $sidebar-width;
  height: 100%;
  background: $sidebar-bg;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.logo {
  flex: 0 0 auto;
  height: $header-height;
  line-height: $header-height;
  text-align: center;
  color: $sidebar-active-text;
  font-size: $font-lg;
  font-weight: 600;
  border-bottom: 1px solid $sidebar-logo-border;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.06); }
}
/* 菜单滚动区：内部滚动 + 隐藏滚动条（各浏览器） */
.menu-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;         /* Firefox */
  -ms-overflow-style: none;      /* IE / 旧 Edge */
  &::-webkit-scrollbar { width: 0; height: 0; } /* Chrome / Safari */
}
.el-menu {
  border-right: none;
}
/* 加快二级菜单展开/收起动画（Element Plus 默认 0.3s → 0.18s）。
   同时覆盖过渡类与被动画的内联子菜单元素，兼容不同版本类名。 */
:deep(.el-collapse-transition),
:deep(.collapse-transition),
:deep(.el-menu .el-menu--inline) {
  transition-duration: 0.18s !important;
}
</style>
