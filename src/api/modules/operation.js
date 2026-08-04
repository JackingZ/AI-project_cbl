// 运营管理模块 mock 接口（基础配置类，共 24 个页面）
import { defineMock, pad, at, seedTime } from '../mockCrud'
import { mockRequest } from '../mock'
import { REGIONS as _REGIONS } from './organizers'

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

// 地区联动辅助：基于机构管理 REGIONS 四级树，按上级名称取下级列表（供 4 个联动 el-select 复用）
export function getCountryOpts() {
  return _REGIONS.map(c => ({ id: c.value, name: c.value }))
}
export function getStateOpts(country) {
  const c = _REGIONS.find(x => x.value === country)
  return (c?.children || []).map(s => ({ id: s.value, name: s.value }))
}
export function getCityOpts(country, state) {
  const c = _REGIONS.find(x => x.value === country)
  const s = (c?.children || []).find(x => x.value === state)
  return (s?.children || []).map(ct => ({ id: ct.value, name: ct.value }))
}
export function getCountyOpts(country, state, city) {
  const c = _REGIONS.find(x => x.value === country)
  const s = (c?.children || []).find(x => x.value === state)
  const ct = (s?.children || []).find(x => x.value === city)
  return (ct?.children || []).map(co => ({ id: co.value, name: co.value }))
}

// 单位字典（对齐源：长度 measurement_type / 体积 VOLUME_TYPE / 重量 weight_type）
export const LENGTH_UNITS = [
  { value: 'CM', label: '厘米(CM)' }, { value: 'M', label: '米(M)' },
  { value: 'IN', label: '英寸(IN)' }, { value: 'FT', label: '英尺(FT)' }
]
export const VOLUME_UNITS = [
  { value: 'CBCM', label: '立方厘米(CBCM)' }, { value: 'CBM', label: '立方米(CBM)' },
  { value: 'CUIN', label: '立方英寸(CUIN)' }, { value: 'CUFT', label: '立方英尺(CUFT)' }
]
export const WEIGHT_UNITS = [
  { value: 'KG', label: '千克(KG)' }, { value: 'G', label: '克(G)' },
  { value: 'LB', label: '磅(LB)' }, { value: 'T', label: '吨(T)' }
]
// 长度单位 → 体积单位联动映射（源 onLength）
export const LENGTH_TO_VOLUME = { CM: 'CBCM', M: 'CBM', IN: 'CUIN', FT: 'CUFT' }

// 港口类型（0机场/1港口/2火车站/4口岸）
export const PORT_TYPE_OPTIONS = [
  { value: '0', label: '机场' }, { value: '1', label: '港口' },
  { value: '2', label: '火车站' }, { value: '4', label: '口岸' }
]
// 海关（服务机构）选项占位
export const CUSTOMS_OPTIONS = ['深圳海关', '上海海关', '宁波海关', '广州海关', '青岛海关']

// 国家省州（地区管理）：从 REGIONS 四级树展平为带 id/parentId/level 的节点集，树+表格动态读取
// level: 1国家 2省州 3城市 4区县。parentId=0 为根（国家）。
const buildAreaSeed = () => {
  const nodes = []
  let seq = 1
  const pinyin = s => s // 占位：英文名用名称本身
  const walk = (list, level, parentId) => {
    list.forEach((node, idx) => {
      const id = seq++
      nodes.push({
        id,
        parentId,
        level,
        name: node.value,
        abbr: node.value.slice(0, 2),
        alias: `${node.value}-EN`,
        code: `${level}${String(id).padStart(3, '0')}`
      })
      if (node.children && node.children.length) walk(node.children, level + 1, id)
    })
  }
  walk(_REGIONS, 1, 0)
  return nodes
}
export const areaApi = defineMock('op_area', buildAreaSeed, ['name'], 4)

// 机场港口：对齐源页（类型 type 0/1/2/4、名称 name、英文名 alias、三字代码 code、地区四级、海关 hsName）
const PORT_REGIONS = [
  { region: ['美国', '加利福尼亚州', '洛杉矶', '市中心区'], countryName: '美国' },
  { region: ['德国', '黑森', '法兰克福', '市中心'], countryName: '德国' },
  { region: ['日本', '东京都', '新宿', '西新宿'], countryName: '日本' },
  { region: ['英国', '英格兰', '伦敦', '金融城'], countryName: '英国' },
  { region: ['澳大利亚', '新南威尔士', '悉尼', 'CBD'], countryName: '澳大利亚' }
]
export const portApi = defineMock('op_port', () =>
  Array.from({ length: 14 }, (_, i) => {
    const r = PORT_REGIONS[i % PORT_REGIONS.length]
    return {
      id: i + 1,
      type: at(['0', '1', '2', '4'], i),
      name: at(['深圳', '上海', '洛杉矶', '汉堡', '东京'], i) + at(['机场', '港口', '火车站', '口岸'], i),
      alias: at(['SZX', 'SHA', 'LAX', 'HAM', 'TYO'], i) + 'PORT',
      code: at(['SZX', 'SHA', 'LAX', 'HAM', 'NRT'], i),
      region: r.region,
      countryName: r.region[0],
      stateName: r.region[1],
      cityName: r.region[2],
      countyName: r.region[3],
      address: `${r.region[2]}${at(['中心大道', '港区路', '临空路', '口岸大街'], i)}${i + 1}号`,
      postal: `${100000 + i * 137}`.slice(0, 6),
      hsName: at(CUSTOMS_OPTIONS, i),
      createTime: seedTime(i)
    }
  }), ['name'], 4)
