// 销售管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const PLAN_STATUS = ['进行中', '已完成']
export const COMMISSION_TYPES = ['固定', '比例']
const st = i => (i % 5 === 0 ? '禁用' : '启用')
const money = i => Number((((i * 53) % 9000) + 1000).toFixed(2))

export const planApi = defineMock('sales_plan', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `销售计划${pad(i + 1)}`, salesman: `销售员${pad(i + 1)}`, target: money(i), deadline: `2024-${pad((i % 12) + 1)}-28`, planStatus: at(PLAN_STATUS, i), createTime: seedTime(i) })), ['name', 'planStatus'])

export const boardApi = defineMock('sales_board', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `看板${pad(i + 1)}`, salesman: `销售员${pad(i + 1)}`, amount: money(i), orders: (i % 40) + 5, rank: `第${i + 1}名`, createTime: seedTime(i) })), ['name'])

export const groupApi = defineMock('sales_group', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `服务组${pad(i + 1)}`, leader: `组长${pad(i + 1)}`, members: (i % 8) + 2, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const agentPlanApi = defineMock('sales_agent', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `代理计划${pad(i + 1)}`, agent: `代理商${pad(i + 1)}`, target: money(i), planStatus: at(PLAN_STATUS, i), createTime: seedTime(i) })), ['name', 'planStatus'])

export const commissionApi = defineMock('sales_commission', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `佣金方案${pad(i + 1)}`, type: at(COMMISSION_TYPES, i), ratio: (i % 20) + 1, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const statApi = defineMock('sales_stat', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, period: `2024-${pad((i % 12) + 1)}`, orderCount: (i % 100) + 20, amount: money(i), customer: `客户${pad(i + 1)}`, createTime: seedTime(i) })), ['period'])

export const managerApi = defineMock('sales_manager', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `经理人${pad(i + 1)}`, phone: `138${String(10000000 + i * 137).slice(0, 8)}`, teamSize: (i % 15) + 3, performance: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])
