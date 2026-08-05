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
export const EXPRESS_TYPES = ['国际快递', '国内快递', '专线小包']
export const TRAILER_TYPES = ['整柜拖车', '拼柜拖车']
export const SUPPLIERS = ['环球物流', '速达国际', '安通供应链', '远洋货代']
export const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']
export const PORTS = ['深圳港', '上海港', '宁波港', '洛杉矶港', '汉堡港', '东京港']
// 派生列所需中文枚举（保留中文串，占位对齐参考）
export const ORDER_TYPES = ['销售', '采购']
export const COMPANY_TYPES = ['聚货通', '客户', '代理商', '供应商']
// 所属公司选项（静态占位，与公司类型一致做下拉，不参与真实过滤）
export const COMPANY_NAMES = [
  '聚货通总部', '环球物流贸易', '速达国际电商', '安通供应链',
  '华东一级代理', '华南二级代理', '远洋货代', '深圳跨境仓储'
]
export const ORDER_SOURCES = ['线上下单', '代客下单', '接口对接']
export const LOAD_METHODS = ['整柜', '拼柜']
export const DECLARE_METHODS = ['一般贸易', '买单报关', '双清包税', '免报关']
export const PICK_METHODS = ['上门提货', '自送到仓', '快递到仓']
export const DELIVER_METHODS = ['卡车派送', '快递派送', '自提']
export const IN_STATUS = ['未入库', '部分入库', '已入库']
export const OUT_STATUS = ['未出库', '部分出库', '已出库']
export const MEASURE_STATUS = ['待计量', '计量中', '已计量']
export const INSPECT_STATUS = ['待验货', '已验货']
export const FILE_STATUS = ['待上传', '待审核', '已通过', '已拒绝']
export const DECLARE_TYPES = ['进口报关', '出口报关', '转关']
export const BILL_STATUS = ['未出账', '已出账', '已核销']
export const SERVICES = ['美国专线', '欧洲专线', '日本专线', '空运特快', '海运普船']
export const FBA_WAREHOUSES = ['ONT8', 'LAX9', 'JFK8', 'FRA3', 'NRT5']
export const TOP_AGENTS = ['聚货通总部', '华南一级代理', '华东一级代理']
export const SERVICE_TERMS = ['CIF', 'FOB', 'EXW', 'DDP', 'DDU']
export const GOODS_CLAUSES = ['电放', '正本', 'HBL', 'MBL']
// 调度任务订单状态（对齐源 allocationCat statusList）
export const SCHEDULE_STATUS = [
  { id: '0', name: '待分配' },
  { id: '3', name: '司机取消订单' },
  { id: '60', name: '完成调度' }
]
// 提货方式（对齐源 allocationCat delivery）
export const SCHEDULE_DELIVERY = [
  { id: '0', name: '自主送货' },
  { id: '1', name: '上门提货' },
  { id: '2', name: '快递发货' },
  { id: '3', name: '整柜直装' }
]
export const FLEETS = ['自营车队', '合作车队A', '合作车队B']
// 各页专属枚举（对齐源，替换此前误用的通用常量）
export const TRANSPORT_TYPES = ['空运', '海运', '铁路', '卡航']            // 全程/签收 业务类型(运输方式)
export const SALESMAN_TRANSPORT = ['空运', '海运', '铁路', '快递', '卡航'] // 代客下单 业务类型(含快递)
export const WH_BIZ_TYPES = ['仓储', '散收拼货', '拆柜打托']              // 仓库订单 业务类型
export const WH_SOURCES = ['客户端', '专线']                             // 仓库订单 来源
export const CUSTOMS_ORDER_STATUS = ['新建', '报关放行', '报关查验', '退运'] // 报关 订单状态
export const CUSTOMS_CATEGORIES = ['报关', '报检', '报关&报检']            // 报关 订单类别
export const CUSTOMS_DECLARE_TYPES = ['普通报关', '出口退税', '整柜买单']   // 报关 报关类型

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
      remark: '',
      // 派生列（全程/仓库/签收/代客共用，保留中文串）
      orderType: at(ORDER_TYPES, i),
      companyType: at(COMPANY_TYPES, i),
      companyName: `${at(COMPANY_TYPES, i)}${pad((i % 8) + 1)}`,
      serviceName: at(SERVICES, i),
      serviceProvider: at(SUPPLIERS, i + 1),
      topAgent: at(TOP_AGENTS, i),
      fbaWarehouse: at(FBA_WAREHOUSES, i),
      orderWarehouse: `${at(COUNTRIES, i)}集货仓`,
      goodsWarehouse: `${at(COUNTRIES, i)}海外仓`,
      declareMethod: at(DECLARE_METHODS, i),
      pickMethod: at(PICK_METHODS, i),
      deliverMethod: at(DELIVER_METHODS, i),
      ifShip: i % 3 === 0 ? '已发货' : '未发货',
      inStatus: at(IN_STATUS, i),
      outStatus: at(OUT_STATUS, i),
      measureStatus: at(MEASURE_STATUS, i),
      measureAudit: i % 2 === 0 ? '已审核' : '待审核',
      inspectStatus: at(INSPECT_STATUS, i),
      declareType: at(CUSTOMS_DECLARE_TYPES, i),
      category: at(CUSTOMS_CATEGORIES, i),
      fileStatus: at(FILE_STATUS, i),
      countryName: at(COUNTRIES, i),
      sellerName: `销售${pad((i % 12) + 1)}`,
      estimateFee: Number((((i * 41) % 5000) + 800).toFixed(2)),
      payDeadline: `2024-${pad((i % 12) + 1)}-${pad((i % 26) + 2)} 23:59:59`,
      overdueDays: i % 5 === 0 ? (i % 30) + 1 : 0,
      billStatus: at(BILL_STATUS, i),
      serviceTerms: at(SERVICE_TERMS, i),
      goodsClause: at(GOODS_CLAUSES, i),
      airNo: businessType === '订舱' && i % 2 === 0 ? `AW${String(900000 + i * 31).slice(0, 6)}` : '',
      packageType: '箱'
    }
  }), 3
)

