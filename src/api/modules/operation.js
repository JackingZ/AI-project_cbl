// 运营管理模块 mock 接口（基础配置类，共 24 个页面）
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
export const AREA_LEVELS = ['国家', '省州', '城市']
export const PORT_TYPES = ['机场', '海港']
export const AIRLINES = ['国航', '东航', '南航', '汉莎']
export const AGENCY_TYPES = ['报关行', '货代', '船代']
export const VEHICLE_TYPES = ['厢式货车', '平板车', '冷藏车']
export const CONTAINER_SPECS = ['20GP', '40GP', '40HQ']
export const CURRENCIES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD']
export const CURRENCY_CODES = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CNY']
export const TABOO_CATEGORIES = ['政治', '宗教', '违禁品']
export const DEPTS = ['运营', '财务', '客服', '仓储']
export const REPORT_TYPES = ['日报', '周报', '月报']
export const BIZ_TYPES = ['快递', '订舱', '卡派', '拖车', '报关']
export const DOC_TYPES = ['报关单', '装箱单', '发票']
export const FILE_TYPES = ['PDF', '图片', 'Excel']
export const EXAMINE_MODES = ['全检', '抽检', '免检']
export const PLATE_SPECS = ['PMC', 'PAG', 'AKE']
export const SHIP_STATUS = ['待发货', '已发货']
export const CSHIP_STATUS = ['待装柜', '已发货']
export const DELIVERY_MODES = ['自提', '送货上门']
export const OUTSOURC_STATUS = ['待处理', '已完成']
const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']
const st = i => (i % 5 === 0 ? '禁用' : '启用')

export const areaApi = defineMock('op_area', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: at(COUNTRIES, i) + at(['', '省', '市'], i), code: `AR${1000 + i}`, level: at(AREA_LEVELS, i), alias: `Area${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'level', 'status'])

export const portApi = defineMock('op_port', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: at(['深圳', '上海', '洛杉矶', '汉堡', '东京'], i) + at(PORT_TYPES, i), code: `PT${1000 + i}`, type: at(PORT_TYPES, i), country: at(COUNTRIES, i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const flightApi = defineMock('op_flight', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `${at(COUNTRIES, i)}航线`, flightNo: `CA${1000 + i}`, fromPort: '深圳', toPort: at(COUNTRIES, i), airline: at(AIRLINES, i), status: st(i), createTime: seedTime(i) })), ['name', 'airline', 'status'])

export const domesticAreaApi = defineMock('op_darea', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `区域${pad(i + 1)}`, code: `DA${1000 + i}`, province: at(['广东', '浙江', '江苏', '上海'], i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const agencyApi = defineMock('op_agency', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `服务机构${pad(i + 1)}`, code: `AG${1000 + i}`, type: at(AGENCY_TYPES, i), contact: `联系人${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const vehicleApi = defineMock('op_vehicle', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `车型${pad(i + 1)}`, type: at(VEHICLE_TYPES, i), load: (i % 20) + 5, volume: (i % 30) + 10, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const containerApi = defineMock('op_container', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `货柜${pad(i + 1)}`, containerNo: `CT${200000 + i}`, spec: at(CONTAINER_SPECS, i), status: st(i), createTime: seedTime(i) })), ['name', 'spec', 'status'])

export const fbaApi = defineMock('op_fba', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `FBA${at(COUNTRIES, i)}仓`, code: `FBA${1000 + i}`, country: at(COUNTRIES, i), address: `${at(COUNTRIES, i)}地址${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const rateApi = defineMock('op_rate', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, currency: at(CURRENCIES, i), rate: Number((6 + (i % 3) + 0.01 * (i % 90)).toFixed(4)), date: `2024-${pad((i % 12) + 1)}-15`, status: st(i), createTime: seedTime(i) })), ['currency', 'status'])

export const currencyApi = defineMock('op_currency', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: at(['美元', '欧元', '日元', '英镑', '澳元', '人民币'], i), ccode: at(CURRENCY_CODES, i), symbol: at(['$', '€', '¥', '£', 'A$', '￥'], i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const tabooApi = defineMock('op_taboo', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `禁忌词${pad(i + 1)}`, category: at(TABOO_CATEGORIES, i), remark: '', status: st(i), createTime: seedTime(i) })), ['name', 'category', 'status'])

export const generaApi = defineMock('op_genera', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `服务大类${pad(i + 1)}`, code: `SG${1000 + i}`, remark: '', status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const jobApi = defineMock('op_job', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `岗位${pad(i + 1)}`, code: `JB${1000 + i}`, dept: at(DEPTS, i), status: st(i), createTime: seedTime(i) })), ['name', 'dept', 'status'])

export const reportApi = defineMock('op_report', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `报表${pad(i + 1)}`, code: `RP${1000 + i}`, type: at(REPORT_TYPES, i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const factorApi = defineMock('op_factor', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `要素${pad(i + 1)}`, code: `${8500 + i}00`, unit: at(['个', '千克', '台', '套'], i), taxRate: (i % 20) + 1, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const orderTypeApi = defineMock('op_ordertype', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `下单配置${pad(i + 1)}`, bizType: at(BIZ_TYPES, i), status: st(i), createTime: seedTime(i) })), ['name', 'bizType', 'status'])

export const docApi = defineMock('op_doc', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `单证${pad(i + 1)}`, code: `DC${1000 + i}`, type: at(DOC_TYPES, i), status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const fileApi = defineMock('op_file', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `文件${pad(i + 1)}`, type: at(FILE_TYPES, i), path: `/files/${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

export const examineApi = defineMock('op_examine', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `验货配置${pad(i + 1)}`, mode: at(EXAMINE_MODES, i), ratio: (i % 50) + 10, status: st(i), createTime: seedTime(i) })), ['name', 'mode', 'status'])

export const plateApi = defineMock('op_plate', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `航空板${pad(i + 1)}`, code: `AP${1000 + i}`, spec: at(PLATE_SPECS, i), maxWeight: (i % 5 + 1) * 1000, status: st(i), createTime: seedTime(i) })), ['name', 'spec', 'status'])

export const singleApi = defineMock('op_single', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `FH${100000 + i}`, customer: `客户${pad(i + 1)}`, country: at(COUNTRIES, i), shipStatus: at(SHIP_STATUS, i), status: st(i), createTime: seedTime(i) })), ['name', 'shipStatus', 'status'])

export const cshipApi = defineMock('op_cship', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `ZG${100000 + i}`, containerNo: `CT${300000 + i}`, customer: `客户${pad(i + 1)}`, shipStatus: at(CSHIP_STATUS, i), status: st(i), createTime: seedTime(i) })), ['name', 'shipStatus', 'status'])

export const deliveryApi = defineMock('op_delivery', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `PS${100000 + i}`, customer: `客户${pad(i + 1)}`, address: `派送地址${pad(i + 1)}`, mode: at(DELIVERY_MODES, i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const outsourcApi = defineMock('op_outsourc', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `WX${100000 + i}`, supplier: `外协商${pad(i + 1)}`, country: at(COUNTRIES, i), shipStatus: at(OUTSOURC_STATUS, i), status: st(i), createTime: seedTime(i) })), ['name', 'shipStatus', 'status'])
