// 业务配置模块 mock 接口（保真对齐 vue3-jht-admin/src/views/business-configuration/express-port）
// 覆盖：快递接口 index（列表 + 内嵌新增/编辑表单）、燃油费率 oilRate 子弹窗。
// 编码陷阱：启用状态 ifEnable 用【数字】1/0（active-value=1）；changeStatus 为切换式（只传 id）。
import { defineMock, pad, at } from '../mockCrud'
import { mockRequest, paginate } from '../mock'

/* ============================================================================
 * 一、共享字典 / 下拉数据源
 * ========================================================================== */

// FEDEX 快递公司 id（命中时账号信息 label 变化，见 addEditForm）
export const FEDEX_ID = 'ef57c1b33e9411eabd8600163e06e1cf'

// 快递公司（getExpressCompany，type '4'）
export const EXPRESS_COMPANIES = [
  { id: 'exp_ups', name: 'UPS', countryId: 'c_us' },
  { id: 'exp_fedex', name: 'FEDEX', countryId: 'c_us' },
  { id: 'exp_dhl', name: 'DHL', countryId: 'c_de' },
  { id: FEDEX_ID, name: 'FEDEX-Intl', countryId: 'c_us' }
]

// 国家（getCountryList）
export const COUNTRY_LIST = [
  { id: 'c_us', name: '美国', alias: 'US' }, { id: 'c_de', name: '德国', alias: 'DE' },
  { id: 'c_gb', name: '英国', alias: 'GB' }, { id: 'c_cn', name: '中国', alias: 'CN' },
  { id: 'c_jp', name: '日本', alias: 'JP' }, { id: 'c_ca', name: '加拿大', alias: 'CA' }
]

// 州/省（getStateByCountry）：abbr 为值
const STATE_MAP = {
  c_us: [{ abbr: 'CA', name: '加利福尼亚', alias: 'California' }, { abbr: 'NY', name: '纽约', alias: 'New York' }, { abbr: 'TX', name: '得克萨斯', alias: 'Texas' }],
  c_de: [{ abbr: 'BY', name: '巴伐利亚', alias: 'Bayern' }, { abbr: 'BE', name: '柏林', alias: 'Berlin' }],
  c_gb: [{ abbr: 'ENG', name: '英格兰', alias: 'England' }, { abbr: 'SCT', name: '苏格兰', alias: 'Scotland' }],
  c_cn: [{ abbr: 'GD', name: '广东', alias: 'Guangdong' }, { abbr: 'SH', name: '上海', alias: 'Shanghai' }],
  c_jp: [{ abbr: 'TK', name: '东京', alias: 'Tokyo' }],
  c_ca: [{ abbr: 'ON', name: '安大略', alias: 'Ontario' }]
}

// 数据字典（getWordsList）：接口路径 ups_interface_api / 打印标签格式 LABEL_STYLE
const WORDS_MAP = {
  ups_interface_api: [
    { label: '下单接口', value: 'https://api.example.com/order' },
    { label: '取消接口', value: 'https://api.example.com/cancel' },
    { label: '轨迹接口', value: 'https://api.example.com/track' },
    { label: '打单接口', value: 'https://api.example.com/label' }
  ],
  LABEL_STYLE: [
    { label: '10*10', value: '10*10' }, { label: '10*15', value: '10*15' }, { label: '15*20', value: '15*20' }
  ]
}

// 货币（geCurrencyList，按 countryId）
const CURRENCY_MAP = {
  c_us: [{ id: 'USD', name: 'USD' }], c_de: [{ id: 'EUR', name: 'EUR' }], c_gb: [{ id: 'GBP', name: 'GBP' }],
  c_cn: [{ id: 'CNY', name: 'CNY' }], c_jp: [{ id: 'JPY', name: 'JPY' }], c_ca: [{ id: 'CAD', name: 'CAD' }]
}

export function getCountryList() { return mockRequest(COUNTRY_LIST.slice()) }
export function getExpressCompany() {
  // 源响应 { result }
  return mockRequest({ result: EXPRESS_COMPANIES.slice(), total: EXPRESS_COMPANIES.length })
}
export function getStateByCountry(countryId) {
  return mockRequest({ result: STATE_MAP[countryId] ? STATE_MAP[countryId].slice() : [] })
}
export function getCityByState() { return mockRequest({ result: [] }) }
export function getWordsList({ type } = {}) { return mockRequest(WORDS_MAP[type] ? WORDS_MAP[type].slice() : []) }
export function geCurrencyList({ countryId } = {}) {
  return mockRequest({ result: CURRENCY_MAP[countryId] ? CURRENCY_MAP[countryId].slice() : [] })
}

/* ============================================================================
 * 二、快递接口 express-port（biz_express_port_v2）
 * ========================================================================== */

