// 统一模拟数据源：order / logistics / dashboard 共用同一份订单数据，保证跨模块一致
const COUNTRIES = ['美国', '德国', '日本', '澳大利亚', '英国', '加拿大', '法国']
const CHANNELS = ['空运专线', '海运整柜', '海运拼箱', '国际快递']
export const ORDER_STATUS = ['待发货', '运输中', '清关中', '已签收', '异常']

function pad(n) { return String(n).padStart(2, '0') }

// 生成 48 条订单
export const orders = Array.from({ length: 48 }, (_, i) => {
  const idx = i + 1
  const status = ORDER_STATUS[i % ORDER_STATUS.length]
  return {
    id: idx,
    orderNo: `CB2024${pad((i % 12) + 1)}${String(idx).padStart(4, '0')}`,
    customer: `客户${pad(idx)}`,
    country: COUNTRIES[i % COUNTRIES.length],
    channel: CHANNELS[i % CHANNELS.length],
    weight: Number((((i * 37) % 100) / 10 + 1).toFixed(2)),
    amount: Number((((i * 53) % 900) + 100).toFixed(2)),
    status,
    remark: '',
    createTime: `2024-06-${pad((i % 28) + 1)} ${pad((i % 12) + 8)}:30:00`
  }
})

// 运单轨迹：按订单状态推导可见节点
export function buildTrace(order) {
  const flow = [
    { title: '订单创建', desc: '仓库已接单', done: true },
    { title: '已发货', desc: `${order.country} · ${order.channel}`, done: order.status !== '待发货' },
    { title: '运输中', desc: '国际干线运输', done: ['运输中', '清关中', '已签收'].includes(order.status) },
    { title: '清关中', desc: '目的国海关清关', done: ['清关中', '已签收'].includes(order.status) },
    { title: '已签收', desc: '客户已签收', done: order.status === '已签收' }
  ]
  return flow
}

// 系统用户
const ROLES = ['超级管理员', '运营', '客服', '财务']
export const users = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  username: i === 0 ? 'admin' : `user${pad(i + 1)}`,
  name: i === 0 ? '系统管理员' : `员工${pad(i + 1)}`,
  role: ROLES[i % ROLES.length],
  phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
  status: i % 7 === 0 ? '禁用' : '启用',
  createTime: `2024-05-${pad((i % 28) + 1)} 09:00:00`
}))
