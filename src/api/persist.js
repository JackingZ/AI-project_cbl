// localStorage 持久化资源工厂：原型阶段无后端，数据本地存储，刷新/重启不丢失。
// 每个业务集合调用 createResource 得到一套增删改查方法，供 api/modules 统一封装。
import { mockRequest, paginate } from './mock'

const PREFIX = 'jht_db_'

export function createResource(key, seedFn, version = 1) {
  const storeKey = PREFIX + key
  const verKey = storeKey + '__v'

  const buildSeed = () => {
    const seed = typeof seedFn === 'function' ? seedFn() : (seedFn || [])
    localStorage.setItem(storeKey, JSON.stringify(seed))
    localStorage.setItem(verKey, String(version))
    return seed
  }

  const read = () => {
    const raw = localStorage.getItem(storeKey)
    const storedVer = Number(localStorage.getItem(verKey) || 0)
    // 种子版本升级后，旧缓存作废并重建（原型阶段无迁移，直接以新种子覆盖）
    if (raw && storedVer === version) {
      try { return JSON.parse(raw) } catch { /* 数据损坏则重建 */ }
    }
    return buildSeed()
  }

  let data = read()
  const flush = () => localStorage.setItem(storeKey, JSON.stringify(data))
  const nextId = () => data.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1
  const nowStr = () => {
    const now = new Date()
    const p = n => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`
  }

  return {
    // 原始数组（供树形/联动等场景直接读取）
    raw: () => data,

    // 条件过滤 + 分页，返回 { list, total }
    query(filterFn = null, { page = 1, size = 10 } = {}) {
      const filtered = filterFn ? data.filter(filterFn) : data.slice()
      return mockRequest(paginate(filtered, { page, size }))
    },

    // 全量（不分页），用于下拉/树
    list(filterFn = null) {
      return mockRequest(filterFn ? data.filter(filterFn) : data.slice())
    },

    get(id) {
      return mockRequest(data.find(r => r.id === Number(id)) || null)
    },

    add(record) {
      const row = { id: nextId(), createTime: nowStr(), ...record }
      data.unshift(row)
      flush()
      return mockRequest(row)
    },

    // 批量新增（如导入），一次落库；id 依次递增
    bulkAdd(records = []) {
      let seed = nextId()
      const rows = records.map(r => ({ id: seed++, createTime: nowStr(), ...r }))
      rows.forEach(row => data.unshift(row))
      flush()
      return mockRequest(rows)
    },

    update(id, patch) {
      const target = data.find(r => r.id === Number(id))
      if (target) Object.assign(target, patch)
      flush()
      return mockRequest(target)
    },

    remove(id) {
      const i = data.findIndex(r => r.id === Number(id))
      if (i > -1) data.splice(i, 1)
      flush()
      return mockRequest(null)
    },

    bulkRemove(ids = []) {
      const set = new Set(ids.map(Number))
      data = data.filter(r => !set.has(Number(r.id)))
      flush()
      return mockRequest(null)
    },

    // 状态开关等局部字段更新的语义化封装
    setStatus(id, status) {
      return this.update(id, { status })
    }
  }
}
