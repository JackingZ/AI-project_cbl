<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
// 按需模式下无全局插件配置，语言通过 config-provider 统一注入
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
