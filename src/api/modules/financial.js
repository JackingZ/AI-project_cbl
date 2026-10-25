// 财务管理模块 mock 接口（保真对齐 agent/workProject2-jht/src/views/financial-management）
// 覆盖：应收款/应付款(共用发票模型 type R|P)、开票、收款单、请款申请单、付款单、
//       对账单、会计期间、公司信用、风险控制(冻结订单)、专线订单。
import { defineMock, pad, at, seedTime } from '../mockCrud'
import { createResource } from '../persist'
import { mockRequest, paginate } from '../mock'
import { currencyApi } from './operation'

/* ============================ 共享字典 ============================ */
// 发票审核状态（应收/应付/开票/请款/付款 共用）：未审核0/已通过1/已拒绝2/审核中3
export const INV_STATUS_LIST = [
  { id: '0', name: '未审核' }, { id: '1', name: '已通过' },
  { id: '2', name: '已拒绝' }, { id: '3', name: '审核中' }
]
// 核销状态
export const VERIFY_LIST = [{ id: '1', name: '已核销' }, { id: '0', name: '未核销' }]
// 收款单状态（数值）：未核销0 / 已核销2
export const RECEIVE_STATUS_LIST = [{ id: 0, name: '未核销' }, { id: 2, name: '已核销' }]
// 收款单审核状态 checked：0未审核/1审核通过/2审核拒绝/3审核中
export const RECEIVE_CHECK_LIST = [
  { id: 0, name: '未审核' }, { id: 1, name: '审核通过' },
  { id: 2, name: '审核拒绝' }, { id: 3, name: '审核中' }
]
// 收/付款方式（sourceList）
export const SOURCE_LIST = [
  { id: '0', name: '银行汇款' }, { id: '1', name: '微信' }, { id: '2', name: '支付宝' },
  { id: '3', name: 'PayPal' }, { id: '4', name: '其它' }
]
// 付款类型（categoryList）
export const CATEGORY_LIST = [
  { id: '0', name: '采购付款' }, { id: '1', name: '赔付' }, { id: '2', name: '抵扣' }
]
// 公司类型（本公司/分公司）
export const COMPANY_TYPE_LIST = [{ id: '1', name: '本公司' }, { id: '2', name: '分公司' }]
// 发票类型
export const INVOICE_TYPE_LIST = [{ id: '1', name: '订单发票' }, { id: '2', name: '冲红发票' }]
// 结算单位（settlementList）
export const SETTLEMENT_LIST = [
  { id: '0', name: '按重量' }, { id: '1', name: '按体积' }, { id: '2', name: '按金额' },
  { id: '3', name: '按票' }, { id: '4', name: '按箱' }, { id: '5', name: '按车' },
  { id: '6', name: '按柜' }, { id: '7', name: '按里程' }, { id: '8', name: '按时间' },
  { id: '9', name: '按托' }, { id: 'A', name: '按个数' }
]
// 对账单类型
export const CHECK_TYPE_LIST = [{ id: 'P', name: '应付' }, { id: 'R', name: '应收' }]
// 是否关账
export const CLOSE_LIST = [{ id: 0, name: '否' }, { id: 1, name: '是' }]
// 信用等级（creditRating）：code/name/rating(额度上限)
export const CREDIT_RATING_LIST = [
  { id: '1', code: 'A', name: '优质', rating: 500000 },
  { id: '2', code: 'B', name: '良好', rating: 200000 },
  { id: '3', code: 'C', name: '普通', rating: 80000 },
  { id: '4', code: 'D', name: '较差', rating: 20000 }
]
// 提货方式（信用编辑）
export const TAKE_METHOD_LIST = [{ id: '1', name: '自主送货' }, { id: '2', name: '上门取货' }]
// 风险订单标签
export const RISK_LIST = [{ id: '1', name: '逾期' }, { id: '2', name: '信用不足' }, { id: '3', name: '冻结' }]
// 订单审核状态（风险/专线）
export const ORDER_AUDIT_LIST = [
  { id: '0', name: '待审核' }, { id: '3', name: '审核中' },
  { id: '1', name: '审核通过' }, { id: '2', name: '审核拒绝' }
]
// 业务类型（运输方式）
export const BIZ_TYPE_LIST = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' },
  { id: '3', name: '快递' }, { id: '4', name: '卡航' }
]
// 派送方式
export const DELIVERY_WAY_LIST = [
  { id: '0', name: '快递' }, { id: '1', name: '卡派' }, { id: '2', name: '自提' },
  { id: '3', name: '整柜直送' }, { id: '4', name: '到仓' }
]
// 提货方式（订单）
export const PICK_LIST = [
  { id: '0', name: '自主送货' }, { id: '1', name: '上门提货' },
  { id: '2', name: '快递发货' }, { id: '3', name: '整柜直装' }
]
// 报关方式
export const CUSTOMS_LIST = [{ id: '0', name: '普通报关' }, { id: '1', name: '出口退税' }]
// 服务大类（沿用运营的服务大类命名，财务筛选用；05 对齐源导出判断）
export const SERVICE_LIST = [
  { id: '01', name: '仓储' }, { id: '02', name: '专线' }, { id: '03', name: '卡车' },
  { id: '04', name: '拖车' }, { id: '05', name: '快递' }, { id: '06', name: '订舱' }
]

