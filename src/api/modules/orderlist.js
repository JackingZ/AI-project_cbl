// 订单管理模块 mock 接口：统一一份订单数据集，按业务类型/阶段派生 9 个订单视图。
// 数据经 persist.js 持久化到 localStorage。
import { createResource } from '../persist'
import { mockRequest } from '../mock'

/* ============ 枚举 / 选项 ============ */
export const BUSINESS_TYPES = ['快递', '订舱', '卡派', '拖车', '报关']
export const ORDER_STATUS = ['待处理', '处理中', '已完成', '已取消']
export const AUDIT_STATUS = ['待审核', '审核中', '审核通过', '审核拒绝']
export const WAREHOUSE_STATUS = ['未入库', '在库', '部分出库', '已出库']
export const SIGN_STATUS = ['待签收', '已签收']
export const ENTRY_STATUS = ['已录单', '未录单']
export const IO_TYPES = ['进口', '出口']
export const ASSIGN_TYPES = ['系统指派', '手动指派']
export const EXPRESS_COMPANIES = ['DHL', 'FedEx', 'UPS', 'USPS']
export const TRAILER_TYPES = ['整柜拖车', '拼柜拖车']
export const SUPPLIERS = ['环球物流', '速达国际', '安通供应链', '远洋货代']
export const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']
export const PORTS = ['深圳港', '上海港', '宁波港', '洛杉矶港', '汉堡港', '东京港']

// 状态 → el-tag 类型
export function orderStatusTag(s) {
  return { 待处理: 'warning', 处理中: 'primary', 已完成: 'success', 已取消: 'info' }[s] || 'info'
}
export function auditStatusTag(s) {
  return { 待审核: 'warning', 审核中: 'primary', 审核通过: 'success', 审核拒绝: 'danger' }[s] || 'info'
}

/* ============ 种子数据（统一订单集） ============ */
const pad = n => String(n).padStart(2, '0')
const at = (arr, i) => arr[i % arr.length]

const orderResource = createResource('orderlist', () =>
  Array.from({ length: 60 }, (_, i) => {
    const businessType = at(BUSINESS_TYPES, i)
    const idx = i + 1
    return {
      id: idx,
      orderNo: `JHT2024${pad((i % 12) + 1)}${String(idx).padStart(4, '0')}`,
      code: `YD${String(100000 + i * 37).slice(0, 6)}`,
      businessType,
      customerName: `客户${pad((i % 26) + 1)}贸易`,
      orderCustomerName: `下单员${pad((i % 10) + 1)}`,
      startCountry: at(COUNTRIES, i + 2),
      destinationCountry: at(COUNTRIES, i),
      status: at(ORDER_STATUS, i),
      audit: at(AUDIT_STATUS, i),
      warehouseStatus: at(WAREHOUSE_STATUS, i),
      signStatus: at(SIGN_STATUS, i),
      signTime: '',
      entryStatus: at(ENTRY_STATUS, i),
      packages: (i % 8) + 1,
      totalBox: (i % 15) + 1,
      weight: Number((((i * 37) % 200) / 10 + 5).toFixed(2)),
      volume: Number((((i * 23) % 50) / 10 + 0.5).toFixed(2)),
      amount: Number((((i * 53) % 4000) + 500).toFixed(2)),
      cutoffTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} 18:00:00`,
      supplierName: i % 4 === 0 ? '' : at(SUPPLIERS, i),
      assignType: at(ASSIGN_TYPES, i),
      isDefault: i % 3 === 0 ? '是' : '否',
      // 装货/仓库
      loadType: i % 2 === 0 ? '整柜' : '拼柜',
      source: i % 2 === 0 ? '线上下单' : '代客下单',
      channel: `${at(COUNTRIES, i)}专线`,
      containerNo: `CT${String(200000 + i * 91).slice(0, 6)}`,
      // 快递
      expressCompany: at(EXPRESS_COMPANIES, i),
      expressNo: `${at(EXPRESS_COMPANIES, i)}${String(700000000 + i * 12345).slice(0, 9)}`,
      consignee: `Receiver ${pad(idx)}`,
      consigneeZip: String(10000 + (i * 137) % 89999),
      // 订舱
      soCode: `SO${String(500000 + i * 61).slice(0, 6)}`,
      billNo: `BL${String(600000 + i * 71).slice(0, 6)}`,
      portFrom: at(PORTS, i),
      portTo: at(PORTS, i + 3),
      markNo: `MK${String(300000 + i * 51).slice(0, 6)}`,
      // 卡派
      goodsName: at(['电子产品', '服装百货', '家居用品', '机械配件'], i),
      driverName: '',
      driverPhone: '',
      cardId: '',
      pickTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
      planTime: `2024-${pad((i % 12) + 1)}-${pad((i % 26) + 2)}`,
      // 拖车
      trailerType: at(TRAILER_TYPES, i),
      warehouseTime: `2024-${pad((i % 12) + 1)}-${pad((i % 25) + 1)} 09:00:00`,
      // 报关
      declarationNo: `BG${String(800000 + i * 81).slice(0, 6)}`,
      ioType: at(IO_TYPES, i),
      declareStatus: at(['待报关', '报关中', '已放行'], i),
      inspectionStatus: at(['待报检', '已报检'], i),
      createTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:30:00`,
      remark: ''
    }
  })
)