// 港口关键字按 selectType 查 name(港口名称) 或 code(三字代码) + 港口类型/国家过滤
portApi.list = (p = {}) => portApi.res.query(o => {
  const kwField = p.selectType === '2' ? 'code' : 'name'
  return (!p.keyword || String(o[kwField] ?? '').includes(p.keyword)) &&
    (!p.type || o.type === p.type) &&
    (!p.countryName || o.countryName === p.countryName)
}, { page: p.page || 1, size: p.size || 10 })

// 国际航线：对齐源页（航线类型 type 0空运/1海运/2铁路/4卡航、名称 name、关联国家 countries、备注 remark）
export const ROUTE_TYPES = [
  { value: '0', label: '空运' }, { value: '1', label: '海运' },
  { value: '2', label: '铁路' }, { value: '4', label: '卡航' }
]
export const flightApi = defineMock('op_flight', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    type: at(['0', '1', '2', '4'], i),
    name: `${at(COUNTRIES, i)}${at(['空运', '海运', '铁路', '卡航'], i)}航线`,
    countries: [],
    remark: '',
    createTime: seedTime(i)
  })), ['name'], 4)

// 区域配置：4 tab（国内区域/城市分区/国家分区/仓库分区），各为 区域名+国家+多选关联 结构
// 国内区域：区域名/国家/省份多选(states)
export const dInternalApi = defineMock('op_darea_internal', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `国内区域${pad(i + 1)}`, countryName: at(COUNTRIES, i),
    states: [{ stateName: at(['加利福尼亚州', '黑森', '东京都', '英格兰', '新南威尔士'], i) }],
    remark: '', createTime: seedTime(i)
  })), ['name'], 4)
dInternalApi.list = (p = {}) => dInternalApi.res.query(o => !p.name || String(o.name).includes(p.name), { page: p.page || 1, size: p.size || 10 })
// 城市分区：区域名/国家/城市多选(result)
export const dCityApi = defineMock('op_darea_city', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `城市分区${pad(i + 1)}`, countryName: at(COUNTRIES, i),
    result: [{ cityName: at(['洛杉矶', '法兰克福', '新宿', '伦敦', '悉尼'], i) }],
    remark: '', createTime: seedTime(i)
  })), ['name'], 4)
dCityApi.list = (p = {}) => dCityApi.res.query(o => !p.name || String(o.name).includes(p.name), { page: p.page || 1, size: p.size || 10 })
// 国家分区：区域名/国家多选(result)
export const dCountryApi = defineMock('op_darea_country', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `国家分区${pad(i + 1)}`,
    result: [{ countryName: at(COUNTRIES, i) }, { countryName: at(COUNTRIES, i + 1) }],
    remark: '', createTime: seedTime(i)
  })), ['name'], 4)
dCountryApi.list = (p = {}) => dCountryApi.res.query(o => !p.name || String(o.name).includes(p.name), { page: p.page || 1, size: p.size || 10 })
// 仓库分区：区域名/国家/FBA仓库多选(result)
export const dWarehouseApi = defineMock('op_darea_wh', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1, name: `仓库分区${pad(i + 1)}`, countryName: at(COUNTRIES, i),
    result: [{ warehouseName: `FBA${at(COUNTRIES, i)}仓` }],
    remark: '', createTime: seedTime(i)
  })), ['name'], 4)
dWarehouseApi.list = (p = {}) => dWarehouseApi.res.query(o => !p.name || String(o.name).includes(p.name), { page: p.page || 1, size: p.size || 10 })

// 服务机构类型（0海关/1船东/2空运公司/3铁路公司/4快递公司/5卡派公司）
export const AGENCY_TYPE_OPTIONS = [
  { value: '0', label: '海关' }, { value: '1', label: '船东' }, { value: '2', label: '空运公司' },
  { value: '3', label: '铁路公司' }, { value: '4', label: '快递公司' }, { value: '5', label: '卡派公司' }
]
// 服务机构：类型/名称/英文名/全球代码/地区/服务国家(穿梭)/网址/logo
export const agencyApi = defineMock('op_agency', () => {
  const R = [
    { c: '美国', s: '加利福尼亚州', ci: '洛杉矶' },
    { c: '德国', s: '黑森', ci: '法兰克福' },
    { c: '日本', s: '东京都', ci: '新宿' },
    { c: '英国', s: '英格兰', ci: '伦敦' },
    { c: '澳大利亚', s: '新南威尔士', ci: '悉尼' }
  ]
  return Array.from({ length: 12 }, (_, i) => {
    const r = R[i % R.length]
    return {
      id: i + 1,
      type: String(i % 6),
      name: `服务机构${pad(i + 1)}`,
      alias: `Agency${i + 1}`,
      code: `AG${1000 + i}`,
      countryName: r.c, stateName: r.s, cityName: r.ci,
      url: `https://agency${i + 1}.example.com`,
      logo: '',
      serviceIds: [((i % 5) + 1)],
      serviceNames: [at(COUNTRIES, i)],
      createTime: seedTime(i)
    }
  })
}, ['name'], 4)
// 服务机构按 类型/服务国家/国家州省城市/名称 过滤
agencyApi.list = (p = {}) => agencyApi.res.query(o =>
  (!p.type || o.type === p.type) &&
  (!p.serviceCountry || (o.serviceIds || []).includes(p.serviceCountry)) &&
  (!p.countryName || o.countryName === p.countryName) &&
  (!p.stateName || o.stateName === p.stateName) &&
  (!p.cityName || o.cityName === p.cityName) &&
  (!p.name || String(o.name).includes(p.name)),
  { page: p.page || 1, size: p.size || 10 })

