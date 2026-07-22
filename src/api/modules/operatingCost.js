// 运营成本模块 mock 接口：成本项目 / 成本项目组
import { createResource } from '../persist'

export const STATUS_OPTIONS = ['启用', '禁用']
export const COST_TYPES = ['固定成本', '变动成本']

const pad = n => String(n).padStart(2, '0')
const at = (a, i) => a[i % a.length]
const inc = (v, q) => !q || String(v ?? '').includes(q)
const seedTime = i => `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:00:00`

/* 成本项目 */
const projects = createResource('cost_projects', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    name: `成本项目${pad(i + 1)}`,
    code: `CP${1000 + i}`,
    type: at(COST_TYPES, i),
    amount: Number((((i * 53) % 5000) + 500).toFixed(2)),
    status: i % 5 === 0 ? '禁用' : '启用',
    createTime: seedTime(i)
  }))
)
export function getProjectList(p = {}) {
  return projects.query(o => inc(o.name, p.name) && (!p.type || o.type === p.type) && (!p.status || o.status === p.status), { page: p.page || 1, size: p.size || 10 })
}
export function addProject(d) { return projects.add(d) }
export function updateProject(id, d) { return projects.update(id, d) }
export function deleteProject(id) { return projects.remove(id) }

/* 成本项目组 */
const groups = createResource('cost_groups', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `项目组${pad(i + 1)}`,
    code: `CG${1000 + i}`,
    owner: `负责人${pad(i + 1)}`,
    status: i % 5 === 0 ? '禁用' : '启用',
    createTime: seedTime(i)
  }))
)
export function getGroupList(p = {}) {
  return groups.query(o => inc(o.name, p.name) && (!p.status || o.status === p.status), { page: p.page || 1, size: p.size || 10 })
}
export function addGroup(d) { return groups.add(d) }
export function updateGroup(id, d) { return groups.update(id, d) }
export function deleteGroup(id) { return groups.remove(id) }