/* ============ 查询 ============ */
const kw = (v, q) => !q || String(v ?? '').includes(q)
// 通用基础过滤：订单号/原单号、业务类型、订单状态、审核状态
const baseMatch = (o, p) =>
  (kw(o.orderNo, p.keyword) || kw(o.code, p.keyword)) &&
  (!p.businessType || o.businessType === p.businessType) &&
  (!p.status || o.status === p.status) &&
  (!p.audit || o.audit === p.audit)

const paged = p => ({ page: p.page || 1, size: p.size || 10 })

// 全程订单：全部
export function getWholeOrders(p = {}) {
  return orderResource.query(o => baseMatch(o, p), paged(p))
}
// 仓库订单：在库/部分出库的订单（仓库视角）
export function getWarehouseOrders(p = {}) {
  return orderResource.query(
    o => baseMatch(o, p) && ['在库', '部分出库'].includes(o.warehouseStatus) &&
      (!p.warehouseStatus || o.warehouseStatus === p.warehouseStatus),
    paged(p)
  )
}
// 订单签收
export function getSignOrders(p = {}) {
  return orderResource.query(
    o => baseMatch(o, p) && (!p.signStatus || o.signStatus === p.signStatus),
    paged(p)
  )
}
// 代客下单/录单
export function getSalesmanOrders(p = {}) {
  return orderResource.query(
    o => baseMatch(o, p) && (!p.entryStatus || o.entryStatus === p.entryStatus),
    paged(p)
  )
}
// 业务类型专属视图
const byType = type => (p = {}) =>
  orderResource.query(o => o.businessType === type && baseMatch(o, { ...p, businessType: '' }), paged(p))
export const getExpressOrders = byType('快递')
export const getBookingOrders = byType('订舱')
export const getCarOrders = byType('卡派')
export const getTrailerOrders = byType('拖车')
// 报关订单：额外支持进出口类型
export function getCustomsOrders(p = {}) {
  return orderResource.query(
    o => o.businessType === '报关' && baseMatch(o, { ...p, businessType: '' }) &&
      (!p.ioType || o.ioType === p.ioType),
    paged(p)
  )
}

export function getOrderDetail(id) {
  return orderResource.get(id)
}

/* ============ 变更 ============ */
const now = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 代客下单：新增订单
export function addOrder(data) {
  return orderResource.add({
    orderNo: `JHT2024NEW${String(Math.floor((Date.now() / 1000) % 100000)).padStart(5, '0')}`,
    code: `YD${String(Math.floor((Date.now() / 100) % 1000000)).padStart(6, '0')}`,
    status: '待处理',
    audit: '待审核',
    entryStatus: '已录单',
    warehouseStatus: '未入库',
    signStatus: '待签收',
    ...data
  })
}
export function deleteOrder(id) { return orderResource.remove(id) }
export function cancelOrder(id) { return orderResource.update(id, { status: '已取消' }) }
export function auditOrder(id, audit) { return orderResource.update(id, { audit }) }
export function signOrder(id) { return orderResource.update(id, { signStatus: '已签收', signTime: now() }) }
export function assignSupplier(id, data) { return orderResource.update(id, data) }
// 派车（卡派/拖车）
export function assignVehicle(id, data) {
  return orderResource.update(id, { ...data, status: '已分配' })
}
// 供应商下拉
export function getSupplierOptions() { return mockRequest(SUPPLIERS) }
