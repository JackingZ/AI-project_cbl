// 数据层小工具：基于 persist 的 createResource，附带按字段过滤的 list。
// 仅负责 mock 数据存取；页面 UI 仍由各自 .vue 显式编写（非自动渲染）。
import { createResource } from './persist'

export const inc = (v, q) => !q || String(v ?? '').includes(q)

// key: 存储键；seedFn: 种子数据；searchKeys: 参与过滤的字段。
// 约定：字段名以 '~' 结尾（或名为 name）走模糊匹配，其余走精确匹配。
export function defineMock(key, seedFn, searchKeys = [], version = 1) {
  const r = createResource(key, seedFn, version)
  const match = (o, p) =>
    searchKeys.every(raw => {
      const like = raw === 'name' || raw.endsWith('~')
      const k = raw.replace(/~$/, '')
      const v = p[k]
      if (v === '' || v == null) return true
      return like ? inc(o[k], v) : o[k] === v
    })
  return {
    list: (p = {}) => r.query(o => match(o, p), { page: p.page || 1, size: p.size || 10 }),
    add: d => r.add(d),
    update: (id, d) => r.update(id, d),
    remove: id => r.remove(id),
    res: r
  }
}

export const pad = n => String(n).padStart(2, '0')
export const at = (a, i) => a[i % a.length]
export const seedTime = i => `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:00:00`