/* ============================ 工具函数 ============================ */
// 本币金额：金额 × 汇率，保留 2 位
export const countNum = (amount, exRate) => Number(((Number(amount) || 0) * (Number(exRate) || 0)).toFixed(2))
export const lookup = (list, id) => (list.find(x => String(x.id) === String(id)) || {}).name || '--'
// 客户属性映射（type/subtype → 文案）：0SYSTEM/3供应商/2-1一级代理/2-2二级代理/1-0直客/1-1同行
export function clientProperty(type, subtype) {
  const t = String(type)
  if (t === '0') return 'SYSTEM'
  if (t === '3') return '供应商'
  if (t === '2') return String(subtype) === '2' ? '二级代理' : '一级代理'
  if (t === '1') return String(subtype) === '1' ? '同行' : '直客'
  return '--'
}
// 逾期天数（相对当日；仅正数有效）
export function overdueDay(cutoffTime) {
  if (!cutoffTime) return 0
  const diff = Math.floor((Date.now() - new Date(String(cutoffTime).replace(/-/g, '/')).getTime()) / 86400000)
  return diff > 0 ? diff : 0
}

const money = i => Number((((i * 137) % 90000) + 1000).toFixed(2))
const dstr = (i, o = 0) => `2024-${pad(((i + o) % 12) + 1)}-${pad(((i + o) % 27) + 1)}`
const dtime = i => `${dstr(i)} ${pad((i % 12) + 8)}:00:00`
const CUR = ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'AUD']
const CUR_NAME = { USD: '美元', EUR: '欧元', CNY: '人民币', JPY: '日元', GBP: '英镑', AUD: '澳元' }
const RATE = { USD: 7.12, EUR: 7.78, CNY: 1, JPY: 0.048, GBP: 9.05, AUD: 4.72 }
const CLIENTS = ['深圳华通贸易', '广州速卖电商', '上海远洋供应链', '义乌小商品', '东莞跨境优选', '杭州云仓科技']
const SUPPLIERS = ['环球物流', '速达国际', '安通供应链', '远洋货代']

// 明细行种子（发票项目）
const seedItems = (i, exRate) => {
  const n = (i % 3) + 1
  return Array.from({ length: n }, (_, k) => {
    const quantity = (k + 1) * 2, price = Number((((i + k) * 17 % 900) + 100).toFixed(4))
    const amount = Number((quantity * price).toFixed(2))
    return { id: k + 1, costitemId: (i + k) % 14 + 1, costitemName: `成本项目${pad((i + k) % 14 + 1)}`, itemDesc: `费用说明${k + 1}`, quantity, price, amount, selfAmount: countNum(amount, exRate), confirm: 0 }
  })
}