const ports = defineMock('biz_express_port_v2', () =>
  Array.from({ length: 8 }, (_, i) => {
    const exp = at(EXPRESS_COMPANIES, i)
    const country = at(COUNTRY_LIST, i)
    return {
      id: i + 1,
      expressId: exp.id,
      expressName: exp.name,
      codes: `CODE${pad(i + 1)}`,
      interfaceCode: `IF${1000 + i}`,
      username: `user${pad(i + 1)}`,
      password: '******',
      accessLicenseNumber: `LIC${1000 + i}`,
      remarks: i % 3 === 0 ? '' : `备注${pad(i + 1)}`,
      // 发运参数
      maximumPackages: (i % 5) + 1,
      maximumWeightOfPackage: ((i % 4) + 1) * 10,
      weightDiscount: 100,
      numberOfCopies: 1,
      labelStyle: at(WORDS_MAP.LABEL_STYLE, i).value,
      volumetricWeightUnit: 5000,
      printInvoice: i % 2,
      ifGfp: 0,
      currency: (CURRENCY_MAP[exp.countryId] || [{}])[0].id,
      // 账号信息（发货方）
      consignorCompany: `Company ${pad(i + 1)}`,
      consignorCountryCode: country.id,
      consignorCountry: country.name,
      consignorProvinceCode: (STATE_MAP[country.id] || [{}])[0].abbr,
      consignorProvince: (STATE_MAP[country.id] || [{}])[0].name,
      consignorCityCode: 'City' + pad(i + 1),
      consignorCity: 'City' + pad(i + 1),
      consignor: `联系人${pad(i + 1)}`,
      consignorPhone: `1300000${pad(i + 1)}`,
      consignorMail: `contact${pad(i + 1)}@example.com`,
      consignorFax: '',
      consignorZip: `1000${pad(i + 1)}`,
      consignorTaxCode: `TAX${pad(i + 1)}`,
      consignorAddress1: `Address line 1 #${pad(i + 1)}`,
      consignorAddress2: '',
      consignorAddress3: '',
      // 退货方
      sameConsignor: i % 2,
      returnerEntity: {
        id: 1000 + i,
        returnCompany: '', returnCountryCode: '', returnCountryName: '', returnProvinceCode: '', returnProvinceName: '',
        returnCityCode: '', returnCityName: '', returnName: '', returnPhone: '', returnMail: '', returnFax: '',
        returnZip: '', returnTaxCode: '', returnAddress1: '', returnAddress2: '', returnAddress3: ''
      },
      ifEnable: i % 4 === 0 ? 0 : 1
    }
  }), ['expressId', 'consignorCountryCode'], 2
)
// 列表：expressId 精确 + consignorCountryCode 精确；响应 { total, records }
export function getExpressPortList(p = {}) {
  const rows = ports.res.raw().filter(o =>
    (!p.expressId || o.expressId === p.expressId) &&
    (!p.consignorCountryCode || o.consignorCountryCode === p.consignorCountryCode)
  )
  const { list, total } = paginate(rows, { page: p.current || p.page || 1, size: p.size || 10 })
  return mockRequest({ records: list, total })
}
export function getExpressPortById(id) { return ports.res.get(id) }
export function addExpressPort(d) { return ports.add(d) }
export function updateExpressPort(d) { return ports.update(d.id, d) }
export function deleteExpressPort(ids = []) {
  const list = Array.isArray(ids) ? ids : [ids]
  list.forEach(id => ports.remove(id))
  return mockRequest(null)
}
// 状态切换（只传 id，服务端翻转 ifEnable 1/0）
export function changeExpressStatus({ id } = {}) {
  const row = ports.res.raw().find(o => o.id === Number(id))
  if (row) ports.update(id, { ifEnable: Number(row.ifEnable) === 1 ? 0 : 1 })
  return mockRequest(null)
}

/* ============================================================================
 * 三、燃油费率 oilRate（biz_oil_rate_v2）：按快递接口 id 分组
 * ========================================================================== */

const rates = defineMock('biz_oil_rate_v2', () =>
  Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    portId: (i % 4) + 1,
    date: `2024-${pad((i % 12) + 1)}-01`,
    rate: ((i + 1) * 3).toFixed(2)
  })), ['portId'], 2
)
export function getRateList(p = {}) {
  const rows = rates.res.raw().filter(o => !p.portId || o.portId === Number(p.portId))
  const { list, total } = paginate(rows, { page: p.current || p.page || 1, size: p.size || 10 })
  return mockRequest({ result: list, total })
}
export function updateRate(d) { return d.id ? rates.update(d.id, d) : rates.add(d) }
export function deleteRate({ ids = [] } = {}) {
  ids.forEach(id => rates.remove(id))
  return mockRequest(null)
}