// 车型管理：对齐源页（国家 countries 穿梭/名称/英文名/长宽高+长度单位/装载体积+体积单位/最大限重+重量单位/座位数）
export const vehicleApi = defineMock('op_vehicle', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `车型${pad(i + 1)}`,
    alias: `Vehicle${i + 1}`,
    countries: [{ countryId: (i % 5) + 1, countryName: `${at(COUNTRIES, i)}-${at(['USA', 'Germany', 'Japan', 'UK', 'Australia'], i)}` }],
    umLength: 'CM', umVolume: 'CBCM', umWeight: 'KG',
    length: (i % 5 + 4) * 100, width: 200 + i * 5, height: 200 + i * 8,
    volume: (i % 20 + 10) * 100, loadLimit: (i % 10 + 5) * 1000, seats: (i % 3) + 2,
    createTime: seedTime(i)
  })), ['name'], 4)
// 车型按国家(countries 含 countryId) + 名称过滤
vehicleApi.list = (p = {}) => vehicleApi.res.query(
  o => (!p.name || String(o.name).includes(p.name)) &&
    (!p.countryId || (o.countries || []).some(c => c.countryId === p.countryId)),
  { page: p.page || 1, size: p.size || 10 }
)

// 货柜管理：对齐源页（柜型名称/英文名/长宽高+长度单位/装载体积+体积单位/最大限重+重量单位；无国家、无座位数）
export const containerApi = defineMock('op_container', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `货柜${pad(i + 1)}`,
    alias: `Container${i + 1}`,
    umLength: 'CM', umVolume: 'CBCM', umWeight: 'KG',
    length: (i % 4 + 6) * 100, width: 230 + i * 3, height: 250 + i * 4,
    volume: (i % 30 + 20) * 100, loadLimit: (i % 15 + 10) * 1000,
    createTime: seedTime(i)
  })), ['name'], 4)

// FBA仓库类型（0亚马逊/1海外仓）
export const FBA_TYPE_OPTIONS = [
  { value: '0', label: '亚马逊' }, { value: '1', label: '海外仓' }
]
// FBA仓库：对齐源页（类型/编码/地区/多地址/邮编/收货公司/联系人邮箱电话/type条件字段/启用状态）
export const fbaApi = defineMock('op_fba', () => {
  const R = [
    { c: '美国', s: '加利福尼亚州', ci: '洛杉矶' },
    { c: '德国', s: '黑森', ci: '法兰克福' },
    { c: '日本', s: '东京都', ci: '新宿' },
    { c: '英国', s: '英格兰', ci: '伦敦' },
    { c: '澳大利亚', s: '新南威尔士', ci: '悉尼' }
  ]
  return Array.from({ length: 12 }, (_, i) => {
    const r = R[i % R.length]
    const type = i % 2 === 0 ? '0' : '1'
    return {
      id: i + 1,
      type,
      ifHave: type === '1' ? (i % 2) : 0,
      code: `FBA${1000 + i}`,
      countryName: r.c, stateName: r.s, cityName: r.ci,
      address: `${r.ci}${at(['中心街', '港区路', '仓储大道'], i)}${i + 1}号`,
      address1: '', address2: '',
      postal: `${100000 + i * 137}`.slice(0, 6),
      recipient: type === '0' ? 'Amazon' : `${r.c}收货公司`,
      contact: `联系人${pad(i + 1)}`,
      email: `fba${i + 1}@jht.com`,
      phone: `1380000${pad(i)}00`,
      maxSize: type === '0' ? (i % 3 + 1) * 60 : undefined,
      maxWeight: type === '0' ? (i % 5 + 1) * 20 : undefined,
      isDirect: type === '0' ? (i % 2) : undefined,
      status: i % 5 === 0 ? '0' : '1',
      createTime: seedTime(i)
    }
  })
}, ['code'], 4)
// FBA 按 类型/国家名/州省名/城市名/启用状态/编码 过滤
fbaApi.list = (p = {}) => fbaApi.res.query(o =>
  (!p.type || o.type === p.type) &&
  (!p.countryName || o.countryName === p.countryName) &&
  (!p.stateName || o.stateName === p.stateName) &&
  (!p.cityName || o.cityName === p.cityName) &&
  (!p.status || o.status === p.status) &&
  (!p.code || String(o.code).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })

// 汇率记录：货币对主表（本币/目标币）+ 汇率历史子表（生效日期/汇率）两级结构
// 主表 exchange：lcId/lcName/lcCode/fcId/fcName/fcCode/rate(最新汇率)/updateTime
export const rateApi = defineMock('op_rate', () => {
  const pairs = [
    { lc: ['美元', 'USD'], fc: ['人民币', 'CNY'], rate: 7.12 },
    { lc: ['欧元', 'EUR'], fc: ['人民币', 'CNY'], rate: 7.78 },
    { lc: ['日元', 'JPY'], fc: ['人民币', 'CNY'], rate: 0.048 },
    { lc: ['英镑', 'GBP'], fc: ['人民币', 'CNY'], rate: 9.05 },
    { lc: ['美元', 'USD'], fc: ['日元', 'JPY'], rate: 149.3 }
  ]
  return pairs.map((p, i) => ({
    id: i + 1,
    lcName: p.lc[0], lcCode: p.lc[1],
    fcName: p.fc[0], fcCode: p.fc[1],
    rate: p.rate,
    updateTime: seedTime(i)
  }))
}, [], 4)

// 汇率历史子表：exchangeId 关联主表，effective 生效日期，rate 汇率
export const exRateApi = defineMock('op_exrate', () =>
  Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    exchangeId: (i % 5) + 1,
    effective: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
    rate: Number((6 + (i % 4) + 0.01 * (i % 90)).toFixed(4))
  })), [], 4)
// 子表按 exchangeId 过滤 + 按生效日期倒序
exRateApi.list = (p = {}) => exRateApi.res.query(
  o => !p.exchangeId || o.exchangeId === p.exchangeId,
  { page: p.page || 1, size: p.size || 10 }
)