/* ============ 调度任务单（源 allocationCat：卡派订单调度视图，按订单维度） ============ */
const SCH_STATUS_IDS = ['0', '3', '60']
const SCH_DELIVERY_IDS = ['0', '1', '2', '3']
const scheduleResource = createResource('schedule-tasks', () =>
  Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    code: `KP${100000 + i * 137}`,                          // 原单号
    status: SCH_STATUS_IDS[i % 3],                          // 订单状态(0待分配/3司机取消/60完成调度)
    createTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:15:00`, // 下单时间
    businessType: '卡派',                                    // 业务类型
    orderCustomerName: `下单客户${pad((i % 12) + 1)}`,       // 下单客户
    customerName: `${at(COUNTRIES, i)}${pad(i + 1)}贸易`,   // 客户名称
    deliveryWay: SCH_DELIVERY_IDS[i % 4],                    // 提货方式
    pickTime: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`, // 提货日期
    destinationCountry: at(COUNTRIES, i),                    // 目的地
    planTime: `2024-${pad((i % 12) + 1)}-${pad(((i + 5) % 27) + 1)}`, // 送货日期
    remark: '',
    // 分配车辆信息(分配后回填)
    fleet: '', driverName: '', driverPhone: '', cardId: ''
  })), 2
)

/* ============ 查询 ============ */
const kw = (v, q) => !q || String(v ?? '').includes(q)
// 关键字过滤：keyField 指定按哪个字段查（前置下拉选中项），未指定时默认查 订单号/原单号；
// exact=true 时精准匹配（全程订单精准匹配开关），否则模糊包含。
const matchKeyword = (o, p) => {
  if (!p.keyword) return true
  const cmp = (v) => p.exact ? String(v ?? '') === p.keyword : String(v ?? '').includes(p.keyword)
  return p.keyField ? cmp(o[p.keyField]) : (cmp(o.orderNo) || cmp(o.code))
}
// 通用基础过滤：关键字、业务类型、订单状态、审核状态
const baseMatch = (o, p) =>
  matchKeyword(o, p) &&
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
      (!p.ioType || o.ioType === p.ioType) &&
      (!p.category || o.category === p.category) &&
      (!p.declareType || o.declareType === p.declareType),
    paged(p)
  )
}
// 报关订单-按柜视图：以柜/提单维度派生（供应商/起运国/目的国/进出口/报关报检状态/柜号提单号）
export function getCustomsCabinets(p = {}) {
  return orderResource.query(
    o => o.businessType === '报关' &&
      (!p.supplierName || o.supplierName === p.supplierName) &&
      (!p.startCountry || o.startCountry === p.startCountry) &&
      (!p.destinationCountry || o.destinationCountry === p.destinationCountry) &&
      (!p.ioType || o.ioType === p.ioType) &&
      (!p.declareStatus || o.declareStatus === p.declareStatus) &&
      (!p.inspectionStatus || o.inspectionStatus === p.inspectionStatus) &&
      (!p.keyword || String(o.containerNo ?? '').includes(p.keyword) || String(o.billNo ?? '').includes(p.keyword)),
    paged(p)
  )
}

// 调度任务单
// 调度任务查询（源 allocationCat：按订单状态/目的地/原单号筛选）
export function getScheduleTasks(p = {}) {
  return scheduleResource.query(
    t => kw(t.code, p.keyword) &&
      (!p.status || t.status === p.status) &&
      (!p.destinationCountry || t.destinationCountry === p.destinationCountry),
    paged(p)
  )
}
// 分配车辆（源 showModal：回填车队/司机/车牌，状态→待分配保持，供调度）
export function assignScheduleCar(id, data) {
  return scheduleResource.update(id, { ...data })
}
// 完成调度（源 taskComplete：状态→60 完成调度）
export function completeSchedule(id) {
  return scheduleResource.update(id, { status: '60' })
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
export function signOrder(id, data = {}) {
  return orderResource.update(id, { signStatus: '已签收', signTime: data.signTime || now(), ...data })
}
export function assignSupplier(id, data) { return orderResource.update(id, data) }
// 派车（卡派/拖车）
export function assignVehicle(id, data) {
  return orderResource.update(id, { ...data, status: '已分配' })
}
// 供应商下拉
export function getSupplierOptions() { return mockRequest(SUPPLIERS) }
