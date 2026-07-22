// 业务配置模块 mock 接口：快递接口
import { createResource } from '../persist'

export const STATUS_OPTIONS = ['启用', '禁用']
export const EXPRESS_COMPANIES = ['DHL', 'FedEx', 'UPS', 'USPS']
export const ENVS = ['测试', '生产']

const pad = n => String(n).padStart(2, '0')
const at = (a, i) => a[i % a.length]
const inc = (v, q) => !q || String(v ?? '').includes(q)

const ports = createResource('biz_express_port', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `${at(EXPRESS_COMPANIES, i)}接口${pad(i + 1)}`,
    company: at(EXPRESS_COMPANIES, i),
    apiUrl: `https://api.${at(EXPRESS_COMPANIES, i).toLowerCase()}.com/v${(i % 3) + 1}`,
    env: at(ENVS, i),
    status: i % 5 === 0 ? '禁用' : '启用',
    createTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} 09:00:00`
  }))
)
export function getExpressPortList(p = {}) {
  return ports.query(o => inc(o.name, p.name) && (!p.company || o.company === p.company) && (!p.status || o.status === p.status), { page: p.page || 1, size: p.size || 10 })
}
export function addExpressPort(d) { return ports.add(d) }
export function updateExpressPort(id, d) { return ports.update(id, d) }
export function deleteExpressPort(id) { return ports.remove(id) }