// 货币管理：对齐源页（中文名称 name/英文名称 alias/货币编码 ccode 3位字母/货币符号 sign/通用国家 countries）
// 注：源用货币编码作主键 id，新项目 persist 依赖数字自增 id，故编码用 ccode 承载（业务编码），id 仍为自增主键。
export const currencyApi = defineMock('op_currency', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: at(['美元', '欧元', '日元', '英镑', '澳元', '人民币'], i),
    alias: at(['US Dollar', 'Euro', 'Japanese Yen', 'Pound', 'Aus Dollar', 'RMB'], i),
    ccode: at(CURRENCY_CODES, i),
    sign: at(['$', '€', '¥', '£', 'A$', '￥'], i),
    countries: [],
    createTime: seedTime(i)
  })), ['name'], 4)

// 国家/地区下拉选项（供禁忌词语/货币/航线等关联穿梭，占位对齐）
export const COUNTRY_OPTIONS = [
  { id: 1, name: '美国', alias: 'USA' }, { id: 2, name: '德国', alias: 'Germany' },
  { id: 3, name: '日本', alias: 'Japan' }, { id: 4, name: '英国', alias: 'UK' },
  { id: 5, name: '澳大利亚', alias: 'Australia' }, { id: 6, name: '加拿大', alias: 'Canada' },
  { id: 7, name: '法国', alias: 'France' }, { id: 8, name: '意大利', alias: 'Italy' },
  { id: 9, name: '西班牙', alias: 'Spain' }, { id: 10, name: '韩国', alias: 'Korea' }
]

// 禁忌词语：对齐源页（禁忌词语 words/禁忌程度 degree 0禁运1需证书/关联禁忌国家 countries；无搜索栏，全 CRUD + 关联国家）
export const tabooApi = defineMock('op_taboo', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    words: `禁忌词语${pad(i + 1)}（Taboo${i + 1}）`,
    degree: i % 3 === 0 ? '1' : '0',
    countries: [],
    createTime: seedTime(i)
  })), ['words'], 4)

// 服务大类：主表(名称/关联公司 supplier|agent|customer 布尔/排序) + 服务类型子表(计费区间)
export const generaApi = defineMock('op_genera', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `服务大类${pad(i + 1)}`,
    supplier: i % 2 === 0, agent: i % 3 === 0, customer: true,
    sort: i + 1,
    createTime: seedTime(i)
  })), ['name'], 4)
// 服务大类按 公司类型(type 1客户/2代理商/3供应商) + 名称 过滤
generaApi.list = (p = {}) => generaApi.res.query(o => {
  const typeOk = !p.type ||
    (p.type === '1' && o.customer) || (p.type === '2' && o.agent) || (p.type === '3' && o.supplier)
  return typeOk && (!p.name || String(o.name).includes(p.name))
}, { page: p.page || 1, size: p.size || 10 })

// 服务类型子表：typeId 关联服务大类，overdue 逾期计费(0按重量/1按体积/2按比例)，overdueCharges 计费区间数组
export const subtypeApi = defineMock('op_subtype', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    typeId: (i % 10) + 1,
    name: `服务类型${pad(i + 1)}`,
    overdue: String(i % 3),
    overdueCharges: [{ lower: 0, upper: (i % 5 + 1) * 100, amount: (i % 10 + 1) * 1.5 }]
  })), [], 4)
subtypeApi.list = (p = {}) => subtypeApi.res.query(
  o => !p.typeId || o.typeId === p.typeId,
  { page: p.page || 1, size: p.size || 10 }
)

// 服务大类下拉选项（供任务单证/岗位设置等关联，取 generaApi 种子名）
export const SERVICE_TYPES = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `服务大类${pad(i + 1)}` }))

// 公司/企业类型选项（0聚货通/1客户/2代理商/3供应商）— 供岗位设置/服务大类/服务机构等复用
export const ORG_TYPE_OPTIONS = [
  { value: '0', label: '聚货通' }, { value: '1', label: '客户' },
  { value: '2', label: '代理商' }, { value: '3', label: '供应商' }
]
// 岗位类别选项（源字典 POST_TYPE1，占位）
export const POST_TYPES = [
  { value: '1', label: '管理岗' }, { value: '2', label: '操作岗' },
  { value: '3', label: '客服岗' }, { value: '4', label: '财务岗' }, { value: '5', label: '销售岗' }
]
// 岗位设置：对齐源页（岗位名称 name/企业类型 type多选/服务大类 subtypeId多选+subtypeName/岗位类别 postType；仅新增+编辑，无删除）
export const jobApi = defineMock('op_job', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `岗位${pad(i + 1)}`,
    type: [String(i % 4)],
    subtypeId: [(i % 8) + 1],
    subtypeName: `服务大类${pad((i % 8) + 1)}`,
    postType: String((i % 5) + 1),
    createTime: seedTime(i)
  })), ['name'], 4)
// 岗位设置公司类型为多值数组，需按"包含"过滤（defineMock 精确匹配不适用），故自定义 list
jobApi.list = (p = {}) => jobApi.res.query(
  o => (!p.name || String(o.name).includes(p.name)) && (!p.type || (o.type || []).includes(p.type)),
  { page: p.page || 1, size: p.size || 10 }
)

// 报表定义：对齐源页当前启用模型（报表名称 name/报表标识 tag/报表地址 ip；新增+编辑，无删除）
export const reportApi = defineMock('op_report', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `报表${pad(i + 1)}`,
    tag: `RPT_${1000 + i}`,
    ip: `http://report.jht.com/api/v1/report/${1000 + i}`,
    createTime: seedTime(i)
  })), ['name'], 4)

