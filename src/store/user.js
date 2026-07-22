import { defineStore } from 'pinia'
import { login as loginApi, logout as logoutApi } from '@/api/modules/auth'
import { usePermissionStore } from './permission'

// 用户全局状态：token 持久化到 localStorage（简单状态），userInfo 存内存
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),
  getters: {
    isLogin: state => !!state.token,
    userName: state => state.userInfo?.name || '未登录',
    roleName: state => state.userInfo?.role || ''
  },
  actions: {
    async login(form) {
      const res = await loginApi(form)
      this.token = res.data.token
      this.userInfo = res.data.userInfo
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      // 登录后按角色加载菜单权限
      await usePermissionStore().loadByRole(this.userInfo.role)
      return res
    },
    // 已登录但权限未加载、或缓存角色与当前用户角色不一致时，按当前角色重载
    async ensurePerms() {
      const perm = usePermissionStore()
      const role = this.userInfo?.role
      if (role && (!perm.loaded || perm.role !== role)) {
        await perm.loadByRole(role)
      }
    },
    // 同步当前登录用户的角色并重载菜单权限（人员管理页改到本人角色时调用）
    async syncRole(roleName) {
      if (!this.userInfo || this.userInfo.role === roleName) return
      this.userInfo = { ...this.userInfo, role: roleName }
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      await usePermissionStore().loadByRole(roleName)
    },
    async logout() {
      await logoutApi()
      this.reset()
    },
    reset() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      usePermissionStore().reset()
    }
  }
})
