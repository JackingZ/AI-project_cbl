import { defineStore } from 'pinia'

// 最高权限角色名：该角色恒定全部放行，不受任何 menuPerms 配置影响
const SUPER_ADMIN_ROLE = '超级管理员'

// 菜单/页面权限：按登录用户的角色，决定可见的页面完整 path 集合。
// menuPerms：null=未加载；['*']=全部放行；['/a','/b']=白名单页面。
// 持久化 { role, perms } 到 localStorage：刷新免重拉；角色变更时按 role 失效重载。
const LS_KEY = 'jht_menu_perms'
const readLS = () => {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const c = raw ? JSON.parse(raw) : null
    // 仅接受新版 { role, perms } 结构；旧版（裸数组等）视为未加载以触发重载
    return c && Array.isArray(c.perms) ? c : null
  } catch {
    return null
  }
}

export const usePermissionStore = defineStore('permission', {
  state: () => {
    const c = readLS()
    return {
      menuPerms: c?.perms ?? null, // 页面访问权（path 白名单）
      btnPerms: c?.btns ?? [],     // 按钮操作权（`${path}:${action}` 白名单）
      role: c?.role ?? null
    }
  },
  getters: {
    loaded: state => Array.isArray(state.menuPerms),
    isAllPerm: state => Array.isArray(state.menuPerms) && state.menuPerms.includes('*')
  },
  actions: {
    setPerms(perms, role = this.role, btns = this.btnPerms) {
      this.menuPerms = Array.isArray(perms) ? perms : []
      this.btnPerms = Array.isArray(btns) ? btns : []
      this.role = role
      localStorage.setItem(LS_KEY, JSON.stringify({ role: this.role, perms: this.menuPerms, btns: this.btnPerms }))
    },
    // 按角色名加载权限：超管恒全放行；其余按配置，未配置/空 → 默认拒绝（仅 dashboard）
    async loadByRole(roleName) {
      if (!roleName) return this.setPerms([], roleName, [])
      if (roleName === SUPER_ADMIN_ROLE) return this.setPerms(['*'], roleName, ['*'])
      const { getRoleList } = await import('@/api/modules/organizers')
      const res = await getRoleList()
      const role = res.data.find(r => r.name === roleName)
      this.setPerms(role?.menuPerms || [], roleName, role?.perms || [])
    },
    // 页面是否可见：dashboard 恒放行；未加载不拦截（防守卫竞态）；'*' 全放行
    hasPerm(path) {
      if (path === '/dashboard') return true
      if (!this.loaded) return true
      if (this.isAllPerm) return true
      return this.menuPerms.includes(path)
    },
    // 按钮是否可用：未加载或超管全放行；否则命中 `${path}:${action}` 白名单
    hasBtn(id) {
      if (!this.loaded) return true
      if (this.btnPerms.includes('*')) return true
      return this.btnPerms.includes(id)
    },
    reset() {
      this.menuPerms = null
      this.btnPerms = []
      this.role = null
      localStorage.removeItem(LS_KEY)
    }
  }
})
