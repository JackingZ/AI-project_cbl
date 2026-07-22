// 统一格式化 & 状态映射，全项目复用

// 时间格式化：兼容 Date / 时间戳 / 字符串
export function formatTime(value, withTime = true) {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const p = n => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
  if (!withTime) return date
  return `${date} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// 金额格式化
export function formatMoney(value, symbol = '$') {
  const num = Number(value || 0)
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 订单状态 → el-tag 类型
export const ORDER_STATUS_TAG = {
  待发货: 'warning',
  运输中: 'primary',
  清关中: 'info',
  已签收: 'success',
  异常: 'danger'
}

// 用户状态 → el-tag 类型
export const USER_STATUS_TAG = {
  启用: 'success',
  禁用: 'info'
}

export function orderStatusTag(status) {
  return ORDER_STATUS_TAG[status] || 'info'
}
