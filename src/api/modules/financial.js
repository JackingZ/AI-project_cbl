// 财务管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const RECV_STATUS = ['待开票', '已开票', '已作废']
export const PAY_STATUS = ['待付款', '已付款']
export const INVOICE_TYPES = ['增值税专票', '普票']
export const COLLECT_METHODS = ['银行转账', '支付宝', '现金']
export const PAY_METHODS = ['银行转账', '电汇']
export const AUDIT_STATUS = ['待审核', '通过', '拒绝']
export const CHECK_STATUS = ['待对账', '已对账']
export const PERIOD_STATUS = ['未关账', '已关账']
export const CREDIT_LEVELS = ['A', 'B', 'C']
export const RISK_TYPES = ['超额', '逾期', '黑名单']
export const RISK_ACTIONS = ['预警', '拦截']
export const SETTLE_STATUS = ['待结算', '已结算']
const money = i => Number((((i * 53) % 90000) + 1000).toFixed(2))
const dstr = i => `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`

export const recvApi = defineMock('fin_recv', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, invoiceNo: `FP${100000 + i}`, customer: `客户${pad(i + 1)}`, amount: money(i), invStatus: at(RECV_STATUS, i), date: dstr(i), createTime: seedTime(i) })), ['invoiceNo~', 'customer~', 'invStatus'])

export const payableApi = defineMock('fin_payable', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, invoiceNo: `FP${200000 + i}`, supplier: `供应商${pad(i + 1)}`, amount: money(i), invStatus: at(PAY_STATUS, i), date: dstr(i), createTime: seedTime(i) })), ['invoiceNo~', 'supplier~', 'invStatus'])

export const invoiceOutApi = defineMock('fin_out', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, invoiceNo: `KP${100000 + i}`, customer: `客户${pad(i + 1)}`, amount: money(i), type: at(INVOICE_TYPES, i), date: dstr(i), createTime: seedTime(i) })), ['invoiceNo~', 'customer~', 'type'])

export const collectApi = defineMock('fin_collect', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, orderNo: `SK${100000 + i}`, customer: `客户${pad(i + 1)}`, amount: money(i), method: at(COLLECT_METHODS, i), date: dstr(i), createTime: seedTime(i) })), ['orderNo~', 'customer~', 'method'])

export const cashApi = defineMock('fin_cash', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, applyNo: `SQ${100000 + i}`, applicant: `申请人${pad(i + 1)}`, amount: money(i), audit: at(AUDIT_STATUS, i), date: dstr(i), createTime: seedTime(i) })), ['applyNo~', 'applicant~', 'audit'])

export const paymentApi = defineMock('fin_payment', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, orderNo: `FK${100000 + i}`, supplier: `供应商${pad(i + 1)}`, amount: money(i), method: at(PAY_METHODS, i), date: dstr(i), createTime: seedTime(i) })), ['orderNo~', 'supplier~', 'method'])

export const checkApi = defineMock('fin_check', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, orderNo: `DZ${100000 + i}`, customer: `客户${pad(i + 1)}`, amount: money(i), checkStatus: at(CHECK_STATUS, i), date: dstr(i), createTime: seedTime(i) })), ['orderNo~', 'customer~', 'checkStatus'])

export const periodApi = defineMock('fin_period', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `2024年${pad(i + 1)}月`, year: '2024', periodStatus: at(PERIOD_STATUS, i), status: i % 5 === 0 ? '禁用' : '启用', createTime: seedTime(i) })), ['name', 'periodStatus', 'status'])

export const creditApi = defineMock('fin_credit', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, company: `${pad(i + 1)}贸易公司`, creditLimit: money(i), used: Number((money(i) * 0.4).toFixed(2)), level: at(CREDIT_LEVELS, i), status: i % 5 === 0 ? '禁用' : '启用', createTime: seedTime(i) })), ['company~', 'level', 'status'])

export const riskApi = defineMock('fin_risk', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `风控规则${pad(i + 1)}`, type: at(RISK_TYPES, i), action: at(RISK_ACTIONS, i), status: i % 5 === 0 ? '禁用' : '启用', createTime: seedTime(i) })), ['name', 'type', 'status'])

export const finOrderApi = defineMock('fin_order', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, orderNo: `ZX${100000 + i}`, customer: `客户${pad(i + 1)}`, amount: money(i), settleStatus: at(SETTLE_STATUS, i), date: dstr(i), createTime: seedTime(i) })), ['orderNo~', 'customer~', 'settleStatus'])
