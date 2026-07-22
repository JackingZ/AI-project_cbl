import { mockRequest } from '../mock'
import { orders, ORDER_STATUS } from './db'

// 首页统计：卡片指标 + 各状态分布 + 近期订单
export function getDashboardStats() {
  const statusCount = ORDER_STATUS.map(s => ({
    status: s,
    count: orders.filter(o => o.status === s).length
  }))
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0)

  const cards = [
    { key: 'total', label: '订单总数', value: orders.length, unit: '单', color: 'primary' },
    { key: 'transit', label: '运输中', value: orders.filter(o => o.status === '运输中').length, unit: '单', color: 'warning' },
    { key: 'abnormal', label: '异常订单', value: orders.filter(o => o.status === '异常').length, unit: '单', color: 'danger' },
    { key: 'amount', label: '订单总金额', value: Number(totalAmount.toFixed(2)), unit: '$', color: 'success' }
  ]

  const recent = orders.slice(0, 6)
  return mockRequest({ cards, statusCount, recent })
}