/* ============================ 1/2. 发票（应收 R / 应付 P） ============================ */
// 应收：clientName 收款方；应付：agentName 开票企业。共用一张表，type 区分。
const invoiceRes = createResource('fin_invoice', () =>
  Array.from({ length: 40 }, (_, i) => {
    const type = i % 2 === 0 ? 'R' : 'P'
    const cur = at(CUR, i), exRate = RATE[cur]
    const items = seedItems(i, exRate)
    const amount = Number(items.reduce((s, it) => s + it.amount, 0).toFixed(2))
    const bizType = at(['00', '01', '02', '05', '06'], i)      // 02 海运提单/06 订舱 影响单号列
    const status = String(i % 4), ifVerify = i % 3 === 0 ? '1' : '0'
    return {
      id: i + 1, type, code: `${type === 'R' ? 'YS' : 'YF'}${100000 + i}`,
      orderCode: `KP${100000 + i * 7}`, businessType: bizType,
      soNoList: bizType === '02' || bizType === '06' ? `SO${2000 + i}` : '',
      billNoList: bizType === '02' ? `BL${3000 + i}` : '',
      airNoList: bizType === '02' ? `AW${4000 + i}` : '',
      containerNoList: bizType === '02' ? `CN${5000 + i}` : '',
      status, ifVerify, invDate: dtime(i),
      clientName: at(CLIENTS, i), agentName: at(SUPPLIERS, i),
      clientType: type === 'R' ? at(['0', '1', '2', '3'], i) : '3',
      clientSubtype: String(i % 3),
      serviceTypeId: at(['01', '02', '05', '06'], i),
      serviceSubtypeId: String((i % 4) + 1), channelName: `渠道${pad(i % 6 + 1)}`,
      invoiceType: i % 5 === 0 ? '2' : '1',
      currencyId: cur, currencyName: CUR_NAME[cur], exRate, amount, selfAmount: countNum(amount, exRate),
      createTime: dtime(i), auditTime: status === '1' ? dtime(i + 1) : '',
      cutoffTime: dstr(i, 2), payTime: ifVerify === '1' ? dstr(i, 3) : '',
      remark: '', items, packages: (i % 50) + 10, weights: (i % 800) + 100, wsCode: `WH${pad(i % 8 + 1)}`
    }
  })
, 1)
const invMatch = (o, p, type) => o.type === type &&
  (!p.status || o.status === p.status) &&
  (p.ifVerify === '' || p.ifVerify == null || o.ifVerify === p.ifVerify) &&
  (!p.serviceTypeId || o.serviceTypeId === p.serviceTypeId) &&
  kwMatch(o, p)
