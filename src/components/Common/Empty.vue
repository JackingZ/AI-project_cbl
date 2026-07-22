<template>
  <el-empty :description="description" :image-size="imageSize" />
</template>

<script setup>
// 全局统一空状态
defineProps({
  description: { type: String, default: '暂无数据' },
  imageSize: { type: Number, default: 100 }
})
</script>
