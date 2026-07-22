import { mockRequest } from '../mock'
import { getPersonnelByUsername } from './organizers'

// 登录：原型阶段任意密码均可登录。用户角色取自人员台账：
// admin 固定超级管理员；其余按 org_personnel 中该 username 的 roleName 匹配；
// 未登记的用户名默认给客服专员（便于演示不同权限）。
export function login({ username }) {
  const staff = getPersonnelByUsername(username)
  const role = username === 'admin' ? '超级管理员' : (staff?.roleName || '客服专员')
  const name = username === 'admin' ? '系统管理员' : (staff?.realName || username)
  return mockRequest({
    token: `mock-token-${username}-${username.length}`,
    userInfo: { username, name, role }
  })
}

export function getUserInfo() {
  return mockRequest({ username: 'admin', name: '系统管理员', role: '超级管理员' })
}

export function logout() {
  return mockRequest(null)
}