function kwMatch(o, p) {
  if (!p.keyWord) return true
  const map = { 1: 'orderCode', 2: o.type === 'R' ? 'clientName' : 'agentName', 4: 'billNoList', 5: 'soNoList', 6: 'containerNoList' }
  const field = map[p.selectType || 1]
  return String(o[field] ?? '').includes(p.keyWord)
}
export const invoiceApi = {
  res: invoiceRes,
  listRecv: (p = {}) => invoiceRes.query(o => invMatch(o, p, 'R'), { page: p.page || 1, size: p.size || 10 }),
  listPay: (p = {}) => invoiceRes.query(o => invMatch(o, p, 'P'), { page: p.page || 1, size: p.size || 10 }),
  get: id => invoiceRes.get(id),
  add: d => invoiceRes.add(d),
  update: (id, d) => invoiceRes.update(id, d),
  remove: id => invoiceRes.remove(id),
  audit: (id, status) => invoiceRes.update(id, { status, auditTime: status === '1' || status === '2' ? nowStr() : '' })
}
const nowStr = () => { const n = new Date(); const p = x => String(x).padStart(2, '0'); return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}` }

/* ============================ 3. 开票 ============================ */
export const outInvoiceApi = defineMock('fin_out', () =>
  Array.from({ length: 16 }, (_, i) => {
    const cur = at(CUR, i)
    const amount = money(i)
    return {
      id: i + 1, code: `KP${300000 + i}`, clientName: at(CLIENTS, i),
      invDate: dstr(i), status: String(i % 4), auditTime: i % 4 === 1 ? dtime(i + 1) : '',
      amount, ifBill: i % 2 === 0 ? '1' : '0', serviceTypeId: at(['01', '02', '05'], i),
      remark: '', currencyName: CUR_NAME[cur], currencyId: cur,
      invoiceIds: [], createTime: dtime(i)
    }
  }), [], 1)
outInvoiceApi.list = (p = {}) => outInvoiceApi.res.query(o =>
  (!p.status || o.status === p.status) &&
  (p.ifBill === '' || p.ifBill == null || o.ifBill === p.ifBill) &&
  (!p.serviceTypeId || o.serviceTypeId === p.serviceTypeId) &&
  (!p.keyWord || String(o[(p.selectType || '1') === '2' ? 'clientName' : 'code'] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
outInvoiceApi.audit = (id, status) => outInvoiceApi.res.update(id, { status, auditTime: nowStr() })

/* ============================ 4. 收款单 ============================ */
export const receiveApi = defineMock('fin_receive', () =>
  Array.from({ length: 16 }, (_, i) => {
    const cur = at(CUR, i), exRate = RATE[cur], amount = money(i)
    return {
      id: i + 1, checked: i % 4, status: i % 3 === 0 ? 2 : 0, ifChecking: 0,
      payDate: dtime(i), auditTime: i % 4 === 1 ? dtime(i + 1) : '',
      custName: at(CLIENTS, i), custType: at(['0', '1', '2', '3'], i), custSubtype: String(i % 3),
      payMethod: String(i % 5), currencyId: cur, currencyName: CUR_NAME[cur],
      amount, exRate, selfAmount: countNum(amount, exRate),
      surplus: i % 4 === 1 ? countNum(amount, exRate) : '',
      serialNumber: `SN${900000 + i}`, payAccount: `62220000${pad(i)}`,
      remark: '', ifOut: 0, relationList: [], writeoffList: [], createTime: dtime(i)
    }
  }), [], 1)
receiveApi.list = (p = {}) => receiveApi.res.query(o =>
  (p.status === '' || p.status == null || o.status === Number(p.status)) &&
  (!p.payMethod || o.payMethod === p.payMethod) &&
  (!p.keyWord || String(o[{ 1: 'id', 2: 'custName', 3: 'id' }[p.selectType || 2]] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
receiveApi.audit = (id, bool) => receiveApi.res.update(id, { checked: bool === '1' ? 1 : 2, auditTime: nowStr(), status: bool === '1' ? 2 : 0 })

/* ============================ 5. 请款申请单 ============================ */
export const requestApi = defineMock('fin_request', () =>
  Array.from({ length: 16 }, (_, i) => {
    const cur = at(CUR, i), exRate = RATE[cur], payAmount = money(i)
    return {
      id: i + 1, status: String(i % 4), applyTime: dtime(i),
      custName: at(SUPPLIERS, i), custType: at(['0', '2', '3'], i), custSubtype: String(i % 3),
      payType: String(i % 3), payMethod: String(i % 5),
      currencyId: cur, currencyName: CUR_NAME[cur], exRate, payAmount, selfAmount: countNum(payAmount, exRate),
      remark: '', invoicesData: [], createTime: dtime(i)
    }
  }), [], 1)
requestApi.list = (p = {}) => requestApi.res.query(o =>
  (!p.status || o.status === p.status) &&
  (!p.payType || o.payType === p.payType) &&
  (!p.payMethod || o.payMethod === p.payMethod) &&
  (!p.keyWord || String(o[{ 2: 'custName', 3: 'id' }[p.selectType || 2]] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
requestApi.audit = (id, status) => requestApi.res.update(id, { status })

/* ============================ 6. 付款单 ============================ */
export const paymentApi = defineMock('fin_payment', () =>
  Array.from({ length: 16 }, (_, i) => {
    const cur = at(CUR, i), exRate = RATE[cur], payAmount = money(i)
    return {
      id: i + 1, status: String(i % 4), payTime: dtime(i),
      custName: at(SUPPLIERS, i), custType: at(['0', '2', '3'], i), custSubtype: String(i % 3),
      payType: String(i % 3), payMethod: String(i % 5), serialNumber: `PS${800000 + i}`,
      currencyId: cur, currencyName: CUR_NAME[cur], exRate, payAmount, selfAmount: countNum(payAmount, exRate),
      remark: '', tableData1: [], tableData2: [], createTime: dtime(i)
    }
  }), [], 1)
paymentApi.list = (p = {}) => paymentApi.res.query(o =>
  (!p.status || o.status === p.status) &&
  (!p.payType || o.payType === p.payType) &&
  (!p.payMethod || o.payMethod === p.payMethod) &&
  (!p.keyWord || String(o[{ 2: 'custName', 3: 'id' }[p.selectType || 2]] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
paymentApi.audit = (id, status) => paymentApi.res.update(id, { status })

/* ============================ 7. 对账单 ============================ */
export const checkApi = defineMock('fin_check', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, year: String(2023 + (i % 2)), fisCalId: (i % 6) + 1,
    fisCalName: `${2023 + (i % 2)}年第${(i % 12) + 1}期`, type: i % 2 === 0 ? 'R' : 'P',
    ifClose: i % 4 === 0 ? 1 : 0, creator: at(['张财务', '李会计', '王出纳'], i),
    remark: '', custTag: '1', companyId: '', createTime: dtime(i), updateTime: dtime(i + 1)
  })), [], 1)
checkApi.list = (p = {}) => checkApi.res.query(o =>
  (!p.year || o.year === p.year) &&
  (!p.fisCalId || o.fisCalId === Number(p.fisCalId)) &&
  (!p.type || o.type === p.type) &&
  (p.ifClose === '' || p.ifClose == null || o.ifClose === Number(p.ifClose)),
  { page: p.page || 1, size: p.size || 10 })
checkApi.close = id => checkApi.res.update(id, { ifClose: 1, updateTime: nowStr() })
// 对账单-账单明细（左表：回款明细） / 银行数据（右表）
export const checkBillApi = defineMock('fin_check_bill', () =>
  Array.from({ length: 30 }, (_, i) => {
    const cur = at(CUR, i)
    return {
      id: i + 1, checkId: (i % 12) + 1, side: i % 2 === 0 ? 'L' : 'R', ifChecking: 0,
      payDate: dstr(i), custName: at(CLIENTS, i), payMethod: String(i % 5),
      payAccount: `62220000${pad(i)}`, amount: money(i), currencyId: cur, currencyName: CUR_NAME[cur],
      serialNumber: `VC${700000 + i}`
    }
  }), [], 1)

/* ============================ 8. 会计期间 ============================ */
export const fiscalApi = defineMock('fin_fiscal', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, year: String(2023 + (i % 2)), fiscalPeriod: `${2023 + (i % 2)}年第${(i % 12) + 1}期`,
    startTime: dstr(i), endTime: dstr(i, 1), remarks: '', status: i % 6 === 0 ? '1' : '0',
    createTime: dtime(i)
  })), [], 1)
fiscalApi.list = (p = {}) => fiscalApi.res.query(o => (!p.year || o.year === p.year), { page: p.page || 1, size: p.size || 10 })
// 供对账单选择会计期间（按类型排除已关账）
export const getFiscalOptions = (type = '') => mockRequest(fiscalApi.res.raw().map(o => ({ id: o.id, fiscalPeriod: o.fiscalPeriod, year: o.year })))

/* ============================ 9. 公司信用 ============================ */
export const creditApi = defineMock('fin_credit', () =>
  Array.from({ length: 14 }, (_, i) => {
    const type = at(['0', '1', '2', '3'], i), rating = at(CREDIT_RATING_LIST, i)
    return {
      id: i + 1, name: `${at(CLIENTS, i)}${pad(i + 1)}`, type, subtype: String(i % 3),
      estimatedCost: money(i), debts: Number((money(i) * 0.3).toFixed(2)),
      initialAmount: rating.rating, credits: rating.rating, creditRating: rating.code,
      notes: '', signContract: i % 4 === 0 ? '0' : '1',
      // 要素（申请调额/查看要素用）
      setupDate: `20${pad(10 + i % 10)}-01-01`, companySize: (i % 5 + 1) * 50,
      registeredCapital: `${(i % 9 + 1) * 100}万`, saleType: i % 2 === 0 ? '1' : '2',
      platform: at(['亚马逊', 'eBay', 'Shopify', 'Temu'], i), mainState: at(['美国', '德国', '日本'], i),
      storeLink: `https://shop${i}.example.com`, brand: `品牌${pad(i + 1)}`, trademark: i % 2 === 0 ? '是' : '否',
      cooperate: dstr(i), cooperationAmount: money(i), payment: at(['良好', '正常', '偏慢'], i),
      lastPayment: dstr(i, 1), overdueTimes: i % 4, overdueAmount: i % 4 ? money(i) : 0,
      // 标识
      locked: '0', advance: '0', collectionDelivery: '0', generateExpress: '1',
      printExpress: '1', platformRecord: '0', recordingRole: '2', maitou: '0',
      // 付款方式子表
      paytypeList: [], audit: '0', createTime: dtime(i)
    }
  }), ['name'], 1)
