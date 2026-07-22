// 价格管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const SURCHARGE_TYPES = ['超长', '超重', '危险品']
export const CHARGE_TYPES = ['固定', '按重', '按体积']
export const WAREHOUSE_CHARGE = ['按天', '按月', '按体积']
export const EXPRESS_COMPANIES = ['DHL', 'FedEx', 'UPS']
export const TRAILER_TYPES = ['整柜', '拼柜']
export const IO_TYPES = ['进口', '出口']
export const SERVICE_TYPES = ['快递', '订舱', '拖车']
const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']
const PORTS = ['深圳港', '上海港', '宁波港', '洛杉矶港', '汉堡港']
const st = i => (i % 5 === 0 ? '禁用' : '启用')
const money = i => Number((((i * 37) % 3000) + 50).toFixed(2))

export const surchargeApi = defineMock('price_surcharge', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `附加费${pad(i + 1)}`, type: at(SURCHARGE_TYPES, i), fee: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const chargeApi = defineMock('price_charge', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `收费项${pad(i + 1)}`, type: at(CHARGE_TYPES, i), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const privateApi = defineMock('price_private', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `专线${pad(i + 1)}`, country: at(COUNTRIES, i), price: money(i), days: (i % 10) + 3, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const expressApi = defineMock('price_express', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `快递产品${pad(i + 1)}`, company: at(EXPRESS_COMPANIES, i), price: money(i), country: at(COUNTRIES, i), status: st(i), createTime: seedTime(i) })), ['name', 'company', 'status'])

export const bookingApi = defineMock('price_booking', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `航线${pad(i + 1)}`, portFrom: at(PORTS, i), portTo: at(PORTS, i + 2), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const warehouseApi = defineMock('price_warehouse', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `仓储项${pad(i + 1)}`, type: at(WAREHOUSE_CHARGE, i), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const carApi = defineMock('price_car', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `卡派线路${pad(i + 1)}`, area: `${at(COUNTRIES, i)}区`, price: money(i), days: (i % 8) + 2, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const trailerApi = defineMock('price_trailer', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `拖车线路${pad(i + 1)}`, portFrom: at(PORTS, i), type: at(TRAILER_TYPES, i), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const customsApi = defineMock('price_customs', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `报关项${pad(i + 1)}`, type: at(IO_TYPES, i), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const supplierApi = defineMock('price_supplier', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `供应商价格${pad(i + 1)}`, supplier: `供应商${pad(i + 1)}`, service: at(SERVICE_TYPES, i), price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'service', 'status'])

export const outsourcApi = defineMock('price_outsourc', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `外协项${pad(i + 1)}`, supplier: `外协商${pad(i + 1)}`, price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])
