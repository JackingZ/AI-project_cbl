<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarWidth" class="layout-aside">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <Navbar />
      </el-header>
      <el-main class="layout-main">
        <AppMain />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import AppMain from './AppMain.vue'

const sidebarWidth = '220px'
</script>

<style scoped lang="scss">
.layout-container { height: 100vh; }
.layout-aside {
  width: $sidebar-width;
  background: $sidebar-bg;
  overflow: hidden;
}
.layout-header {
  padding: 0;
  height: $header-height;
}
.layout-main {
  padding: 0;
  background: $bg-page;
  overflow-y: auto;
}
</style>
