// 价格管理模块 mock 接口（保真对齐 agent/workProject2-jht/src/views/price-management）
// 分批重建：批0 基座（共享字典 + 商品类别 + 计费配置 + 选择源），A/B/C 档资源随页面逐批补齐。
// 未重建页面暂时保留旧的占位导出以保证 build 通过（重建到对应页时替换）。
import { defineMock, pad, at, seedTime } from '../mockCrud'
import { createResource } from '../persist'
import { mockRequest, paginate } from '../mock'
import { SETTLEMENT_LIST } from './financial'

/* ============================ 共享字典 ============================ */
// 审核状态（字符串编码：专线/订舱）：0待审核/1已通过/2已拒绝/3审核中
export const AUDIT_STR_LIST = [
  { id: '0', name: '待审核' }, { id: '1', name: '已通过' },
  { id: '2', name: '已拒绝' }, { id: '3', name: '审核中' }
]
// 审核状态（数值编码：卡派/拖车/报关/仓储/外协）：1待审核/2审核中/3已拒绝/4已通过
export const AUDIT_NUM_LIST = [
  { id: 1, name: '待审核' }, { id: 2, name: '审核中' },
  { id: 3, name: '已拒绝' }, { id: 4, name: '已通过' }
]
// 生效状态（卡派/拖车/报关/外协 status）：1待生效/2生效中/9已失效
export const EFFECT_STATUS_LIST = [
  { id: 1, name: '待生效' }, { id: 2, name: '生效中' }, { id: 9, name: '已失效' }
]
// 生效状态（仓储 effective）：1待生效/2生效中/3已失效
export const WAREHOUSE_EFFECT_LIST = [
  { id: 1, name: '待生效' }, { id: 2, name: '生效中' }, { id: 3, name: '已失效' }
]
// 报价对象状态（专线/订舱 status）：0待生效/1生效中/2已失效
export const LINE_STATUS_LIST = [
  { id: 0, name: '待生效' }, { id: 1, name: '生效中' }, { id: 2, name: '已失效' }
]
// 订舱装载方式 loadType
export const LOAD_TYPE_LIST = [
  { id: 0, name: '散货' }, { id: 1, name: '包板' }, { id: 2, name: '整柜' },
  { id: 3, name: '拼箱' }, { id: 4, name: '整车' }
]
// 卡派地址类型 addressType
export const ADDRESS_TYPE_LIST = [
  { id: 0, name: '机场' }, { id: 1, name: '港口' }, { id: 2, name: '火车站' },
  { id: 3, name: '海外仓' }, { id: 4, name: '私人地址' }
]
// 派送方式 dispatch
export const DISPATCH_LIST = [
  { id: '0', name: '卡派' }, { id: '1', name: '快递' }, { id: '2', name: '自提' },
  { id: '3', name: '整柜直送' }, { id: '4', name: '到仓' }
]
// 目的地类型 purposeType
export const PURPOSE_TYPE_LIST = [
  { id: 0, name: 'FBA' }, { id: 1, name: '私人' }, { id: 2, name: '自有海外仓' }
]
// 计费方式 priceType（专线/外协等价格矩阵）：2按重量/3按体积/4按整柜
export const PRICE_TYPE_LIST = [
  { id: 2, name: '按重量' }, { id: 3, name: '按体积' }, { id: 4, name: '按整柜' }
]
// 结算单位（复用财务同款）
export { SETTLEMENT_LIST }
// 单位映射
export const UM_WEIGHT = ['T', 'LBS', 'KGS', 'OZS']
export const UM_LENGTH = ['FT', 'M', 'CM', 'IN']
export const UM_VOLUME = ['CBM', 'CFT']
// 计费单位（附加费设置）：1按重量/2按个数/3按金额/4单询
export const BILLING_UNIT_LIST = [
  { id: 1, name: '按重量' }, { id: 2, name: '按个数' }, { id: 3, name: '按金额' }, { id: 4, name: '单询' }
]
// 结算重量算法（计费配置）
export const ALGORITHM_LIST = [
  { id: '0', name: '取实重' },
  { id: '1', name: '取实重或体积重的最大值' },
  { id: '2', name: '取实重或体积重的平均值' }
]
// 多件重量算法
export const MULTI_WEIGHT_LIST = [
  { id: '0', name: '先累加后比较' }, { id: '1', name: '先比较后累加' }
]

/* ============================ 工具 ============================ */
export const lookup = (list, id) => (list.find(x => String(x.id) === String(id)) || {}).name || '--'

// 地址类型（Y 轴）文案映射（源写死 objLeft/addressList）
export const ADDRESS_LABELS = {
  '0': '国家', '1': '州省', '5': '国内区域', '7': '仓库代码',
  '100': '城市区域', '101': '仓库区域', '102': '国家区域'
}
// 地址类型下拉源（区域配置弹窗 four 模式）
export const ADDRESS_AXIS_LIST = [
  { name: '国家', id: '0' }, { name: '国内区域', id: '5' }, { name: '城市区域', id: '100' },
  { name: '仓库区域', id: '101' }, { name: '国家区域', id: '102' }, { name: '州省', id: '1' }, { name: '仓库代码', id: '7' }
]
// 报价对象（category）文案：0聚货通/1&2代理商/3直客/4同行
export const CATEGORY_LABELS = { '0': '聚货通价', '1': '代理商价', '2': '代理商价', '3': '直客价', '4': '同行价' }

