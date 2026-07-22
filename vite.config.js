import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    // Element Plus 按需引入：组件/指令(v-loading)自动注册，
    // ElMessage/ElMessageBox 等 JS API 自动导入并自动加载对应样式
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 启用 Sass 现代 JS API，消除 legacy-js-api 警告（Vite 5.4+ 支持）
        api: 'modern-compiler',
        // 替换 @import 为 @use 模块系统，as * 保持变量直接使用的写法，完全兼容原有代码
        additionalData: `@use "@/assets/style/vars.scss" as *;`
      }
    }
  },
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      output: {
        // 仅将稳定的核心框架拆为独立 vendor chunk，利于浏览器长效缓存；
        // Element Plus 已按需引入并随路由自动分包（懒加载），不再强制合并为单包
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})