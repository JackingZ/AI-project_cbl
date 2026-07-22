<template>
  <div class="navbar">
    <Breadcrumb />
    <el-dropdown @command="handleCommand">
      <span class="user-info">
        <el-avatar :size="28" class="avatar">{{ userStore.userName.charAt(0) }}</el-avatar>
        <span class="name">{{ userStore.userName }}</span>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="dashboard">首页</el-dropdown-item>
          <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const userStore = useUserStore()

const handleCommand = async command => {
  if (command === 'dashboard') {
    router.push({ name: 'Dashboard' })
  } else if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.push({ name: 'Login' })
  }
}
</script>

<style scoped lang="scss">
.navbar {
  height: $header-height;
  padding: 0 $space-lg;
  background: $bg-card;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.user-info {
  display: flex;
  align-items: center;
  gap: $space-sm;
  cursor: pointer;
  color: $text-primary;
  outline: none;
  .avatar { background: $primary-color; color: $sidebar-active-text; }
  .name { font-size: $font-base; }
}
</style>
