// 系统管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const WEIGHT_TYPES = ['实重', '体积重', '取大']
export const AIRLINES = ['国航', '东航', '南航']
export const LICENSE_TYPES = ['A2', 'B2', 'C1']
export const CAR_TYPES = ['厢式', '平板', '冷藏']
export const AUDIT_STATUS = ['待审核', '通过', '拒绝']
export const COMMISSION_TYPES = ['固定', '比例']
export const PLAN_STATUS = ['待执行', '已完成']
export const CYCLES = ['每日', '每周', '每月']
export const CHANNELS = ['站内', '短信', '邮件']
export const NOTICE_EVENTS = ['下单', '签收', '异常']
export const NOTICE_TYPES = ['系统', '业务', '公告']
export const READ_STATUS = ['未读', '已读']
export const FEEDBACK_TYPES = ['建议', '投诉', '咨询']
export const HANDLE_STATUS = ['待处理', '已处理']
export const SCENES = ['订单', '运单', '财务']
const st = i => (i % 5 === 0 ? '禁用' : '启用')
const money = i => Number((((i * 37) % 2000) + 20).toFixed(2))

export const weightApi = defineMock('sys_weight', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `计重规则${pad(i + 1)}`, type: at(WEIGHT_TYPES, i), factor: 5000 + i * 100, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const airApi = defineMock('sys_air', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `号段${pad(i + 1)}`, prefix: `${999 - i}`, airline: at(AIRLINES, i), status: st(i), createTime: seedTime(i) })), ['name', 'airline', 'status'])

export const driverApi = defineMock('sys_driver', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `司机${pad(i + 1)}`, phone: `138${String(10000000 + i * 137).slice(0, 8)}`, license: `L${100000 + i}`, type: at(LICENSE_TYPES, i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const carApi = defineMock('sys_car', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `粤B${10000 + i}`, type: at(CAR_TYPES, i), load: (i % 20) + 5, driver: `司机${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const commodityApi = defineMock('sys_commodity', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `商品${pad(i + 1)}`, hsCode: `${8500 + i}00`, audit: at(AUDIT_STATUS, i), customer: `客户${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'audit', 'status'])

export const productApi = defineMock('sys_product', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `产品${pad(i + 1)}`, sku: `SKU${10000 + i}`, brand: `品牌${pad((i % 5) + 1)}`, price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const commissionApi = defineMock('sys_commission', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `岗位提成${pad(i + 1)}`, type: at(COMMISSION_TYPES, i), ratio: (i % 15) + 1, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const pcApi = defineMock('sys_pc', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `PC配置${pad(i + 1)}`, ckey: `pc.key${i + 1}`, cvalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const pdaApi = defineMock('sys_pda', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `PDA配置${pad(i + 1)}`, ckey: `pda.key${i + 1}`, cvalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const deliveryApi = defineMock('sys_delivery', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `发货计划${pad(i + 1)}`, customer: `客户${pad(i + 1)}`, planDate: `2024-${pad((i % 12) + 1)}-15`, planStatus: at(PLAN_STATUS, i), status: st(i), createTime: seedTime(i) })), ['name', 'planStatus', 'status'])

export const subscribeApi = defineMock('sys_subscribe', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `订阅${pad(i + 1)}`, cycle: at(CYCLES, i), receiver: `接收人${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'cycle', 'status'])

export const noticeCfgApi = defineMock('sys_noticecfg', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `通知配置${pad(i + 1)}`, channel: at(CHANNELS, i), event: at(NOTICE_EVENTS, i), status: st(i), createTime: seedTime(i) })), ['name', 'channel', 'status'])

export const noticeCtrApi = defineMock('sys_noticectr', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `通知标题${pad(i + 1)}`, type: at(NOTICE_TYPES, i), read: at(READ_STATUS, i), date: seedTime(i), createTime: seedTime(i) })), ['name', 'type', 'read'])

export const noticeMngApi = defineMock('sys_noticemng', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `通知${pad(i + 1)}`, type: at(['系统', '公告'], i), publisher: `发布人${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const levelApi = defineMock('sys_level', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `${at(['普通', '白银', '黄金', '钻石'], i)}会员`, code: `LV${i + 1}`, score: (i + 1) * 100, discount: `${95 - i}折`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const setApi = defineMock('sys_set', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `系统设置${pad(i + 1)}`, skey: `sys.key${i + 1}`, svalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const feedbackApi = defineMock('sys_feedback', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `反馈${pad(i + 1)}`, customer: `客户${pad(i + 1)}`, type: at(FEEDBACK_TYPES, i), handle: at(HANDLE_STATUS, i), createTime: seedTime(i) })), ['name', 'type', 'handle'])

export const statusApi = defineMock('sys_status', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `状态${pad(i + 1)}`, code: `ST${100 + i}`, scene: at(SCENES, i), status: st(i), createTime: seedTime(i) })), ['name', 'scene', 'status'])
