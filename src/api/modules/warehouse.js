// 仓库管理模块 mock 接口（作业/任务类）
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
const WAREHOUSES = ['深圳仓', '上海仓', '宁波仓', '洛杉矶仓']
const wh = i => at(WAREHOUSES, i)
const container = i => `CT${200000 + i * 7}`
const order = i => `YD${100000 + i * 11}`

export const unloadApi = defineMock('wh_unload', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, applyNo: `XH${100000 + i}`, containerNo: container(i), warehouse: wh(i), taskStatus: i % 2 ? '已卸货' : '待卸货', date: seedTime(i), createTime: seedTime(i) })), ['applyNo~', 'taskStatus'])

export const measureApi = defineMock('wh_measure', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, applyNo: `JL${100000 + i}`, orderNo: order(i), weight: (i % 50) + 10, volume: Number(((i % 20) / 2 + 1).toFixed(2)), taskStatus: i % 2 ? '已计量' : '待计量', createTime: seedTime(i) })), ['applyNo~', 'taskStatus'])

export const trailerTaskApi = defineMock('wh_trailer', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, taskNo: `TT${100000 + i}`, containerNo: container(i), driver: `司机${pad(i + 1)}`, taskStatus: i % 2 ? '已完成' : '待处理', createTime: seedTime(i) })), ['taskNo~', 'taskStatus'])

export const removalApi = defineMock('wh_removal', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, taskNo: `CG${100000 + i}`, containerNo: container(i), warehouse: wh(i), taskStatus: i % 2 ? '已拆柜' : '待拆柜', createTime: seedTime(i) })), ['taskNo~', 'taskStatus'])

export const movingApi = defineMock('wh_moving', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, applyNo: `DB${100000 + i}`, fromWh: wh(i), toWh: wh(i + 1), taskStatus: i % 2 ? '已调拨' : '待调拨', createTime: seedTime(i) })), ['applyNo~', 'taskStatus'])

export const outputApi = defineMock('wh_output', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, applyNo: `CK${100000 + i}`, orderNo: order(i), warehouse: wh(i), taskStatus: i % 2 ? '已出库' : '待出库', createTime: seedTime(i) })), ['applyNo~', 'taskStatus'])

export const inventoryApi = defineMock('wh_inventory', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, applyNo: `PD${100000 + i}`, warehouse: wh(i), type: i % 2 ? '抽盘' : '全盘', taskStatus: i % 2 ? '已完成' : '盘点中', createTime: seedTime(i) })), ['applyNo~', 'type', 'taskStatus'])

export const examineApi = defineMock('wh_examine', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, applyNo: `YH${100000 + i}`, orderNo: order(i), result: i % 3 === 0 ? '不合格' : '合格', taskStatus: i % 2 ? '已验货' : '待验货', createTime: seedTime(i) })), ['applyNo~', 'result', 'taskStatus'])

export const anomalyApi = defineMock('wh_anomaly', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, code: `YC${100000 + i}`, orderNo: order(i), type: at(['破损', '缺件', '超重'], i), handle: i % 2 ? '已处理' : '待处理', createTime: seedTime(i) })), ['code~', 'type', 'handle'])

export const transferApi = defineMock('wh_transfer', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, taskNo: `HD${100000 + i}`, orderNo: order(i), newNo: `YD${900000 + i}`, taskStatus: i % 2 ? '已换单' : '待换单', createTime: seedTime(i) })), ['taskNo~', 'taskStatus'])

export const configApi = defineMock('wh_config', () =>
  Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: wh(i) + pad(i + 1), code: `WH${1000 + i}`, address: `${wh(i)}地址${pad(i + 1)}`, manager: `负责人${pad(i + 1)}`, status: i % 5 === 0 ? '禁用' : '启用', createTime: seedTime(i) })), ['name', 'status'])
