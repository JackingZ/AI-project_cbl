// 原型阶段无真实后端：统一模拟返回，结构与 request.js 拦截后保持一致 { code, data, msg }
// 各业务模块统一调用 mockRequest，切换真实接口时改为 import request from './request' 即可
export function mockRequest(data, delay = 80) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ code: 200, data, msg: 'success' }), delay)
  })
}

// 通用分页切片：支持关键字/字段过滤后的分页
export function paginate(list, { page = 1, size = 10 } = {}) {
  const total = list.length
  const start = (page - 1) * size
  return { list: list.slice(start, start + size), total }
}
