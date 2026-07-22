// 服务配置模块 mock 接口：快递/订舱/卡派/拖车/报关/仓储/专线
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const EXPRESS_COMPANIES = ['DHL', 'FedEx', 'UPS']
export const TRAILER_TYPES = ['整柜', '拼柜']
export const IO_TYPES = ['进口', '出口']
export const WAREHOUSE_TYPES = ['普通', '冷藏', '保税']
const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']
const st = i => (i % 5 === 0 ? '禁用' : '启用')

export const expressSvc = defineMock('svc_express', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `快递服务${pad(i + 1)}`, company: at(EXPRESS_COMPANIES, i), country: at(COUNTRIES, i), status: st(i), createTime: seedTime(i) })), ['name', 'company', 'status'])

export const bookingSvc = defineMock('svc_booking', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `订舱服务${pad(i + 1)}`, shipping: `${at(['马士基', '中远', '达飞'], i)}`, route: `${at(COUNTRIES, i)}航线`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const truckSvc = defineMock('svc_truck', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `卡派服务${pad(i + 1)}`, area: `${at(COUNTRIES, i)}${at(['东部', '西部', '中部'], i)}`, provider: `服务商${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const trailerSvc = defineMock('svc_trailer', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `拖车服务${pad(i + 1)}`, type: at(TRAILER_TYPES, i), port: at(['深圳港', '上海港', '宁波港'], i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const customsSvc = defineMock('svc_customs', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `报关服务${pad(i + 1)}`, type: at(IO_TYPES, i), agency: `报关行${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const warehousingSvc = defineMock('svc_warehousing', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `仓储服务${pad(i + 1)}`, warehouse: `${at(COUNTRIES, i)}仓`, type: at(WAREHOUSE_TYPES, i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const privatelineSvc = defineMock('svc_private', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `专线服务${pad(i + 1)}`, country: at(COUNTRIES, i), days: (i % 10) + 3, status: st(i), createTime: seedTime(i) })), ['name', 'status'])