// 报关要素：对齐源页（中英文名/品牌/型号/中英材质/中英用途/备注/海关编码 codes/启用状态 deleted 0启用1禁用）
const CN_GOODS = ['蓝牙耳机', '保温杯', '瑜伽垫', '数据线', 'LED灯', '积木玩具', '手机壳', '登山包', '电动牙刷', '筋膜枪', '行李箱', '空气炸锅']
const EN_GOODS = ['Bluetooth Earphone', 'Vacuum Cup', 'Yoga Mat', 'Data Cable', 'LED Light', 'Building Blocks', 'Phone Case', 'Hiking Bag', 'Electric Toothbrush', 'Massage Gun', 'Luggage', 'Air Fryer']
export const factorApi = defineMock('op_factor', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    cnName: at(CN_GOODS, i),
    enName: at(EN_GOODS, i),
    brand: `Brand${pad(i + 1)}`,
    model: `MDL-${1000 + i}`,
    cnMeterial: at(['塑料', '金属', '硅胶', '布料'], i),
    enMeterial: at(['Plastic', 'Metal', 'Silicone', 'Fabric'], i),
    cnUsage: at(['家用', '办公', '运动', '户外'], i),
    enUsage: at(['Home', 'Office', 'Sports', 'Outdoor'], i),
    remarks: '',
    deleted: i % 5 === 0 ? 1 : 0,
    codes: [{ countryId: (i % 5) + 1, customCode: `${8500 + i}00`, customCodeN: `${8500 + i}99` }],
    createTime: seedTime(i)
  })), [], 4)
// 报关要素按 国家(codes含)/状态 deleted/关键字(keyType→cnName/enName/customCode) 过滤
factorApi.list = (p = {}) => factorApi.res.query(o => {
  const kwOk = !p.keyword ||
    (p.keyType === '1' && String(o.cnName ?? '').includes(p.keyword)) ||
    (p.keyType === '2' && String(o.enName ?? '').includes(p.keyword)) ||
    (p.keyType === '3' && (o.codes || []).some(c => String(c.customCode ?? '').includes(p.keyword)))
  return kwOk &&
    (p.enabled == null || p.enabled === '' || String(o.deleted) === p.enabled) &&
    (!p.countryId || (o.codes || []).some(c => c.countryId === p.countryId))
}, { page: p.page || 1, size: p.size || 10 })

// 下单配置：主表(服务大类/下单配置名/备注/更新时间) + 关联(服务名称/服务项目/附加服务)
// 服务名称/服务项目/附加服务 选项（静态占位）
export const PLO_SERVICE_NAMES = [{ id: 1, name: '标准派送' }, { id: 2, name: '加急派送' }, { id: 3, name: '预约派送' }, { id: 4, name: '签名服务' }]
export const PLO_SERVICE_ITEMS = [{ id: 1, name: '贴标服务' }, { id: 2, name: '换标服务' }, { id: 3, name: '拍照服务' }, { id: 4, name: '打托服务' }, { id: 5, name: '质检服务' }]
export const PLO_ADDITIONAL_ITEMS = [{ id: 1, name: '保险服务' }, { id: 2, name: '木架加固' }, { id: 3, name: '超尺寸处理' }, { id: 4, name: '危险品申报' }]
export const orderTypeApi = defineMock('op_ordertype', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    serviceTypeId: (i % 8) + 1,
    serviceTypeName: `服务大类${pad((i % 8) + 1)}`,
    name: `下单配置${pad(i + 1)}`,
    remark: '',
    serviceName: '',            // 服务名称（单选，存名称）
    addedItems: [],             // 服务项目关联 [{itemId,itemName,attachment,required,type}]
    additionalItems: [],        // 附加服务关联 [{itemId,itemName,attachment,required,type:'2'}]
    updateTime: seedTime(i)
  })), ['name'], 4)
// 下单配置按 服务大类 + 名称 过滤
orderTypeApi.list = (p = {}) => orderTypeApi.res.query(
  o => (!p.serviceTypeId || o.serviceTypeId === p.serviceTypeId) &&
    (!p.name || String(o.name).includes(p.name)),
  { page: p.page || 1, size: p.size || 10 }
)

// 任务单证：对齐源页（名称/任务时长分钟/关联服务大类/添加时间/备注；仅编辑，无增删）
export const docApi = defineMock('op_doc', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `任务单${pad(i + 1)}`,
    time: (i % 8 + 1) * 15,
    serviceTypeId: (i % 8) + 1,
    serviceTypeName: `服务大类${pad((i % 8) + 1)}`,
    remark: '',
    updateTime: seedTime(i)
  })), ['name'], 4)

// 文件配置：所属模块→文件类别级联 + 国家 + 文件名称(带出描述) + 文件类型 + 是否必要/审核
export const FILE_MODULES = [
  { id: 1, moduleName: '订单模块' }, { id: 2, moduleName: '报关模块' },
  { id: 3, moduleName: '仓储模块' }, { id: 4, moduleName: '财务模块' }
]
// 文件类别（按模块 id 分组）
export const FILE_TYPES_BY_MODULE = {
  1: [{ id: 11, fileType: '委托书' }, { id: 12, fileType: '装箱单' }],
  2: [{ id: 21, fileType: '报关单' }, { id: 22, fileType: '报关委托' }],
  3: [{ id: 31, fileType: '入库单' }, { id: 32, fileType: '出库单' }],
  4: [{ id: 41, fileType: '发票' }, { id: 42, fileType: '付款凭证' }]
}
// 文件名称字典（带描述）
export const FILE_NAME_DICT = [
  { value: 1, label: '进口委托书', description: '进口业务委托文件' },
  { value: 2, label: '商业发票', description: '商业发票文件' },
  { value: 3, label: '装箱清单', description: '货物装箱明细' },
  { value: 4, label: '提单副本', description: '提单扫描件' },
  { value: 5, label: '原产地证', description: '原产地证明文件' }
]
// 文件类型（excel1/word2/pdf3/text4/图片5/其他6）
export const FILE_EXT_OPTIONS = [
  { value: 1, label: 'excel' }, { value: 2, label: 'word' }, { value: 3, label: 'pdf' },
  { value: 4, label: 'text' }, { value: 5, label: '图片' }, { value: 6, label: '其他' }
]
export const fileApi = defineMock('op_file', () =>
  Array.from({ length: 10 }, (_, i) => {
    const mod = FILE_MODULES[i % FILE_MODULES.length]
    const types = FILE_TYPES_BY_MODULE[mod.id]
    const t = types[i % types.length]
    const dict = FILE_NAME_DICT[i % FILE_NAME_DICT.length]
    return {
      id: i + 1,
      moduleCode: mod.id, moduleName: mod.moduleName,
      typeCode: t.id, fileType: t.fileType,
      countryCode: (i % 5) + 1, countryName: at(COUNTRIES, i),
      dictId: dict.value, fileName: dict.label, fileDesc: dict.description,
      fileExt: (i % 6) + 1,
      ifNeed: i % 2, ifAudit: i % 2 === 0 ? 1 : 0,
      createTime: seedTime(i)
    }
  }), ['fileName'], 4)