// 由 rows 首行 prices 推导矩阵 X 轴列（源 aAxisData 计算）
// loadType: 2 柜型（label=x.value）；5 卡散重量/方数；其余按 type 0 重量/1 体积，label=lower-upper
export const buildAxis = (rows = [], loadType) => {
  const prices = ((rows || [])[0] || {}).prices || []
  let rightTitle = ''
  const columns = prices.map(it => {
    const x = it.x || {}
    if (loadType === '2') { rightTitle = '柜型'; return { label: x.value } }
    if (loadType === '5') { rightTitle = it.type === '1' ? '方数区间' : '重量区间'; return { label: `${x.lower}-${x.upper}` } }
    rightTitle = it.type === '1' ? '体积区间' : '重量区间'
    return { label: `${x.lower}-${x.upper}` }
  })
  return { columns, rightTitle }
}
const money = i => Number((((i * 137) % 9000) + 100).toFixed(2))
const dstr = (i, o = 0) => `2024-${pad(((i + o) % 12) + 1)}-${pad(((i + o) % 27) + 1)}`
const nowStr = () => { const n = new Date(); const p = x => String(x).padStart(2, '0'); return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}` }

// 国家源（含别名 alias，供各页 @focus getCountryList 复用）
const COUNTRY_SEED = [
  { id: 'US', name: '美国', alias: 'United States' },
  { id: 'DE', name: '德国', alias: 'Germany' },
  { id: 'JP', name: '日本', alias: 'Japan' },
  { id: 'GB', name: '英国', alias: 'United Kingdom' },
  { id: 'AU', name: '澳大利亚', alias: 'Australia' },
  { id: 'CA', name: '加拿大', alias: 'Canada' },
  { id: 'FR', name: '法国', alias: 'France' }
]
const SUPPLIERS = ['环球物流', '速达国际', '安通供应链', '远洋货代', '中外运']

/* ============================ D 档 1：货物附加费（商品类别树 + 附加费） ============================ */
// 商品类别（懒加载树）：flat 存储，parentId=0 为一级，其下为二级；level 2 为叶子。
// searchForm.type 写死 2（附加费类型）；type 1（报关类型）相关字段（checked/国家筛选）源为注释，保留为注释。
export const surchargeApi = defineMock('price_category', () => {
  const nodes = []
  let id = 1
  // 一级：按服务大类命名（附加费类型 type=2）
  const level1 = ['普货', '带电产品', '液体膏体', '食品', '特货']
  level1.forEach((n1, a) => {
    const pid = id++
    nodes.push({ id: pid, title: n1, remarks: `${n1}类目`, parentId: 0, level: 1, type: 2, checked: undefined, billingUnit: 1 })
    // 二级
    for (let b = 0; b < 3; b++) {
      nodes.push({ id: id++, title: `${n1}-子类${b + 1}`, remarks: '', parentId: pid, level: 2, type: 2, checked: undefined, billingUnit: 1 })
    }
  })
  return nodes
}, [], 2)
// 懒加载：返回 parentId 的直接子节点（level 2 标记为 leaf）
surchargeApi.getProductList = (p = {}) => {
  const rows = surchargeApi.res.raw()
    .filter(o => String(o.parentId) === String(p.parentId) && (!p.type || o.type === p.type))
    .map(o => ({ ...o, leaf: o.level >= 2 }))
  return mockRequest(rows)
}
// 保存（新增/编辑）；deleted=1 走删除
surchargeApi.save = d => {
  if (Number(d.deleted) === 1) return surchargeApi.res.remove(d.id)
  if (d.id != null && surchargeApi.res.get(d.id).data) return surchargeApi.res.update(d.id, d)
  // 新增：按 parentId 推断 level
  const parent = surchargeApi.res.get(d.parentId).data
  const level = parent ? (parent.level || 0) + 1 : 1
  return surchargeApi.res.add({ ...d, level, type: d.type || 2 })
}

// 附加费成本项（按类别 + 国家配单价）
export const surchargeCostApi = defineMock('price_category_cost', () =>
  Array.from({ length: 6 }, (_, i) => ({
    id: i + 1, categoryId: (i % 5) * 4 + 2, countryId: at(COUNTRY_SEED, i).id,
    countryName: at(COUNTRY_SEED, i).name, price: money(i), unitId: 'RMB', unitName: '人民币'
  })), [], 2)
surchargeCostApi.getCost = (p = {}) =>
  mockRequest(surchargeCostApi.res.raw().filter(o => String(o.categoryId) === String(p.categoryId)))
// 保存：先清空该类别旧数据，再批量写入 list
surchargeCostApi.saveCost = (params = {}) => {
  const { id, list = [] } = params
  surchargeCostApi.res.raw().filter(o => String(o.categoryId) === String(id)).forEach(o => surchargeCostApi.res.remove(o.id))
  list.forEach(it => surchargeCostApi.res.add({ ...it, categoryId: id, unitId: 'RMB', unitName: '人民币' }))
  // 记录类别计费单位
  if (params.billingUnit != null) surchargeApi.res.update(id, { billingUnit: params.billingUnit })
  return mockRequest(true)
}

/* ============================ D 档 2：计费配置（重量0/体积1 双 tab） ============================ */
export const chargeApi = defineMock('price_charge_config', () =>
  Array.from({ length: 14 }, (_, i) => {
    const type = i % 2 === 0 ? '0' : '1'
    const algorithm = at(['0', '1', '2'], i)
    const bubble = type === '0' && algorithm === '1' && i % 3 === 0
    const builtin = i % 5 === 0 // 系统内置（agent.key==='0'）
    return {
      id: i + 1, type, name: `${type === '0' ? '重量' : '体积'}计费${pad(i + 1)}`,
      deviation: Number(((i % 5) * 0.5).toFixed(2)),
      vw: type === '0' ? 6000 : undefined,
      density: type === '1' ? Number((((i % 4) + 1) * 100).toFixed(2)) : undefined,
      algorithm: type === '0' ? algorithm : undefined,
      multiWeight: algorithm === '1' ? at(['0', '1'], i) : undefined,
      bubble, bulky: bubble ? Number(((i % 5) + 1).toFixed(2)) : undefined,
      bubbleRule1Check: bubble, bubbleRule1: bubble ? 100 + i : undefined,
      bubbleRule2Check: bubble && i % 2 === 0, bubbleRule2: bubble && i % 2 === 0 ? 100 : undefined,
      sbmc: type === '0' ? Number(((i % 3) + 0.5).toFixed(2)) : undefined,
      simc: type === '0' ? Number(((i % 5) + 1).toFixed(2)) : undefined,
      weightCarry: type === '0' ? i % 2 === 0 : undefined,
      weightCarryRule: type === '0' ? (i % 2 === 0 ? 0.5 : 1) : undefined,
      agent: builtin ? { key: '0', value: '系统' } : { key: 'C1', value: '聚货通' },
      createTime: seedTime(i)
    }
  }), [], 2)
chargeApi.getList = (p = {}) => chargeApi.res.query(o => o.type === String(p.type ?? '0'), { page: p.page || 1, size: p.size || 10 })
chargeApi.save = d => (d.id != null && chargeApi.res.get(d.id).data ? chargeApi.res.update(d.id, d) : chargeApi.res.add(d))
chargeApi.remove = id => chargeApi.res.remove(id)

/* ============================ 选择弹窗数据源（联动 mock） ============================ */
// 国家列表（@focus getCountryList）
export const getCountryOptions = () => mockRequest({ result: COUNTRY_SEED })
// 供应商列表（外协/报价关联）
export const getSupplierOptions = (p = {}) => mockRequest({
  result: SUPPLIERS.map((n, i) => ({ id: i + 1, name: n }))
})
// 交货城市（外协 getDeliveryCity）
export const getDeliveryCityOptions = () => mockRequest(
  ['东部区', '中部区', '西部区', '南部区', '北部区'].map((n, i) => ({ id: i + 1, name: n }))
)
// 业务子类型（按服务大类）
export const getSubtypeOptions = (typeId = '') => mockRequest(
  ['标准', '经济', '特快'].map((n, i) => ({ id: String(i + 1), name: n }))
)

/* ============================ A 档：报价卡片流 + 二维矩阵 + 审核流（共用工厂） ============================ */
// 业务类型（05 专线子类型：0空/1海/2铁/3快/4卡）
export const SUBTYPE_LIST = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁运' }, { id: '4', name: '卡车' }
]
// 交货区域源
const AREA_SEED = ['东部区', '中部区', '西部区', '南部区', '北部区']
// 服务源（lsc）
const SERVICE_SEED = ['美森快船', '以星快船', '盐田直达', '中欧班列', '空运包板']
// 报价对象（category）候选：代理商/直客/同行
export const CATEGORY_OPTS = [
  { id: '2', name: '代理商' }, { id: '3', name: '直客' }, { id: '4', name: '同行' }
]

// 造一行矩阵：Y=国家(addressType '0')，X=重量区间 3 列
const seedRow = (country, base) => ({
  addressType: '0',
  address: { key: country.id, value: `${country.name}-${country.alias}` },
  prices: [
    { type: '0', x: { lower: 0, upper: 21 }, price: Number((base + 10).toFixed(2)) },
    { type: '0', x: { lower: 21, upper: 45 }, price: Number((base + 6).toFixed(2)) },
    { type: '0', x: { lower: 45, upper: 100 }, price: Number((base + 3).toFixed(2)) }
  ],
  prescription: '8-12',
  remark: ''
})

// 报价对象大类 A 档卡片流 + 详情种子。serviceType: 05 专线等。
function buildLineSeed(prefix, serviceType) {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const svc = at(SERVICE_SEED, i)
    const audit = at(['0', '1', '2', '3'], i)          // 0待审/1通过/2拒/3审核中
    const status = audit === '1' ? '1' : (i % 3 === 0 ? '0' : '2') // 0待生效/1生效中/2已失效
    const deliveries = [{ key: String((i % 5) + 1), value: at(AREA_SEED, i) }]
    const rows = [at(COUNTRY_SEED, i), at(COUNTRY_SEED, i + 1)].map((c, k) => seedRow(c, money(i + k)))
    return {
      id: i + 1,
      serviceType,
      lsc: { key: String(i + 1), value: svc },
      subtype: { key: subtype.id, value: subtype.name },
      category: at(['0', '1', '2', '3', '4'], i),
      mode: i % 4 === 0 ? '1' : '0',                    // 0标准/1特殊
      audit, status,
      includeTax: i % 2 === 0,
      dispatch: at(['0', '1', '2', '3', '4'], i),
      containerType: subtype.id === '1' || subtype.id === '2' ? at(['0', '1'], i) : undefined,
      purposeType: at([0, 1, 2], i),
      priceType: '2',                                    // 2按重量
      currency: { key: 'RMB', value: '人民币' },
      currencyId: 'RMB', currencyName: '人民币',
      umWeight: 'KGS', umLength: 'CM',
      loadType: undefined,
      destinationName: `${at(COUNTRY_SEED, i).name}目的港`,
      measure: { key: '1', value: '标准计费' },
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      deliveries,
      specials: [],
      remark: audit === '2' ? '价格偏高，请复核' : '',
      rows,
      refId: undefined,
      createTime: seedTime(i)
    }
  })
}

// 为 A 档资源挂载 card 列表 + 详情 + 保存/审核/失效/复制/历史方法
function attachLineApi(api) {
  // 卡片列表（分页 + 简单过滤）
  api.getList = (p = {}) => api.res.query(o => {
    if (p.subtypeId && (o.subtype || {}).key !== p.subtypeId) return false
    if (p.audit && o.audit !== p.audit) return false
    if (p.category && o.category !== p.category) return false
    if (p.mode && o.mode !== p.mode) return false
    if (p.lscId && (o.lsc || {}).key !== p.lscId) return false
    return true
  }, { page: p.page || 1, size: p.size || 10 })
  // 详情
  api.getById = id => api.res.get(id)
  // 保存（新增/编辑）
  api.save = d => (d.id != null && api.res.get(d.id).data ? api.res.update(d.id, d) : api.res.add(d))
  // 审核：audit 1通过/2拒绝/3审核中；通过则 status 生效中
  api.audit = ({ id, audit, reason }) => {
    const patch = { audit }
    if (audit === '1') patch.status = '1'
    if (audit === '2') patch.remark = reason
    return api.res.update(id, patch)
  }
  // 失效
  api.invalid = id => api.res.update(id, { status: '2' })
  // 删除
  api.remove = id => api.res.remove(id)
  // 历史版本（mock：返回自身 + 一条更早期版本切片）
  api.history = id => {
    const cur = api.res.get(id).data
    if (!cur) return mockRequest([])
    return mockRequest([{ ...cur }])
  }
  // 参考报价（上级有效报价，mock 返回带 rows 的切片）
  api.effectiveBook = () => mockRequest(api.res.raw().filter(o => o.audit === '1').slice(0, 3))
  // 供应商报价（浮层）：按 lscId 匹配，返回若干版本
  api.supplier = ({ lscId } = {}) => mockRequest(
    api.res.raw().filter(o => !lscId || (o.lsc || {}).key === String(lscId)).slice(0, 3).map(o => ({
      id: o.id, cust: { key: 'S' + o.id, value: at(SUPPLIERS, o.id) }, period: o.period, rows: o.rows, loadType: o.loadType
    }))
  )
}

// A 档选择源（联动 mock）
export const getServiceOptions = (p = {}) => mockRequest({
  result: SERVICE_SEED.map((n, i) => ({ id: String(i + 1), name: n, abbr: n.slice(0, 2), label: `${n}(${n.slice(0, 2)})`, status: '1', lsId: 'LS' + pad(i + 1), destinationName: at(COUNTRY_SEED, i).name + '港', subtypeName: at(SUBTYPE_LIST, i).name, containerType: at(['0', '1'], i), umWeight: 'KGS', umLength: 'CM', currencyId: 'RMB', currencyName: '人民币', dispatch: String(i % 5), includeTax: i % 2 === 0, priceType: '2', purposeType: i % 3, outsourcing: i % 2 === 0 ? '1' : '0' }))
})
export const getAreaOptions = () => mockRequest(AREA_SEED.map((n, i) => ({ id: String(i + 1), name: n })))
// 计费配置下拉（按 type 0重量/1体积）
export const getChargeConfigOptions = (type = '0') => mockRequest(
  chargeApi.res.raw().filter(o => o.type === String(type)).map(o => ({ id: o.id, name: o.name, ...o }))
)
export const getContainerOptions = () => mockRequest(
  ['20GP', '40GP', '40HQ', '45HQ'].map((n, i) => ({ id: String(i + 1), name: n }))
)

/* ============================ 专线（示范页，STRING audit） ============================ */
export const privateApi = defineMock('price_private', () => buildLineSeed('专线', '05'), ['name'])
attachLineApi(privateApi)

/* ============================ 订舱（booking，STRING audit，typeId 02） ============================ */
// 装载方式 loadType 决定 X 轴：1/2/4 柜型|板型|车型；5 重量&方数；0/3 重量/体积区间。
export const EXPRESS_COMPANIES = ['DHL', 'FedEx', 'UPS', 'USPS', '顺丰国际']
export const PORTS = ['深圳港', '上海港', '宁波港', '洛杉矶港', '汉堡港', '鹿特丹港']
export const CONTAINER_SEED = ['20GP', '40GP', '40HQ', '45HQ']
// 订舱：Y 轴=服务机构行，X 轴按 loadType
const seedBookingRow = (org, loadType, base) => {
  let prices
  if (loadType === '2' || loadType === '1' || loadType === '4') {
    prices = CONTAINER_SEED.slice(0, 3).map((c, k) => ({ x: { value: c }, price: Number((base + k * 20).toFixed(2)) }))
  } else if (loadType === '5') {
    prices = [
      { type: '0', x: { lower: 0, upper: 100 }, price: Number((base + 5).toFixed(2)) },
      { type: '1', x: { lower: 0, upper: 3 }, price: Number((base + 8).toFixed(2)) }
    ]
  } else {
    prices = [
      { type: '0', x: { lower: 0, upper: 21 }, price: Number((base + 10).toFixed(2)) },
      { type: '0', x: { lower: 21, upper: 45 }, price: Number((base + 6).toFixed(2)) },
      { type: '0', x: { lower: 45, upper: 100 }, price: Number((base + 3).toFixed(2)) }
    ]
  }
  return { address: { key: org.id, value: org.name }, addressType: 'org', trans: { orgName: org.name, orgId: org.id, serviceCode: 'SC' + org.id, shipDay: '1,3,5', customDay: '2,4' }, prices, prescription: '8-14', remark: '' }
}
const BOOKING_ORGS = [{ id: 'O1', name: '美森快船' }, { id: 'O2', name: '以星快船' }, { id: 'O3', name: '中欧班列' }]
function buildBookingSeed() {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const loadType = subtype.id === '1' || subtype.id === '2' ? at(['2', '3', '5'], i) : at(['0', '1'], i)
    const audit = at(['0', '1', '2', '3'], i)
    const status = audit === '1' ? '1' : (i % 3 === 0 ? '0' : '2')
    const rows = BOOKING_ORGS.slice(0, 2).map((o, k) => seedBookingRow(o, loadType, money(i + k)))
    return {
      id: i + 1, serviceType: '02',
      bsc: { key: String(i + 1), value: at(SERVICE_SEED, i) },
      subtype: { key: subtype.id, value: subtype.name },
      category: at(['0', '1', '2', '3', '4'], i),
      mode: i % 4 === 0 ? '1' : '0', audit, status, loadType,
      portsFrom: { key: 'PF' + i, value: at(PORTS, i) }, portsTo: { key: 'PT' + i, value: at(PORTS, i + 3) },
      currencyId: 'RMB', currencyName: '人民币', currencyId1: 'USD', currencyName1: '美元', currencyId2: 'USD', currencyName2: '美元',
      umWeight: 'KGS', umLength: 'CM',
      measure: { key: '1', value: '标准计费' },
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      deliveries: [], specials: [],
      remark: audit === '2' ? '价格偏高，请复核' : '', rows, createTime: seedTime(i)
    }
  })
}
export const bookingApi = defineMock('price_booking', buildBookingSeed, ['name'], 2)
attachLineApi(bookingApi)

/* ============================ 快递（express，STRING audit，typeId 00） ============================ */
// Y 轴=重量区间行，X 轴=目的地代码/区域（type 0/1 决定）
const seedExpressRow = (lower, upper, dests, base) => ({
  address: { value: `${lower}-${upper}` }, y: `${lower}-${upper}`, addressType: '8',
  prices: dests.map((d, k) => ({ x: { key: d.id, value: d.name }, price: Number((base + k * 3).toFixed(2)) })),
  remark: ''
})
function buildExpressSeed() {
  const dests = COUNTRY_SEED.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
  return Array.from({ length: 8 }, (_, i) => {
    const audit = at(['0', '1', '2', '3'], i)
    const status = audit === '1' ? '1' : (i % 3 === 0 ? '0' : '2')
    const rows = [[0, 0.5], [0.5, 1], [1, 2]].map(([l, u]) => seedExpressRow(l, u, dests, money(i) + l * 10))
    return {
      id: i + 1, serviceType: '00',
      subtype: { key: '0', value: '快递' },
      esc: { key: String(i + 1), value: at(SERVICE_SEED, i) },
      lsc: { key: String(i + 1), value: at(SERVICE_SEED, i) },
      expressName: at(EXPRESS_COMPANIES, i), expressCode: 'EXP' + pad(i + 1),
      category: at(['0', '1', '2', '3', '4'], i), mode: i % 4 === 0 ? '1' : '0',
      audit, status, type: i % 2 === 0 ? '0' : '1',
      countryId: at(COUNTRY_SEED, i).id, countryName: at(COUNTRY_SEED, i).name,
      umWeight: 'KGS', umLength: 'CM', currencyId: 'RMB', currencyName: '人民币',
      consignorZip: `1000${i}`, weightDisCount: (i % 3) * 5, handlingRate: (i % 4) * 2,
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      deliveries: [], specials: [],
      remark: audit === '2' ? '燃油系数过高' : '', rows, createTime: seedTime(i)
    }
  })
}
export const expressApi = defineMock('price_express', buildExpressSeed, ['name'], 2)
attachLineApi(expressApi)

/* ============================ 数值审核档工厂（car/trailer/customs：auditing 1/2/3/4 + effective 1/2/9） ============================ */
// 生效映射：effective 2→status'1'生效中 / 1→'2'待生效 / 9→'3'已失效
export const effectiveToStatus = e => (e === 2 ? '1' : e === 1 ? '2' : '3')
export const AUDITING_STATUS_LIST = [
  { id: '1', name: '待审核' }, { id: '2', name: '审核中' }, { id: '4', name: '已通过' }, { id: '3', name: '已拒绝' }
]
// 报价对象（toCustType/toCustSubtype）候选
export const CUST_OPTS = [
  { id: '2', name: '代理商', toCustType: '2' },
  { id: '3', name: '直客', toCustType: '1', toCustSubtype: '0' },
  { id: '4', name: '同行', toCustType: '1', toCustSubtype: '1' }
]
// 为数值审核页挂载方法（字段名与 STRING 档不同：auditing/effective/reason/ifStandard）
function attachNumApi(api) {
  api.getList = (p = {}) => api.res.query(o => {
    if (p.subtypeId && (o.subtype || {}).key !== p.subtypeId) return false
    if (p.auditing && Number(o.auditing) !== Number(p.auditing)) return false
    if (p.priceType && String(o.priceType) !== String(p.priceType)) return false
    if (p.addressType && String(o.addressType) !== String(p.addressType)) return false
    if (p.ifStandard != null && p.ifStandard !== '' && o.ifStandard !== p.ifStandard) return false
    return true
  }, { page: p.page || 1, size: p.size || 10 })
  api.getById = id => api.res.get(id)
  api.save = d => (d.id != null && api.res.get(d.id).data ? api.res.update(d.id, d) : api.res.add(d))
  // 审核：tag/status 2审核中/4通过/3拒绝；4通过→effective 生效中
  api.audit = ({ id, status, reason }) => {
    const patch = { auditing: Number(status) }
    if (Number(status) === 4) patch.effective = 2
    if (Number(status) === 3) patch.reason = reason
    return api.res.update(id, patch)
  }
  api.invalid = id => api.res.update(id, { effective: 9 })
  api.remove = id => api.res.remove(id)
  api.history = id => { const cur = api.res.get(id).data; return mockRequest(cur ? [{ ...cur }] : []) }
  api.effectiveBook = () => mockRequest(api.res.raw().filter(o => Number(o.auditing) === 4).slice(0, 3))
  api.supplier = ({ serviceId } = {}) => mockRequest(
    api.res.raw().filter(o => !serviceId || (o.service || {}).key === String(serviceId)).slice(0, 3).map(o => ({
      id: o.id, cust: { key: 'S' + o.id, value: at(SUPPLIERS, o.id) }, period: o.period, rows: o.rows
    }))
  )
}

// 国家名（car/trailer/customs/outsourc seed 共用；须在首个 buildSeed 执行前声明，避免 TDZ）
const COUNTRIES = ['美国', '德国', '日本', '英国', '澳大利亚']

/* ---- 卡派（car，typeId 01；priceType 0车型/1托数/2重量&方数；addressType 0机场..4私人） ---- */
const CAR_DEST = ['洛杉矶机场', '汉堡港', '芝加哥火车站']
const CAR_VEHICLE = ['厢式货车', '平板车', '冷藏车']
const seedCarRow = (destName, priceType, base) => {
  let prices
  if (priceType === '0') prices = CAR_VEHICLE.map((v, k) => ({ name: v, x: { value: v }, price: Number((base + k * 30).toFixed(2)) }))
  else if (priceType === '1') prices = [[0, 5], [5, 10], [10, 20]].map(([l, u], k) => ({ x: { lower: l, upper: u }, price: Number((base + k * 10).toFixed(2)) }))
  else prices = [
    { type: '0', x: { lower: 0, upper: 100 }, price: Number((base + 5).toFixed(2)) },
    { type: '1', x: { lower: 0, upper: 3 }, price: Number((base + 8).toFixed(2)) }
  ]
  return { address: { value: destName }, name: destName, prices, remark: '' }
}
function buildCarSeed() {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const priceType = at(['0', '1', '2'], i)
    const addressType = at(['0', '1', '2', '3', '4'], i)
    const auditing = at([1, 2, 3, 4], i)
    const effective = auditing === 4 ? 2 : (i % 3 === 0 ? 1 : 9)
    const rows = CAR_DEST.slice(0, 2).map((d, k) => seedCarRow(addressType === '4' ? `${k * 50}-${k * 50 + 50}` : d, priceType, money(i + k)))
    return {
      id: i + 1, typeId: '01',
      subtype: { key: subtype.id, value: subtype.name },
      service: { key: String(i + 1), value: at(SERVICE_SEED, i) }, kscName: at(SERVICE_SEED, i), ksId: 'KS' + pad(i + 1),
      toCustType: at(['2', '1', '1', '3'], i), toCustSubtype: at(['0', '1'], i),
      ifStandard: i % 3 !== 0, priceType, addressType,
      addressName: at(PORTS, i), city: addressType === '4' ? at(COUNTRIES, i) : '',
      country: { countryName: at(COUNTRIES, i), stateName: '加州', cityName: '洛杉矶', countyName: '' },
      umWeight: 'KGS', umVolume: 'CBM', umDistance: 'KM', currencyId: 'RMB', currencyName: '人民币',
      floorPrice: money(i), auditing, effective, status: effectiveToStatus(effective),
      startTime: `2024-${pad((i % 12) + 1)}-01`, endTime: `2025-${pad((i % 12) + 1)}-01`,
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      associatedAgents: [], reason: auditing === 3 ? '成本核算不符' : '', rows, createTime: seedTime(i)
    }
  })
}
export const carApi = defineMock('price_car', buildCarSeed, ['name'], 2)
attachNumApi(carApi)

/* ---- 拖车（trailer，typeId 06；Y=目的地 X=柜型；addressType 1港口/2火车站） ---- */
const TRAILER_DEST = ['洛杉矶仓', '芝加哥仓', '休斯顿仓']
const seedTrailerRow = (destName, base) => ({
  address: { value: destName }, addrName: destName,
  prices: CONTAINER_SEED.slice(0, 3).map((c, k) => ({ x: { value: c }, cabinetName: c, price: Number((base + k * 25).toFixed(2)) })),
  remark: ''
})
function buildTrailerSeed() {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const auditing = at([1, 2, 3, 4], i)
    const effective = auditing === 4 ? 2 : (i % 3 === 0 ? 1 : 9)
    const addressType = at(['1', '2'], i)
    const rows = TRAILER_DEST.slice(0, 2).map((d, k) => seedTrailerRow(d, money(i + k)))
    return {
      id: i + 1, typeId: '06',
      subtype: { key: subtype.id, value: subtype.name },
      service: { key: String(i + 1), value: at(SERVICE_SEED, i) }, serviceName: at(SERVICE_SEED, i), tsId: 'TS' + pad(i + 1),
      toType: at(['2', '1', '1', '3'], i), toSubtype: at(['0', '1'], i),
      ifStandard: i % 3 !== 0, addressType, addressName: at(PORTS, i), city: at(COUNTRIES, i),
      endAddressType: i % 2, currencyId: 'RMB', currencyName: '人民币',
      auditing, effective, status: effectiveToStatus(effective),
      startTime: `2024-${pad((i % 12) + 1)}-01`, endTime: `2025-${pad((i % 12) + 1)}-01`,
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      associatedAgents: [], reason: auditing === 3 ? '柜型报价缺失' : '', rows, createTime: seedTime(i)
    }
  })
}
export const trailerApi = defineMock('price_trailer', buildTrailerSeed, ['name'], 2)
attachNumApi(trailerApi)

/* ---- 报关（customs，typeId 03；Y=成本项目 X=海关） ---- */
const CUSTOMS_ORG = ['洛杉矶海关', '长滩海关', '纽约海关']
const CUSTOMS_COST = ['报关费', '查验费', '单证费', 'ISF申报']
const seedCustomsRow = (costName, base) => ({
  address: { value: costName }, nameY: costName,
  prices: CUSTOMS_ORG.slice(0, 3).map((o, k) => ({ x: { value: o }, nameX: o, price: Number((base + k * 15).toFixed(2)) })),
  remark: ''
})
function buildCustomsSeed() {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const auditing = at([1, 2, 3, 4], i)
    const effective = auditing === 4 ? 2 : (i % 3 === 0 ? 1 : 9)
    const rows = CUSTOMS_COST.slice(0, 3).map((c, k) => seedCustomsRow(c, money(i + k)))
    return {
      id: i + 1, typeId: '03',
      subtype: { key: subtype.id, value: subtype.name },
      service: { key: String(i + 1), value: at(SERVICE_SEED, i) }, csId: 'CS' + pad(i + 1),
      toType: at(['2', '1', '1', '3'], i), toSubtype: at(['0', '1'], i),
      ifStandard: i % 3 !== 0, countryName: at(COUNTRIES, i), currencyId: 'RMB', currencyName: '人民币',
      auditing, effective, status: effectiveToStatus(effective),
      startTime: `2024-${pad((i % 12) + 1)}-01`, endTime: `2025-${pad((i % 12) + 1)}-01`,
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      associatedAgents: [], reason: auditing === 3 ? '成本项目未配置' : '', rows, createTime: seedTime(i)
    }
  })
}
export const customsApi = defineMock('price_customs', buildCustomsSeed, ['name'], 2)
attachNumApi(customsApi)

// 数值审核页矩阵 X 轴列构建：命名列（x.value）优先，否则区间列（lower-upper）
export const buildNumAxis = (rows = []) => {
  const prices = ((rows || [])[0] || {}).prices || []
  return prices.map(it => {
    const x = it.x || {}
    if (x.value != null) return { label: x.value }
    return { label: `${x.lower}-${x.upper}` }
  })
}

/* ---- 数值审核页选择源 ---- */
export const getCarServiceOptions = () => mockRequest({ result: SERVICE_SEED.map((n, i) => ({ id: String(i + 1), name: n, label: `${n}(${n.slice(0, 2)})`, priceType: at(['0', '1', '2'], i), addressType: at(['0', '1', '2', '3', '4'], i), addressName: at(PORTS, i), umWeight: 'KGS', umVolume: 'CBM', umDistance: 'KM', currencyId: 'RMB', currencyName: '人民币', status: '1' })) })
export const getVehicleOptions = () => mockRequest(CAR_VEHICLE.map((n, i) => ({ id: String(i + 1), name: n })))
export const getCabinetOptions = () => mockRequest(CONTAINER_SEED.map((n, i) => ({ id: String(i + 1), name: n })))
export const getCustomsOrgOptions = () => mockRequest(CUSTOMS_ORG.map((n, i) => ({ id: String(i + 1), name: n })))
export const getCostItemOptions = () => mockRequest(CUSTOMS_COST.map((n, i) => ({ id: String(i + 1), name: n })))
export const getCustTypeOptions = () => mockRequest((SUPPLIERS).map((n, i) => ({ id: i + 1, name: n })))

/* ============================ 仓储（warehouse，数值审核 auditing 1/2/3/4；effective 1/2/3；收费项目 el-table + span-method） ============================ */
// 仓储 effective 编码与其它数值页不同：1待生效/2生效中/3已失效（源写死，勿复用他页）
const WAREHOUSE_NAMES = ['洛杉矶中心仓', '芝加哥仓', '休斯顿仓', '纽约仓', '亚特兰大仓', '达拉斯仓']
// 收费项目：{name 收费项目, type 计费方式(settlementList), cellName/cellValue(按车/按柜), min/max(区间), price, minCharge, remark}
const WAREHOUSE_CHARGE_SEED = [
  { name: '入库操作费', type: '4' },              // 按箱
  { name: '出库操作费', type: '4' },              // 按箱
  { name: '仓租费', type: '8' },                  // 按时间
  { name: '仓租费', type: '9' },                  // 同名不同计费方式（验证 span-method 合并列0 而列1 分行）
  { name: '打托费', type: '9' },                  // 按托
  { name: '贴标费', type: 'A' },                  // 按个数
  { name: '卡车调度费', type: '5', cell: true }   // 按车（cellName/cellValue 特殊路径）
]
const seedWarehouseRows = (base) => WAREHOUSE_CHARGE_SEED.map((c, k) => {
  const hasRange = c.type === '8' || c.type === '9'
  return {
    name: c.name, type: c.type,
    cellName: c.cell ? '厢式货车' : '', cellValue: c.cell ? 'V1' : '',
    min: hasRange ? 0 : undefined, max: hasRange ? (k + 1) * 10 : undefined,
    price: c.cell ? undefined : Number((base + k * 8).toFixed(2)),
    minCharge: Number((base / 2 + k).toFixed(2)),
    remark: ''
  }
})
function buildWarehouseSeed() {
  return Array.from({ length: 10 }, (_, i) => {
    const auditing = at([1, 2, 3, 4], i)
    const effective = auditing === 4 ? 2 : (i % 3 === 0 ? 1 : 3)
    const toCustType = at(['2', '1', '1', '0'], i)
    const toCustSubtype = at(['0', '1'], i)
    return {
      id: i + 1,
      warehouseId: String((i % WAREHOUSE_NAMES.length) + 1), warehouseName: at(WAREHOUSE_NAMES, i),
      fromCustName: at(SUPPLIERS, i), toCustType, toCustSubtype,
      ifStandard: i % 3 !== 0, refId: undefined,
      umWeight: 'KGS', umLength: 'CM', currencyId: 'RMB', currencyName: '人民币',
      floorPrice: money(i),
      auditing, effective, reason: auditing === 3 ? '收费项目价格未填全' : '',
      startTime: `2024-${pad((i % 12) + 1)}-01`, endTime: `2025-${pad((i % 12) + 1)}-01`,
      associatedAgents: [], priceList: seedWarehouseRows(money(i)), createTime: seedTime(i)
    }
  })
}
export const warehouseApi = defineMock('price_warehouse', buildWarehouseSeed, ['warehouseName'], 3)
// 仓储专用方法：审核参数键为 tag（非 status）；effective 1/2/3
warehouseApi.getList = (p = {}) => warehouseApi.res.query(o => {
  if (p.warehouseId && String(o.warehouseId) !== String(p.warehouseId)) return false
  if (p.auditing && Number(o.auditing) !== Number(p.auditing)) return false
  if (p.ifStandard != null && p.ifStandard !== '' && o.ifStandard !== p.ifStandard) return false
  if (p.startTime && o.endTime < p.startTime) return false
  if (p.endTime && o.startTime > p.endTime) return false
  return true
}, { page: p.page || 1, size: p.size || 10 })
warehouseApi.getById = id => warehouseApi.res.get(id)
warehouseApi.save = d => (d.id != null && warehouseApi.res.get(d.id).data ? warehouseApi.res.update(d.id, d) : warehouseApi.res.add(d))
// 审核：tag 2审核中/4通过/3拒绝；4通过→effective 2生效中
warehouseApi.audit = ({ tag, id, reason }) => {
  const patch = { auditing: Number(tag) }
  if (Number(tag) === 4) patch.effective = 2
  if (Number(tag) === 3) patch.reason = reason
  return warehouseApi.res.update(id, patch)
}
warehouseApi.invalid = id => warehouseApi.res.update(id, { effective: 3 })
warehouseApi.remove = id => warehouseApi.res.remove(id)
warehouseApi.history = id => { const cur = warehouseApi.res.get(id).data; return mockRequest(cur ? [{ ...cur }] : []) }
// 参考报价（上级有效报价，代理商价用）
warehouseApi.effectiveBook = () => mockRequest(warehouseApi.res.raw().filter(o => Number(o.auditing) === 4).slice(0, 3).map(o => ({ id: o.id, startTime: o.startTime, endTime: o.endTime, priceList: o.priceList })))
// 特殊报价有效时间下拉
warehouseApi.standardPeriod = () => mockRequest(warehouseApi.res.raw().slice(0, 4).map(o => ({ id: o.id, startTime: o.startTime, endTime: o.endTime })))
// 供应商报价浮层
warehouseApi.supplier = ({ warehouseId } = {}) => mockRequest(
  warehouseApi.res.raw().filter(o => !warehouseId || String(o.warehouseId) === String(warehouseId)).slice(0, 3).map(o => ({
    id: o.id, cust: { key: 'S' + o.id, value: o.fromCustName }, period: { effect: o.startTime, expire: o.endTime }, priceList: o.priceList
  }))
)
// 仓库下拉（源 getWarehouseList；status '1' 可选）
export const getWarehouseOptions = () => mockRequest(WAREHOUSE_NAMES.map((n, i) => ({ id: String(i + 1), name: n, status: '1' })))
// 收费项目配置（源 getPriceConfig /finance/r/axis，serviceTypeId '04'）：返回收费项目行
export const getWarehouseChargeConfig = () => mockRequest(seedWarehouseRows(money(1)).map((r, i) => ({ ...r, cid: i + 1, price: undefined, minCharge: undefined })))

/* ============================ 供应商聚合（supplier，view+audit only；单槽切换六域只读投影） ============================ */
// 源 supplier/index.vue：priceType 切换挂载六个 price-*.vue，均为只读 + 审核，无新增/编辑/删除。
// 这里复用已建六域资源（专线/订舱/仓储/卡派/拖车/报关）的只读投影，供应商页按 priceType 取对应资源。
export const SUPPLIER_PRICE_TYPES = [
  { id: '05', name: '专线报价', family: 'str' },
  { id: '02', name: '订舱报价', family: 'str' },
  { id: '04', name: '仓储报价', family: 'warehouse' },
  { id: '01', name: '卡车报价', family: 'num' },
  { id: '06', name: '拖车报价', family: 'num' },
  { id: '03', name: '报关报价', family: 'num' }
]
export const supplierAggApiMap = {
  '05': privateApi, '02': bookingApi, '04': warehouseApi,
  '01': carApi, '06': trailerApi, '03': customsApi
}
// 供应商列表（顶栏筛选）
export const getSupplierList = () => mockRequest(SUPPLIERS.map((n, i) => ({ id: String(i + 1), name: n })))

/* ============================ 外协（outsourc，数值审核；A 档矩阵 priceForm） ============================ */
// 源 price-outsourc：供应商=成本来源(fromCust)，代理商=目标(toCust)；typeId '05'；Y=地址(国家/州省/区域) × X=重量/体积区间/柜型
const OUTSOURC_DELIVERY_AREAS = ['美西区', '美东区', '美中区', '欧洲区']
// 外协矩阵行：Y=目的地地址，X 按 priceType（2重量/3体积/4整柜）
const seedOutsourcRow = (yName, priceType, base) => {
  let prices
  if (priceType === '4') prices = CONTAINER_SEED.slice(0, 3).map((c, k) => ({ x: { value: c }, price: Number((base + k * 20).toFixed(2)) }))
  else prices = [[0, 21], [21, 45], [45, 100]].map(([l, u], k) => ({ x: { lower: l, upper: u }, price: Number((base + k * 6).toFixed(2)) }))
  return { address: { value: yName }, ytype: '0', prices, prescription: '8-14', remark: '' }
}
function buildOutsourcSeed() {
  return Array.from({ length: 8 }, (_, i) => {
    const subtype = at(SUBTYPE_LIST, i)
    const audit = at([1, 2, 4, 3], i)
    const status = audit === 4 ? 2 : (i % 3 === 0 ? 1 : 9)
    const priceType = at(['2', '3', '4'], i)
    const rows = COUNTRIES.slice(0, 2).map((c, k) => seedOutsourcRow(c, priceType, money(i + k)))
    return {
      id: i + 1, typeId: '05',
      subtype: { key: subtype.id, value: subtype.name },
      lsc: { key: String(i + 1), value: at(SERVICE_SEED, i) }, lscName: at(SERVICE_SEED, i), lscCode: 'LSC' + pad(i + 1),
      fromCustId: String((i % SUPPLIERS.length) + 1), fromCustName: at(SUPPLIERS, i),
      toCustName: at(['一级代理A', '一级代理B', '一级代理C'], i), agentId: String((i % 3) + 1),
      deliveries: [{ id: String((i % 4) + 1), value: at(OUTSOURC_DELIVERY_AREAS, i) }],
      subtypeName: subtype.name, includeTax: i % 2 === 0, dispatch: at(['0', '1', '2', '3'], i), purposeType: i % 3,
      priceType, umWeight: 'KGS', umLength: 'CM', umVolume: 'CBM', currencyId: 'RMB', currencyName: '人民币',
      departureName: at(COUNTRIES, i) + '港',
      audit, status, reason: audit === 3 ? '成本价格缺失' : '',
      startTime: `2024-${pad((i % 12) + 1)}-01 00:00:00`, endTime: `2025-${pad((i % 12) + 1)}-01 23:59:59`,
      period: { effect: `2024-${pad((i % 12) + 1)}-01 00:00:00`, expire: `2025-${pad((i % 12) + 1)}-01 23:59:59` },
      areaId: [String((i % 4) + 1)], measureId: String((i % 2) + 1), measureName: i % 2 ? '体积计费' : '重量计费',
      associatedAgents: [], rows, createTime: seedTime(i)
    }
  })
}
export const outsourcApi = defineMock('price_outsourc', buildOutsourcSeed, ['lscName'], 3)
// 外协方法：audit 编码 1待审核/2审核中/4已通过/3已拒绝；status 2生效中/1待生效/9已失效；审核参数键为 audit
outsourcApi.getList = (p = {}) => outsourcApi.res.query(o => {
  if (p.subtypeId && (o.subtype || {}).key !== p.subtypeId) return false
  if (p.supplierId && String(o.fromCustId) !== String(p.supplierId)) return false
  if (p.countryId != null && p.countryId !== '' && !(o.departureName || '').includes(lookupCountry(p.countryId))) return false
  if (p.audit && Number(o.audit) !== Number(p.audit)) return false
  if (p.includeTax != null && p.includeTax !== undefined && o.includeTax !== p.includeTax) return false
  if (p.dispatch != null && p.dispatch !== undefined && p.dispatch !== '' && String(o.dispatch) !== String(p.dispatch)) return false
  if (p.purposeType != null && p.purposeType !== undefined && Number(o.purposeType) !== Number(p.purposeType)) return false
  if (p.lscId && (o.lsc || {}).key !== String(p.lscId)) return false
  return true
}, { page: p.page || 1, size: p.size || 10 })
outsourcApi.getById = id => outsourcApi.res.get(id)
outsourcApi.save = d => (d.id != null && outsourcApi.res.get(d.id).data ? outsourcApi.res.update(d.id, d) : outsourcApi.res.add(d))
outsourcApi.audit = ({ audit, id }) => {
  const patch = { audit: Number(audit) }
  if (Number(audit) === 4) patch.status = 2
  return outsourcApi.res.update(id, patch)
}
outsourcApi.invalid = id => outsourcApi.res.update(id, { status: 9 })
outsourcApi.remove = id => outsourcApi.res.remove(id)
outsourcApi.history = id => { const cur = outsourcApi.res.get(id).data; return mockRequest(cur ? [{ ...cur }] : []) }
const lookupCountry = id => (COUNTRY_SEED.find(c => String(c.id) === String(id)) || {}).name || ''

/* ---- 外协选择源 ---- */
export const getOutsourcSupplierOptions = () => mockRequest(SUPPLIERS.map((n, i) => ({ id: String(i + 1), name: n })))
export const getOutsourcAgentOptions = () => mockRequest(['一级代理A', '一级代理B', '一级代理C'].map((n, i) => ({ id: String(i + 1), name: n })))
export const getDeliveryAreaOptions = () => mockRequest(OUTSOURC_DELIVERY_AREAS.map((n, i) => ({ id: String(i + 1), name: n })))
export const getOutsourcServiceOptions = () => mockRequest({ result: SERVICE_SEED.map((n, i) => ({ id: String(i + 1), name: n, abbr: n.slice(0, 2), label: `${n}(${n.slice(0, 2)})`, lsId: 'LS' + pad(i + 1), departureName: at(COUNTRY_SEED, i).name + '港', containerType: at(['0', '1'], i), umWeight: 'KGS', umLength: 'CM', umVolume: 'CBM', currencyId: 'RMB', currencyName: '人民币', priceType: at(['2', '3', '4'], i), includeTax: i % 2 === 0, dispatch: String(i % 4) })) })
export const getOutsourcChargeOptions = () => mockRequest(chargeApi.res.raw().map(o => ({ id: o.id, name: o.name, measureName: o.name, ...o })))