creditApi.list = (p = {}) => creditApi.res.query(o =>
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.creditRating || o.creditRating === p.creditRating),
  { page: p.page || 1, size: p.size || 10 })
export const getCreditRatingList = () => mockRequest(CREDIT_RATING_LIST)
// 信用要素-发票付款（子弹窗列表）
export const getCreditInvoiceList = (p = {}) => invoiceRes.query(o => o.type === 'P', { page: p.page || 1, size: p.size || 10 })

/* ============================ 10. 风险控制（冻结/风险订单） ============================ */
export const riskOrderApi = defineMock('fin_risk_order', () =>
  Array.from({ length: 18 }, (_, i) => {
    const cur = at(CUR, i), type = String(i % 5)
    return {
      id: i + 1, code: `KP${600000 + i}`, type,
      lscValue: `${at(['美国', '欧洲', '日本'], i)}专线`,
      custName: at(CLIENTS, i), buyerName: at(CLIENTS, i + 1), sellerName: 'SYSTEM总部',
      createTime: dtime(i), freezeRemark: i % 3 === 0 ? '信用额度不足冻结' : '',
      warehouseName: `${at(['深圳', '广州', '东莞'], i)}仓`, customs0: String(i % 2),
      pickType: String(i % 4), deliveryWay: String(i % 4), packages: (i % 50) + 5,
      value: money(i), currencyKey: cur, ifLoading: String(i % 3),
      audit: at(['0', '1', '2', '3'], i), auditReason: '',
      ifFrozen: i % 3 === 0, ifLocked: i % 4 === 0, beShip: false, insufficient: i % 3 === 0,
      enabled: i % 7 !== 0, applyTag: false, fullorderInsufficient: i % 3 === 0,
      payMethod: String(i % 2), overdue: i % 4 === 0,
      wsIn: String(i % 8), wsOut: String(i % 6), measure: i % 3 === 0 ? '7' : String(i % 8),
      examine: String(i % 5), customDeclaration: at(['415', '416', '417', '418'], i),
      totalPrice: money(i), priceCurrency: cur, cutoffTime: dstr(i, 2),
      trackingNos: i % 4 === 0 ? `TRK${i}001,TRK${i}002` : '',
      files: [{ fileName: `报关单-${i}.pdf`, status: String(i % 4), auditName: '张三', auditTime: dtime(i) }]
    }
  }), [], 1)