// 文件配置按 模块/类别/国家/文件名称 过滤
fileApi.list = (p = {}) => fileApi.res.query(o =>
  (!p.moduleCode || o.moduleCode === p.moduleCode) &&
  (!p.typeCode || o.typeCode === p.typeCode) &&
  (!p.countryCode || o.countryCode === p.countryCode) &&
  (!p.fileName || String(o.fileName).includes(p.fileName)),
  { page: p.page || 1, size: p.size || 10 })

// 验货配置选项
export const EXAMINE_TYPE = [{ value: '0', label: '按产品' }, { value: '2', label: '按比例' }]
export const EXAMINE_DEGREE = [
  { id: '0', name: '纯电' }, { id: '1', name: '带电' }, { id: '2', name: '强磁' },
  { id: '3', name: '弱磁' }, { id: '4', name: '液体' }, { id: '5', name: '粉末' }
]
export const EXAMINE_ITEMS = [
  { id: '0', name: '售后地址' }, { id: '1', name: '厂商信息' }, { id: '2', name: '生产批号' },
  { id: '3', name: '五国说明书' }, { id: '4', name: '包装五国文字' }
]
export const EXAMINE_CHECK = [{ id: '0', name: '原产地' }, { id: '1', name: '工厂信息' }]
export const EXAMINE_MIC = [{ id: '0', name: '外箱' }, { id: '1', name: '内件' }]
export const EXAMINE_IMGTIME = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `${i + 1}个月` }))
// 验货配置：对齐源 addEditForm 16 项；关联数组字段直存（不做源的逗号串转换，存储层简化）
export const examineApi = defineMock('op_examine', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `验货配置${pad(i + 1)}`,
    type: i % 2 === 0 ? '0' : '2',
    ratio: i % 2 === 0 ? undefined : ((i % 90) + 1),
    degreeArr: [String(i % 6)],
    retain: (i % 12) + 1,
    itemsArr: [String(i % 5)],
    micArr: [], boxArr: [], goodsArr: [],
    pick: i % 2 === 0 ? '0' : '1',
    size: i % 2 === 0,
    overweight: false, electrified: false, danger: false, bag: false, binding: false,
    createTime: seedTime(i)
  })), ['name'], 4)
// 验货配置按 验货方式 type + 名称 过滤
examineApi.list = (p = {}) => examineApi.res.query(
  o => (!p.type || o.type === p.type) && (!p.name || String(o.name).includes(p.name)),
  { page: p.page || 1, size: p.size || 10 }
)

// 航空板：对齐源页（规格名称/英文名/长宽高/支持最大体积/支持最大重量/长度单位/重量单位；无体积单位下拉）
export const plateApi = defineMock('op_plate', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `航空板${pad(i + 1)}`,
    alias: at(PLATE_SPECS, i) + (i + 1),
    umLength: 'CM', umVolume: 'CBCM', umWeight: 'KG',
    length: 300 + i * 5, width: 200 + i * 4, height: 150 + i * 3,
    volume: (i % 10 + 5) * 100, loadLimit: (i % 5 + 1) * 1000,
    createTime: seedTime(i)
  })), ['name'], 4)
// 航空板查询：源用 model.searchKey 包裹，此处等价按 name 过滤

// 分单发货：27列宽表（业务/服务类型/订舱服务/柜量/柜号提单号/运输类型/服务机构编码/港口国家/各环节状态位/派送/日期/目的仓/备注）
const YN = i => (i % 2)
export const singleApi = defineMock('op_single', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    keyCode: `YD${String(100000 + i * 37).slice(0, 6)}`,
    type: String(i % 4),
    transType: String(i % 5),
    bsc: { name: `订舱服务${pad(i + 1)}`, serviceCode: `SVC${1000 + i}` },
    containers: Array.from({ length: (i % 3) + 1 }, () => ({ containerNo: `CT${String(200000 + i * 91).slice(0, 6)}`, billNo: `BL${String(600000 + i * 71).slice(0, 6)}`, containerInfo: { containerName: at(['PMC板', '40HQ', '20GP', '厢式货车'], i) } })),
    org: { value: `服务机构${pad((i % 5) + 1)}` },
    originPort: { value: at(['深圳港', '上海港', '宁波港'], i) }, targetPort: { value: at(['洛杉矶港', '汉堡港', '东京港'], i) },
    originCountry: { value: '中国' }, targetCountry: { value: at(COUNTRIES, i) },
    ifWareHouseOut: YN(i), ifLoad: String(i % 3), // 装柜确认 0待装载/1待确认/2已确认
    ifOutDeclare: YN(i), ifEnterDeclare: YN(i + 1),
    ifOutTrailer: YN(i), ifEnterTrailer: YN(i + 1), ifOutCar: YN(i), ifEnterCar: YN(i + 1), openTank: YN(i),
    dispatch: String(i % 4),
    shippingDate: seedTime(i).slice(0, 10), cutoffDate: seedTime(i + 2).slice(0, 10), transitTime: (i % 15) + 5,
    fbastore: { value: `FBA${at(COUNTRIES, i)}仓` }, remark: '',
    originCountryId: (i % 5) + 1, targetCountryId: (i % 5) + 1, orgId: (i % 5) + 1,
    orderTime: seedTime(i).slice(0, 10),
    createTime: seedTime(i)
  })), [], 4)
