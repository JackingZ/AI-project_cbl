import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './store'
import '@/assets/style/global.scss'

// Element Plus 组件/指令/JS API 均由 unplugin 按需自动引入（见 vite.config.js）
// 语言、图标分别在 App.vue 的 el-config-provider 与各页面按需导入处理
createApp(App).use(pinia).use(router).mount('#app')