riskOrderApi.list = (p = {}) => riskOrderApi.res.query(o =>
  (!p.keyIndex || (p.keyIndex === '1' && o.overdue) || (p.keyIndex === '2' && o.insufficient) || (p.keyIndex === '3' && o.ifFrozen)) &&
  (!p.audit || o.audit === p.audit) &&
  (p.type === '' || p.type == null || o.type === p.type) &&
  (!p.keyWord || String(o[(p.selectType || '1') === '2' ? 'custName' : 'code'] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
riskOrderApi.auditOrder = (id, audit, reason = '') => riskOrderApi.res.update(id, { audit, auditReason: reason })
riskOrderApi.addFrost = (id, remark) => riskOrderApi.res.update(id, { ifFrozen: true, freezeRemark: remark, applyTag: false })
riskOrderApi.applyFrost = id => riskOrderApi.res.update(id, { applyTag: true })
riskOrderApi.removeFrost = id => riskOrderApi.res.update(id, { ifFrozen: false, freezeRemark: '', applyTag: false })
riskOrderApi.special = id => riskOrderApi.res.update(id, { beShip: true })
riskOrderApi.auditOut = (id, audit) => riskOrderApi.res.update(id, { fullorderInsufficient: audit !== '1' })

/* ============================ 11. 专线订单 ============================ */
export const finOrderApi = defineMock('fin_line_order', () =>
  Array.from({ length: 18 }, (_, i) => {
    const cur = at(CUR, i), type = at(['0', '1', '2', '4'], i)
    const amount = money(i), exRate = RATE[cur]
    return {
      id: i + 1, code: `KP${700000 + i}`, custName: at(CLIENTS, i), custType: String(i % 2),
      orderStatusName: at(['已下单', '已入仓', '运输中', '已到港', '已签收'], i),
      describe: '', updateAt: dtime(i), createTime: dtime(i), wsInTime: dstr(i, 1),
      wareHouseAt: `${at(['深圳', '广州'], i)}仓`, buyerName: at(CLIENTS, i + 1), sellerName: 'SYSTEM总部',
      salesman: at(['业务A', '业务B', '业务C'], i), finances: at(['财务A', '财务B'], i), customers: at(['客服A', '客服B'], i),
      addressType: String(i % 3), country: at(['美国', '德国', '日本'], i), province: '加州', city: '洛杉矶',
      warehouse: at(['ONT8', 'LAX9', 'FRA3'], i), lscValue: `${at(['美国', '欧洲', '日本'], i)}专线`,
      type, customs0: String(i % 2), includeTax: i % 2 === 0, deliveryWay: String(i % 5),
      expressName: at(['DHL', 'FedEx', 'UPS'], i), trackingNos: i % 3 === 0 ? `TRK${i}` : '',
      containerNo: type === '1' ? `CN${5000 + i}` : '', billNo: type === '1' ? `BL${3000 + i}` : '',
      batch: `B${pad(i + 1)}`, packages: (i % 50) + 10,
      totalVolume: (i % 30) + 5, totalWeight: (i % 800) + 100, priceVolume: (i % 20) + 3, priceWeight: (i % 600) + 80,
      priceUnit: i % 2 === 0 ? '2' : '3', bulky: `1:${(i % 5) + 3}`, method: String(i % 5),
      credit: money(i), creditRating: at(['A', 'B', 'C'], i),
      invoiceTime: dstr(i, 2), amount, amountUnit: cur, selfAmount: countNum(amount, exRate), selfAmountUnit: 'CNY',
      payTime: dstr(i, 3), isPayment: i % 2 === 0, overDay: i % 4 === 0 ? (i % 15) : 0,
      cutoffTime: dstr(i, 2), audit: at(['0', '1', '2', '3'], i), remarks: ''
    }
  }), [], 1)
finOrderApi.list = (p = {}) => finOrderApi.res.query(o =>
  (!p.audit || o.audit === p.audit) &&
  (p.type === '' || p.type == null || o.type === p.type) &&
  (!p.keyWord || String(o[{ 1: 'code', 2: 'containerNo', 3: 'trackingNos', 4: 'billNo' }[p.selectType || 1]] ?? '').includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
finOrderApi.statistics = () => mockRequest({
  orderCount: 128, paymentCount: 86, unpaymentCount: 42, overDueCount: 12,
  shippedCount: 74, deliveringCount: 20, receiverCount: 54, billNotPaidCount: 30, abnormalCount: 6
})

/* ============================ 选择弹窗数据源 ============================ */
// 货币下拉（复用运营货币管理）
export const getCurrencyOptions = () => mockRequest(currencyApi.res.raw().map(c => ({ id: c.ccode, name: c.name, sign: c.sign })))
// 汇率取值（按币种返回对本币汇率）
export const getExRateValue = currencyId => mockRequest(RATE[currencyId] ?? 1)
// 选择原单号（按服务大类返回可开票订单）
export const getSelectableOrders = (p = {}) => {
  const rows = invoiceRes.raw().map(o => ({
    id: o.id, orderCode: o.orderCode, businessType: o.businessType, soNoList: o.soNoList,
    billNoList: o.billNoList, airNoList: o.airNoList, containerNoList: o.containerNoList,
    invDate: o.invDate, auditTime: o.auditTime, currencyName: o.currencyName, currencyId: o.currencyId,
    exRate: o.exRate, amount: o.amount, selfAmount: o.selfAmount, clientName: o.clientName
  }))
  return mockRequest(paginate(rows, { page: p.page || 1, size: p.size || 10 }))
}
// 选择请款申请单（付款单用，只取已通过）
export const getApprovedRequests = (p = {}) => requestApi.res.query(o => o.status === '1', { page: p.page || 1, size: p.size || 10 })
// 选择收款账号
export const getBankAccounts = (p = {}) => mockRequest(paginate(
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, acctName: `${at(['招商', '中国', '工商'], i)}银行账户${i + 1}`, type: String(i % 5),
    acctNo: `62220000${pad(i)}`, currencyName: CUR_NAME[at(CUR, i)], countryName: at(['中国', '美国', '德国'], i)
  })), { page: p.page || 1, size: p.size || 10 }))