// 分单发货按 业务类型/起运国/目的国/服务机构/下单时间/关键字(keyType→原单号1/SO号3/柜号5/提单号4) 过滤
singleApi.list = (p = {}) => singleApi.res.query(o => {
  const typeOk = !p.type || o.type === p.type
  const ocOk = !p.originCountryId || o.originCountryId === p.originCountryId
  const tcOk = !p.targetCountryId || o.targetCountryId === p.targetCountryId
  const orgOk = !p.orgId || o.orgId === p.orgId
  const kwOk = !p.code ||
    (p.codeType === '1' && o.keyCode.includes(p.code)) ||
    (p.codeType === '3' && (o.containers || []).some(c => (c.soCode || '').includes(p.code))) ||
    (p.codeType === '5' && (o.containers || []).some(c => (c.containerNo || '').includes(p.code))) ||
    (p.codeType === '4' && (o.containers || []).some(c => (c.billNo || '').includes(p.code))) ||
    (p.codeType === '2')
  const timeOk = !p.orderTime || !Array.isArray(p.orderTime) || p.orderTime.length !== 2 ||
    (o.orderTime >= p.orderTime[0] && o.orderTime <= p.orderTime[1])
  // 更多筛选：各环节状态位（0/1，空则不过滤）
  const flagOk = ['ifWareHouseOut', 'ifOutDeclare', 'ifEnterDeclare', 'ifOutTrailer', 'ifEnterTrailer', 'ifOutCar', 'ifEnterCar', 'openTank']
    .every(k => p[k] == null || p[k] === '' || String(o[k]) === p[k])
  return typeOk && ocOk && tcOk && orgOk && kwOk && timeOk && flagOk
}, { page: p.page || 1, size: p.size || 10 })

// 发货业务类型（0空运/1海运/2铁路/3卡航）、服务类型
export const SHIP_BIZ_TYPES = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' }, { id: '3', name: '卡航' }
]
export const SHIP_TRANS_TYPES = [
  { id: '0', name: '包板' }, { id: '1', name: '散货' }, { id: '2', name: '拼箱' }, { id: '3', name: '整柜' }, { id: '4', name: '整车' }
]
export const SHIP_DISPATCH = [
  { id: '0', name: '快递' }, { id: '1', name: '卡派' }, { id: '2', name: '自提' }, { id: '3', name: '整柜直送' }
]
// 拖车供应商（静态）
export const TRAILER_SUPPLIERS = [
  { custId: 1, custName: '中运拖车' }, { custId: 2, custName: '速通拖车' }, { custId: 3, custName: '海陆拖车' }
]
// 发货计划（静态，供整柜发货选择）
export const SHIP_PLANS = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1, bscName: `发货计划${pad(i + 1)}`, type: String(i % 4), transType: String(i % 5),
  bscId: 100 + i, containerName: at(['PMC板', '40HQ', '20GP', '厢式货车'], i),
  serviceName: `服务机构${pad((i % 5) + 1)}`, serviceCode: `SVC${1000 + i}`,
  dispatch: String(i % 4), shippingDate: seedTime(i).slice(0, 10), cutoffDate: seedTime(i + 2).slice(0, 10),
  transitTime: (i % 15) + 5,
  fbastore: { value: `FBA${at(COUNTRIES, i)}仓` },
  originPort: { value: at(['深圳港', '上海港', '宁波港'], i) }, targetPort: { value: at(['洛杉矶港', '汉堡港', '东京港'], i) },
  originCountry: { value: '中国' }, targetCountry: { value: at(COUNTRIES, i) }
}))
// 整柜发货：对齐源列（业务/服务类型/订舱服务/柜量/运输类型/服务机构/编码/港口/国家/派送/日期/目的仓）
export const cshipApi = defineMock('op_cship', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    keyCode: `YD${String(100000 + i * 37).slice(0, 6)}`,
    type: String(i % 4),
    transType: String(i % 5),
    bsc: { name: `订舱服务${pad(i + 1)}`, serviceCode: `SVC${1000 + i}` },
    containers: Array.from({ length: (i % 3) + 1 }, () => ({ containerInfo: { containerName: at(['PMC板', '40HQ', '20GP', '厢式货车'], i) } })),
    org: { value: `服务机构${pad((i % 5) + 1)}` },
    originPort: { value: at(['深圳港', '上海港', '宁波港'], i) }, targetPort: { value: at(['洛杉矶港', '汉堡港', '东京港'], i) },
    originCountry: { value: '中国' }, targetCountry: { value: at(COUNTRIES, i) },
    dispatch: String(i % 4),
    shippingDate: seedTime(i).slice(0, 10), cutoffDate: seedTime(i + 2).slice(0, 10), transitTime: (i % 15) + 5,
    fbastore: { value: `FBA${at(COUNTRIES, i)}仓` },
    orderTime: seedTime(i).slice(0, 10),
    createTime: seedTime(i)
  })), [], 4)
// 整柜发货按 业务类型 + 下单时间区间 过滤
cshipApi.list = (p = {}) => cshipApi.res.query(o => {
  const typeOk = !p.type || o.type === p.type
  const timeOk = !p.orderTime || !Array.isArray(p.orderTime) || p.orderTime.length !== 2 ||
    (o.orderTime >= p.orderTime[0] && o.orderTime <= p.orderTime[1])
  return typeOk && timeOk
}, { page: p.page || 1, size: p.size || 10 })
// 按原单号查订单信息（整柜发货表单）
export function getShipByCode(code) {
  const i = Math.abs(String(code).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 5
  return mockRequest({
    name: `美国专线${i + 1}`, destinationName: at(['洛杉矶港', '汉堡港', '东京港'], i),
    customs0: String(i % 2), taxes: `${(i % 5) * 100}`, deliveryWay: String(i % 4),
    type: String(i % 4), containerName: at(['PMC板', '40HQ', '20GP', '厢式货车'], i),
    pickAddressName: `${at(COUNTRIES, i)}集货仓`, packages: (i % 8) + 1,
    volumes: (i % 20) + 5, umVolume: 'CBM', weights: (i % 200) + 50, umWeight: 'KG',
    value: (i % 5000) + 1000, currencyId: 'USD', pickContact: `联系人${i + 1}`, pickTel: `1380000${pad(i)}00`
  })
}

// 订单派送状态（TRUCK 分类）
export const DELIVERY_STATUS = [
  { id: '0', name: '待派送' }, { id: '1', name: '派送中' }, { id: '2', name: '已送达' }, { id: '3', name: '已取消' }
]
// 订单派送：列表15列（业务类型/目的国/提货仓库/车型/仓库供应商/卡车供应商/总票数件数体积重量/提货时间/是否下单/状态/备注）
export const deliveryApi = defineMock('op_delivery', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    type: String(i % 4),
    country: { value: at(COUNTRIES, i) },
    warehouse: { name: `${at(COUNTRIES, i)}提柜仓`, custName: `仓库供应商${pad((i % 5) + 1)}` },
    car: { value: at(['厢式货车', '平板车', '冷藏车'], i) },
    supply: { name: `卡车供应商${pad((i % 5) + 1)}` },
    total: (i % 10) + 1, count: (i % 30) + 5,
    volume: (i % 20) + 5, volumeUnit: 'CBM', weight: (i % 200) + 50, weightUnit: 'KG',
    time: seedTime(i).slice(0, 10), ifOrder: i % 2, status: String(i % 4),
    remark: '', orderTime: seedTime(i).slice(0, 10),
    createTime: seedTime(i)
  })), [], 4)
// 订单派送按 业务类型/目的国/提柜仓库/是否下单/状态/提货时间/关键字 过滤
deliveryApi.list = (p = {}) => deliveryApi.res.query(o => {
  const typeOk = !p.transport || o.type === p.transport
  const countryOk = !p.countryName || o.country?.value === p.countryName
  const orderOk = p.ifOrder == null || p.ifOrder === '' || String(o.ifOrder) === p.ifOrder
  const statusOk = !p.status || o.status === p.status
  const timeOk = !p.orderTime || !Array.isArray(p.orderTime) || p.orderTime.length !== 2 ||
    (o.time >= p.orderTime[0] && o.time <= p.orderTime[1])
  return typeOk && countryOk && orderOk && statusOk && timeOk
}, { page: p.page || 1, size: p.size || 10 })

// 发货向导：可勾选的待派送订单（占位派生），供 firstStep 订单表格
export function getDeliveryOrders(p = {}) {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    code: `YD${String(100000 + i * 37).slice(0, 6)}`,
    customerName: `客户${pad((i % 12) + 1)}贸易`,
    countryName: at(COUNTRIES, i),
    warehouseName: `${at(COUNTRIES, i)}提柜仓`,
    packages: (i % 8) + 1,
    volume: (i % 20) + 5, weight: (i % 200) + 50,
    containerNo: `CT${String(200000 + i * 91).slice(0, 6)}`,
    goodsStatus: at(['待提柜', '已提柜', '在途'], i)
  }))
  const filtered = rows.filter(o => !p.code || o.code.includes(p.code))
  return mockRequest({ list: filtered, total: filtered.length })
}

// 外协发货：列表(业务类型/服务/供应商/仓库/柜号提单号/总票数体积重量/安排出库) + 两步向导 + 补充快递/计量子弹窗
export const outsourcApi = defineMock('op_outsourc', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    type: String(i % 4),
    serviceName: at(['美国专线', '欧洲专线', '日本专线', '空运特快', '海运普船'], i),
    supplierName: `外协商${pad((i % 6) + 1)}`,
    warehouseName: `${at(COUNTRIES, i)}集货仓`,
    subtypeName: `CT${String(200000 + i * 91).slice(0, 6)}`,
    totalPackages: (i % 20) + 5,
    totalVolume: (i % 20) + 5, totalWeight: (i % 200) + 50,
    ifWareHouseOut: i % 2,
    orderTime: seedTime(i).slice(0, 10),
    expressItems: [], meteringItems: [],
    createTime: seedTime(i)
  })), [], 4)
// 外协发货按 业务类型/供应商/是否安排出库/原单号 过滤
outsourcApi.list = (p = {}) => outsourcApi.res.query(o =>
  (!p.subtypeId || o.type === p.subtypeId) &&
  (!p.supplierName || o.supplierName === p.supplierName) &&
  (p.ifWareHouseOut == null || p.ifWareHouseOut === '' || String(o.ifWareHouseOut) === p.ifWareHouseOut) &&
  (!p.code || String(o.subtypeName).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
// 外协供应商选项
export const OUTSOURC_SUPPLIERS = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `外协商${pad(i + 1)}` }))
