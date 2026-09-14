// 服务配置模块 mock 接口（保真对齐 vue3-jht-admin/src/views/service-configuration）
// 覆盖 8 子页：快递 express / 订舱 booking / 报关 customs / 卡派 truck /
//              拖车 trailer / 仓储 warehousing / 专线 privateline(line + line-group)。
// 说明：全模块无审核流，实体仅「启用/禁用」二态；配置完成度由布尔字段驱动状态点。
// 编码陷阱：express 的 status 开关用数字 1/0，其余子页用字符串 '1'/'0'（见各资源注释）。
import { defineMock, pad, at } from '../mockCrud'
import { mockRequest, paginate } from '../mock'

/* ============================================================================
 * 一、共享字典
 * ========================================================================== */

// 服务大类 typeId：快递00/卡派01/订舱02/报关03/仓储04/专线05/拖车06
export const TYPE_ID = { express: '00', truck: '01', booking: '02', customs: '03', warehousing: '04', privateline: '05', trailer: '06' }

// 分配客户 belong：直客0/同行1/同行&直客2（专线 addEditForm labels 顺序不同，见该页）
export const BELONG_LIST = [{ id: '0', name: '直客' }, { id: '1', name: '同行' }, { id: '2', name: '同行&直客' }]

// 关键字检索类型：服务编码1/服务名称2（部分页用航线名称/服务机构，见各页）
export const SELECT_TYPE_LIST = [{ id: '1', name: '服务编码' }, { id: '2', name: '服务名称' }]

// ---- 快递 express ----
// 服务类型 subtypeId：本地快递0/国际快递(重量)1/国际快递(箱数)2
export const EXPRESS_SUBTYPE_LIST = [
  { id: '0', name: '本地快递' }, { id: '1', name: '国际快递(重量)' }, { id: '2', name: '国际快递(箱数)' }
]
// 目的地/区域 地址类型（setArea addressList）：国家0/国内区域5/城市区域100/国家区域102/州省1
export const EXPRESS_ADDRESS_LIST = [
  { id: '0', name: '国家' }, { id: '5', name: '国内区域' }, { id: '100', name: '城市区域' },
  { id: '102', name: '国家区域' }, { id: '1', name: '州省' }
]
export const UM_WEIGHT_LIST = [{ label: 'KGS', value: 'KGS' }, { label: 'LBS', value: 'LBS' }]
export const UM_MEASURE_LIST = [{ label: 'IN', value: 'IN' }, { label: 'FT', value: 'FT' }, { label: 'CM', value: 'CM' }]
// 打单量控制方式：按打单金额1/按重量2/按方数3
export const PRINT_METHOD_LIST = [{ id: 1, name: '按打单金额' }, { id: 2, name: '按重量' }, { id: 3, name: '按方数' }]
// 打单量周期：每天1/每周2/每月3
export const CYCLING_LIST = [{ id: 1, name: '每天' }, { id: 2, name: '每周' }, { id: 3, name: '每月' }]

// ---- 订舱 booking ----
// 业务类型 conveyance：空运0/海运1/铁路2/卡航4（无3）
export const CONVEYANCE_LIST = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' }, { id: '4', name: '卡航' }
]
// 订舱服务类型 transType：包板0/散货1/整柜2/拼箱3/整车4/拼箱5
export const TRANS_TYPE_LIST = [
  { id: '0', name: '包板' }, { id: '1', name: '散货' }, { id: '2', name: '整柜' },
  { id: '3', name: '拼箱' }, { id: '4', name: '整车' }, { id: '5', name: '拼箱' }
]
// 二程服务机构类型 orgType2：船东1/空运公司2/铁路公司3
export const ORG_TYPE2_LIST = [{ id: '1', name: '船东' }, { id: '2', name: '空运公司' }, { id: '3', name: '铁路公司' }]
// 周字典（起运/截报关时间）：星期一~日 = 1~7（数字）
export const WEEKDAYS = [
  { id: 1, name: '星期一' }, { id: 2, name: '星期二' }, { id: 3, name: '星期三' }, { id: 4, name: '星期四' },
  { id: 5, name: '星期五' }, { id: 6, name: '星期六' }, { id: 7, name: '星期日' }
]

// ---- 报关 customs ----
// 出口报关件 custom（subtypeId==='0' 时）：买单出口0/出口退税1
export const CUSTOM_EXPORT_LIST = [{ id: '0', name: '买单出口' }, { id: '1', name: '出口退税' }]

// ---- 卡派 truck / 拖车 trailer ----
// 地址类别 addressCategory：FBA0/私人1
export const ADDRESS_CATEGORY_LIST = [{ id: '0', name: 'FBA' }, { id: '1', name: '私人' }]
// 卡派筛选/purposeSet 目的地类型（字符串，无'4'）：机场0/港口1/火车站2/海外仓3/国内区域5/城市区域6/仓库区域7/国家区域8
export const TRUCK_ADDRESS_TYPE_LIST = [
  { id: '0', name: '机场' }, { id: '1', name: '港口' }, { id: '2', name: '火车站' }, { id: '3', name: '海外仓' },
  { id: '5', name: '国内区域' }, { id: '6', name: '城市区域' }, { id: '7', name: '仓库区域' }, { id: '8', name: '国家区域' }
]
// 卡派编辑 addressType：机场0/港口1/火车站2/海外仓3/私人地址4
export const TRUCK_EDIT_ADDRESS_TYPE_LIST = [
  { id: '0', name: '机场' }, { id: '1', name: '港口' }, { id: '2', name: '火车站' }, { id: '3', name: '海外仓' }, { id: '4', name: '私人地址' }
]
// 卡派服务类型 subtypeId（typeId '01'）：整柜卡派0/拼箱卡派1（priceType：'0'→托数/重量&方数；'1'→车型）
export const TRUCK_SUBTYPE_LIST = [{ id: '0', name: '整柜卡派' }, { id: '1', name: '拼箱卡派' }]
// 拖车目的地类型（数字型）：私人地址0/港口1/火车站2/海外仓3/国内区域4/城市区域5/仓库区域6/国家区域7
export const TRAILER_ADDRESS_TYPE_LIST = [
  { id: 0, name: '私人地址' }, { id: 1, name: '港口' }, { id: 2, name: '火车站' }, { id: 3, name: '海外仓' },
  { id: 4, name: '国内区域' }, { id: 5, name: '城市区域' }, { id: 6, name: '仓库区域' }, { id: 7, name: '国家区域' }
]

// ---- 专线 privateline ----
// 服务用途 purpose：服务渠道0/计费渠道1/发货渠道2
export const PURPOSE_LIST = [{ id: '0', name: '服务渠道' }, { id: '1', name: '计费渠道' }, { id: '2', name: '发货渠道' }]
// 业务类型 containerType：拼箱0/整柜1
export const CONTAINER_TYPE_LIST = [{ id: '0', name: '拼箱' }, { id: '1', name: '整柜' }]
// 支持锁舱 coverTank：否0/是1
export const COVER_TANK_LIST = [{ id: '0', name: '否' }, { id: '1', name: '是' }]
// 服务机构 orgTag：美森1/以星2/快线3/其他4
export const ORG_TAG_LIST = [{ id: '1', name: '美森' }, { id: '2', name: '以星' }, { id: '3', name: '快线' }, { id: '4', name: '其他' }]
// 目的地类型 purposeType：FBA0/私人1/自有海外仓2（数字）
export const PURPOSE_TYPE_LIST = [{ id: 0, name: 'FBA' }, { id: 1, name: '私人' }, { id: 2, name: '自有海外仓' }]
// 派件方式 dispatch（索引数组，表格用）：卡派0/快递1/自提2/整柜直送3/到仓4
export const DISPATCH_LIST = ['卡派', '快递', '自提', '整柜直送', '到仓']
// 商品属性 categories：普货0/带电1/纯电2/带磁3/危险4
export const CATEGORY_LIST = [
  { id: '0', name: '普货' }, { id: '1', name: '带电' }, { id: '2', name: '纯电' }, { id: '3', name: '带磁' }, { id: '4', name: '危险' }
]
// 计费方式 priceType：重量计费2/体积计费3/整柜计费4
export const PRICE_TYPE_LIST = [{ id: '2', name: '重量计费' }, { id: '3', name: '体积计费' }, { id: '4', name: '整柜计费' }]
// 专线长度/重量/体积单位
export const PL_LENGTH_LIST = [{ id: 'M', name: 'M-米' }, { id: 'CM', name: 'CM-厘米' }, { id: 'FT', name: 'FT-英尺' }]
export const PL_WEIGHT_LIST = [{ id: 'LBS', name: 'LB-磅' }, { id: 'KGS', name: 'KG-公斤' }]
export const PL_VOLUME_LIST = [{ id: 'CBM', name: 'CBM-立方米' }, { id: 'CUFT', name: 'CUFT-立方英尺' }]
// 配货属性 outsourcing：全部2/自有0/外协1
export const OUTSOURCING_LIST = [{ id: '2', name: '全部' }, { id: '0', name: '自有' }, { id: '1', name: '外协' }]

// 启用状态（筛选下拉，字符串）：禁用0/启用1
export const STATUS_LIST = [{ id: '0', name: '禁用' }, { id: '1', name: '启用' }]

/* ============================================================================
 * 二、工具函数 + 基础名录
 * ========================================================================== */
export const lookup = (list, id) => (list.find(x => String(x.id) === String(id)) || {}).name || '--'
const dstr = (i, o = 0) => `2024-${pad(((i + o) % 12) + 1)}-${pad(((i + o) % 27) + 1)}`
const dtime = i => `${dstr(i)} ${pad((i % 12) + 8)}:00:00`

// 国家/地区（含别名 alias、州省 states）
export const COUNTRIES = [
  { id: '1', name: '美国', alias: 'US' }, { id: '2', name: '德国', alias: 'DE' },
  { id: '3', name: '日本', alias: 'JP' }, { id: '4', name: '英国', alias: 'GB' },
  { id: '5', name: '澳大利亚', alias: 'AU' }, { id: '6', name: '加拿大', alias: 'CA' }
]
// 快递公司（type 4）：含 code 决定 expressStr(ups/dpd/fedex) 联动
export const EXPRESS_COMPANIES = [
  { id: 'E1', name: 'UPS', code: 'UPS' }, { id: 'E2', name: 'FedEx', code: 'FEDEX' },
  { id: 'E3', name: 'DPD', code: 'DPD' }, { id: 'E4', name: 'DHL', code: 'DHL' }
]
export const CURRENCIES = [
  { id: 'CNY', name: '人民币', sign: '¥' }, { id: 'USD', name: '美元', sign: '$' }, { id: 'EUR', name: '欧元', sign: '€' }
]
export const STATES = {
  1: [{ name: '加利福尼亚', alias: 'CA', abbr: 'CA' }, { name: '纽约', alias: 'NY', abbr: 'NY' }, { name: '德克萨斯', alias: 'TX', abbr: 'TX' }],
  2: [{ name: '巴伐利亚', alias: 'BY', abbr: 'BY' }, { name: '柏林', alias: 'BE', abbr: 'BE' }]
}
export const PORTS = [
  { id: 'P1', code: 'LAX', name: '洛杉矶港', alias: 'Los Angeles', countryId: '1' },
  { id: 'P2', code: 'NYC', name: '纽约港', alias: 'New York', countryId: '1' },
  { id: 'P3', code: 'HAM', name: '汉堡港', alias: 'Hamburg', countryId: '2' },
  { id: 'P4', code: 'FRA', name: '法兰克福机场', alias: 'Frankfurt', countryId: '2' }
]
export const CONTAINERS = [
  { id: 'CT1', name: "20'GP" }, { id: 'CT2', name: "40'GP" }, { id: 'CT3', name: "40'HQ" }, { id: 'CT4', name: "45'HQ" }
]
export const VEHICLE_TYPES = [
  { id: 'V1', name: '厢式货车' }, { id: 'V2', name: '平板车' }, { id: 'V3', name: '冷藏车' }, { id: 'V4', name: '危险品车' }
]
export const WAREHOUSES = [
  { id: 'W1', code: 'ONT8', address: '加州安大略仓' }, { id: 'W2', code: 'LAX9', address: '洛杉矶仓' },
  { id: 'W3', code: 'FRA3', address: '法兰克福仓' }, { id: 'W4', code: 'LHR2', address: '伦敦仓' }
]
export const PRODUCTS = [
  { id: 'PR1', productName: '美森快船' }, { id: 'PR2', productName: '以星普船' }, { id: 'PR3', productName: '中欧班列' }
]
// 服务小类（typeId 05 用；排除 id='3' 由页面处理）
export const SUBTYPE_LIST = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' }, { id: '3', name: '快递' }, { id: '4', name: '卡散' }
]
// 代理商 / 供应商名录
export const AGENTS = ['环球货代', '海鸥物流', '顺达国际', '联运通', '洲际快线', '远洋代理']
export const SUPPLIERS = ['深圳供应商A', '广州供应商B', '上海供应商C', '香港供应商D']
// 成本项目（报关关联）
export const COST_ITEMS = ['报关费', '查验费', '单证费', '关税代垫', '商检费']
// 验货配置
export const EXAMINE_LIST = [{ id: 'X1', name: '标准验货' }, { id: 'X2', name: '抽检' }, { id: 'X3', name: '全检' }]

/* 通用：把名录转 {id,name} 选项 */
const toOpt = arr => arr.map((n, i) => ({ id: String(i + 1), name: n }))

/* ============================================================================
 * 三、下拉 / 选择弹窗数据源（各页共用）
 * ========================================================================== */
export const getCountryList = () => mockRequest(COUNTRIES.map(c => ({ ...c })))
export const getStateByCountry = countryId => mockRequest((STATES[countryId] || []).map((s, i) => ({ id: `${countryId}-S${i}`, ...s })))
export const getCityByState = stateId => mockRequest(['中心城', '港区', '开发区'].map((n, i) => ({ id: `${stateId}-C${i}`, name: n, alias: n })))
export const getCountyByCity = cityId => mockRequest(['一区', '二区'].map((n, i) => ({ id: `${cityId}-D${i}`, name: n, alias: n })))
export const getCurrencyList = () => mockRequest(CURRENCIES.map(c => ({ ...c })))
export const getExpressCompanyList = () => mockRequest(EXPRESS_COMPANIES.map(c => ({ ...c })))
// 快递公司（按国家/type 过滤，addEditForm/index 用；返回 code 决定 expressStr）
export const getExpressCompany = (countryId, type = '4') => mockRequest(EXPRESS_COMPANIES.map(c => ({ ...c })))
// 物流接口账号（按 expressId）：username 显示，gfp 决定 ups 货运字段
export const getLogisticsPort = expressId => mockRequest(
  Array.from({ length: 3 }, (_, i) => ({ id: `${expressId || 'E'}-PT${i + 1}`, username: `账号${pad(i + 1)}@${expressId || 'exp'}`, gfp: i % 2 }))
)
// 服务代码 / 支付类型 / 包裹类别（按 express 简写返回）
export const getServiceCode = express => mockRequest(
  ['STANDARD', 'EXPRESS', 'ECONOMY'].map(v => ({ label: `${(express || '').toUpperCase()}-${v}`, value: v }))
)
export const getPayMethod = express => mockRequest(
  [{ label: '预付 Prepaid', value: 'PP' }, { label: '到付 Collect', value: 'CC' }, { label: '第三方 Third', value: 'TP' }]
)
export const getPkgCode = express => mockRequest(
  [{ label: '文件', value: 'DOC' }, { label: '包裹', value: 'PKG' }, { label: '托盘', value: 'PLT' }]
)
export const getDPDserviceType = serviceCode => mockRequest(
  ['Classic', 'Express12', 'Home'].map(n => ({ serviceTypeName: `${serviceCode || 'DPD'}-${n}` }))
)
// 快递字典（addEditForm 各承运商专属下拉）
export const getExpressWords = type => {
  const map = {
    DropoffType: [{ label: 'REGULAR_PICKUP', value: '1' }, { label: 'DROPOFF_AT_FEDEX_LOCATION', value: '2' }],
    UPS_GROUND_FREIGHT_CLASSES: [{ label: 'Class 50', value: '50' }, { label: 'Class 100', value: '100' }],
    UPS_HANDLING_UNIT_CODES: [{ label: 'PALLET', value: 'PLT' }, { label: 'SKID', value: 'SKD' }],
    DPD_DUTY_PAID: [{ label: '发件人 DDP', value: 'DDP' }, { label: '收件人 DDU', value: 'DDU' }]
  }
  return mockRequest((map[type] || []).map(x => ({ ...x })))
}
// 目的地/区域 穿梭数据源：地址类型 yType → 区域列表（城市区域/国家区域/国内区域）
export const getAllAreaList = (type, countryId) => mockRequest(
  Array.from({ length: 4 }, (_, i) => ({ id: `AREA${type || 0}-${i + 1}`, name: `区域${type || 0}-${pad(i + 1)}` }))
)
export const getRegionList = countryId => mockRequest(
  Array.from({ length: 4 }, (_, i) => ({ id: `RG${countryId || 0}-${i + 1}`, name: `国内区域${pad(i + 1)}` }))
)
export const getPortList = (countryId, type) => mockRequest(
  PORTS.filter(p => !countryId || p.countryId === String(countryId)).map(p => ({ ...p, key: p.code, fullName: `${p.code}-${p.name}-${p.alias}` }))
)
export const getContainerList = () => mockRequest(CONTAINERS.map(c => ({ ...c })))
export const getVehicleTypeList = () => mockRequest(VEHICLE_TYPES.map(v => ({ ...v })))
// 订舱业务类型下 transType（BOOKING_BUSINESS_TYPE + conveyance）：源按 conveyance 返回不同服务类型集
export const getBookingSvTypes = conveyance => {
  const map = {
    0: [{ id: '0', name: '包板' }, { id: '1', name: '散货' }],      // 空运
    1: [{ id: '2', name: '整柜' }, { id: '3', name: '拼箱' }],      // 海运
    2: [{ id: '2', name: '整柜' }, { id: '3', name: '拼箱' }],      // 铁路
    4: [{ id: '4', name: '整车' }, { id: '5', name: '拼箱' }]       // 卡航
  }
  return mockRequest((map[conveyance] || []).map(x => ({ ...x, value: x.id, label: x.name })))
}
// 国际航线（按 conveyance 过滤 type）
export const getFlightList = (conveyance = '') => mockRequest(
  COUNTRIES.slice(0, 4).map((c, i) => ({ id: `RT${i + 1}`, name: `${c.name}国际航线${pad(i + 1)}`, type: String(conveyance || (i % 3)) }))
    .filter(f => conveyance === '' || f.type === String(conveyance))
)
// 服务机构（type 机构类型 / serviceCountry 服务国家逗号拼接）
export const getServiceOrganList = () => mockRequest(
  ['中远海运', '马士基', '中国国航', '中铁国际', 'DHL 全球'].map((n, i) => ({ id: `ORG${i + 1}`, name: n, alias: `ORG${i + 1}` }))
)
// 航空板（定义航空板，onChargeType isType==='three' 用）
export const getAviationList = () => mockRequest(
  ['PMC 板', 'PAG 板', 'AKE 集装箱', 'LD3 板'].map((n, i) => ({ id: `AV${i + 1}`, name: n }))
)
export const getWarehouseList = countryId => mockRequest(WAREHOUSES.map(w => ({ ...w, name: `${w.code}-${w.address}` })))
export const getProductList = () => mockRequest(PRODUCTS.map(p => ({ ...p, id: p.id })))
export const getExamineList = () => mockRequest(EXAMINE_LIST.map(e => ({ ...e })))
export const getCostItemList = () => mockRequest(toOpt(COST_ITEMS))
// 服务小类：typeId '01'卡派→整柜/拼箱；其余(05等)→通用小类；排除项由页面处理
export const getServiceSubtypeList = (typeId = '05') =>
  mockRequest((typeId === '01' ? TRUCK_SUBTYPE_LIST : SUBTYPE_LIST).map(s => ({ ...s })))
// 代理商（cas 'A'）/ 供应商（cas 'S'），结果字段已 name/id
export const getAgentOptions = () => mockRequest(AGENTS.map((n, i) => ({ id: `A${i + 1}`, name: n })))
export const getSupplierOptions = () => mockRequest(SUPPLIERS.map((n, i) => ({ id: `S${i + 1}`, name: n })))
// 字典（重量/长度/体积单位等）
export const getWordsList = type => {
  const map = {
    weight_type: UM_WEIGHT_LIST, measurement_type: UM_MEASURE_LIST,
    VOLUME_TYPE: [{ label: 'CBM', value: 'CBM' }, { label: 'CUFT', value: 'CUFT' }],
    DISTANCE_TYPE: [{ label: 'KM', value: 'KM' }, { label: 'MILE', value: 'MILE' }],
    server_terms: [{ label: 'DDP', value: 'DDP' }, { label: 'DDU', value: 'DDU' }, { label: 'DAP', value: 'DAP' }]
  }
  return mockRequest((map[type] || []).map(x => ({ ...x })))
}
// 专线编辑用下拉：计费发票费用组 / 打单快递服务 / 起运港报关服务 / 起运港卡派服务
export const getCostgroupList = () => mockRequest(
  Array.from({ length: 5 }, (_, i) => ({ id: `CG${i + 1}`, name: `发票费用组${pad(i + 1)}` }))
)
export const getEscList = () => mockRequest(
  Array.from({ length: 8 }, (_, i) => ({ id: `ESC${i + 1}`, name: `${at(EXPRESS_COMPANIES, i).name}打单服务${pad(i + 1)}` }))
)
export const getCscList = () => mockRequest(
  Array.from({ length: 6 }, (_, i) => ({ id: `CSC${i + 1}`, name: `${at(COUNTRIES, i).name}起运港报关${pad(i + 1)}`, status: '1' }))
)
export const getKscList = () => mockRequest(
  Array.from({ length: 6 }, (_, i) => ({ id: `KSC${i + 1}`, name: `${at(COUNTRIES, i).name}起运港卡派${pad(i + 1)}`, status: '1' }))
)
// 交货区域（源 getDeliveryList，专线编辑中被注释，保留数据源以备）
export const getDeliveryList = () => mockRequest(
  Array.from({ length: 4 }, (_, i) => ({ id: `DL${i + 1}`, name: `交货区域${pad(i + 1)}` }))
)

/* ============================================================================
 * 四、快递 express（列表 + 关联代理商/排除仓库/目的地区域/计费/起运地·目的地代码/国际分区/邮编）
 *   status 开关用【数字】1/0；subtypeId 0本地/1国际重量/2国际箱数
 * ========================================================================== */
export const expressApi = defineMock('svc_express_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i)
    const sub = String(i % 3)
    return {
      id: i + 1,
      name: `${country.name}${at(EXPRESS_COMPANIES, i).name}快递${pad(i + 1)}`,
      expressCode: `EX${pad(i + 1)}${at(EXPRESS_COMPANIES, i).code}`,
      abbr: `${at(EXPRESS_COMPANIES, i).name}${pad(i + 1)}`,
      subtypeId: sub,
      countryId: country.id, countryName: country.name,
      expressId: at(EXPRESS_COMPANIES, i).id, expressName: at(EXPRESS_COMPANIES, i).name,
      belong: String(i % 3),
      // 配置完成度状态点（布尔）
      zonesConfiged: i % 2 === 0, zonedConfiged: i % 3 === 0,
      destinationConfiged: i % 2 === 1, chargingConfiged: i % 3 !== 0, addressConfiged: i % 4 === 0,
      esEntity: { countryId: country.id },
      status: i % 5 === 0 ? 0 : 1, createTime: dtime(i)
    }
  }), [], 1)
expressApi.list = (p = {}) => expressApi.res.query(o =>
  (!p.countryId || o.countryId === p.countryId) &&
  (!p.expressId || o.expressId === p.expressId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.code || String(o.expressCode).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
expressApi.save = d => (d.id ? expressApi.res.update(d.id, d) : expressApi.res.add(d))
expressApi.changeStatus = (id, status) => expressApi.res.update(id, { status })
// 关联代理商 / 排除仓库（按 serviceId 存已选 id 列表）
expressApi._agents = {}
expressApi.getAgentById = id => mockRequest(expressApi._agents[id] || [])
expressApi.saveAgent = (id, agents) => { expressApi._agents[id] = agents; return mockRequest(null) }
expressApi._special = {}
expressApi.getSpecialById = id => mockRequest(expressApi._special[id] || [])
expressApi.saveSpecial = (id, list) => { expressApi._special[id] = list; return mockRequest(null) }
// 价格配置（目的地区域 Y / 重量区间 X）——按 serviceId+xy 存取
expressApi._price = {}
expressApi.getPriceConfig = (serviceId, xy) => mockRequest(expressApi._price[`${serviceId}_${xy}`] || null)
expressApi.savePriceConfig = (serviceId, xy, cfg) => { expressApi._price[`${serviceId}_${xy}`] = cfg; return mockRequest(null) }
// 起运地/目的地代码（内嵌子视图，按 escId 存 code 列表 + 每个 code 的邮编范围）
// 结构：_locCode[escId] = { start: [{id,code,createTime}], end: [...] }
//       _postal[`${escId}_${type}_${code}`] = [{id,zonedId,postalS,postalE}]
expressApi._locCode = {}
expressApi._postal = {}
let _locSeq = 100
const _loc = (escId) => (expressApi._locCode[escId] || (expressApi._locCode[escId] = { start: [], end: [] }))
expressApi.getLocList = (escId, type) => mockRequest(_loc(escId)[type].slice())
expressApi.saveLoc = (escId, type, row) => {
  const list = _loc(escId)[type]
  if (row.id) { const t = list.find(x => x.id === row.id); if (t) Object.assign(t, row) }
  else list.unshift({ id: ++_locSeq, code: row.code, createTime: dtime(_locSeq) })
  return mockRequest(null)
}
expressApi.removeLoc = (escId, type, id) => {
  const list = _loc(escId)[type]; const idx = list.findIndex(x => x.id === id)
  if (idx > -1) list.splice(idx, 1); return mockRequest(null)
}
expressApi.getPostal = (escId, type, code) => mockRequest((expressApi._postal[`${escId}_${type}_${code}`] || []).slice())
expressApi.savePostal = (escId, type, code, row) => {
  const key = `${escId}_${type}_${code}`; const list = expressApi._postal[key] || (expressApi._postal[key] = [])
  if (row.id) { const t = list.find(x => x.id === row.id); if (t) Object.assign(t, row) }
  else list.unshift({ id: ++_locSeq, ...row })
  return mockRequest(null)
}
expressApi.removePostal = (escId, type, code, id) => {
  const list = expressApi._postal[`${escId}_${type}_${code}`] || []; const idx = list.findIndex(x => x.id === id)
  if (idx > -1) list.splice(idx, 1); return mockRequest(null)
}
// 国际分区（distinct，按 escId 存分区 + 每分区关联国家）
expressApi._distinct = {}
expressApi._distinctRelate = {}
expressApi.getDistinctList = escId => mockRequest((expressApi._distinct[escId] || []).slice())
expressApi.saveDistinct = (escId, row) => {
  const list = expressApi._distinct[escId] || (expressApi._distinct[escId] = [])
  if (row.id) { const t = list.find(x => x.id === row.id); if (t) Object.assign(t, row) }
  else list.unshift({ id: ++_locSeq, name: row.name, createTime: dtime(_locSeq) })
  return mockRequest(null)
}
expressApi.removeDistinct = (escId, id) => {
  const list = expressApi._distinct[escId] || []; const idx = list.findIndex(x => x.id === id)
  if (idx > -1) list.splice(idx, 1); return mockRequest(null)
}
expressApi.getDistinctRelate = zoneId => mockRequest((expressApi._distinctRelate[zoneId] || []).slice())
expressApi.saveDistinctRelate = (zoneId, countries) => { expressApi._distinctRelate[zoneId] = countries; return mockRequest(null) }
// 复制邮编编码（起运地代码）：mock 仅回执成功（源 CopyTargetCode）
expressApi.copyLoc = params => mockRequest(null)

/* 通用：关联代理商 / 价格配置 / 服务组合的内存存取工厂（各页共用同一套语义） */
function attachAgent(api) {
  api._agents = api._agents || {}
  api.getAgentById = id => mockRequest(api._agents[id] || [])
  api.saveAgent = (id, agents) => { api._agents[id] = agents; return mockRequest(null) }
}
function attachPrice(api) {
  api._price = api._price || {}
  api.getPriceConfig = (serviceId, xy) => mockRequest(api._price[`${serviceId}_${xy}`] || null)
  api.savePriceConfig = (serviceId, xy, cfg) => { api._price[`${serviceId}_${xy}`] = cfg; return mockRequest(null) }
}
attachAgent(expressApi)

/* ============================================================================
 * 五、订舱 booking（列表 + 航线服务商 + 计费区间/柜型 + 关联代理商）
 *   status 字符串 '1'/'0'；conveyance 0空1海2铁4卡；transType 逗号拼接
 * ========================================================================== */
export const bookingApi = defineMock('svc_booking_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const conv = at(['0', '1', '2', '4'], i)
    const from = at(COUNTRIES, i); const to = at(COUNTRIES, i + 2)
    const trans = conv === '0' ? '0,1' : conv === '1' ? '2,3' : conv === '2' ? '2,3' : '4,5'
    return {
      id: i + 1, name: `${from.name}-${to.name}${at(['直航', '中转', '快线'], i)}${pad(i + 1)}`,
      serviceCode: `BK${pad(i + 1)}`, alias: `${from.alias}${to.alias}线`,
      conveyance: conv, transType: trans,
      countryFromId: from.id, countryFromName: from.name, portsFromName: `${from.name}港`,
      countryToId: to.id, countryToName: to.name, portsToName: `${to.name}港`,
      transConfiged: i % 2 === 0, axisRangeConfiged: i % 3 === 0, axisTypeConfiged: i % 3 !== 0,
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
bookingApi.list = (p = {}) => bookingApi.res.query(o =>
  (!p.conveyance || o.conveyance === p.conveyance) &&
  (!p.countryFromId || o.countryFromId === p.countryFromId) &&
  (!p.countryToId || o.countryToId === p.countryToId) &&
  (!p.transType || String(o.transType).split(',').includes(p.transType)) &&
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.serviceCode || String(o.serviceCode).includes(p.serviceCode)),
  { page: p.page || 1, size: p.size || 10 })
bookingApi.save = d => (d.id ? bookingApi.res.update(d.id, d) : bookingApi.res.add(d))
bookingApi.changeStatus = id => { const r = bookingApi.res.get; const cur = bookingApi.res.raw().find(o => o.id === Number(id)); if (cur) bookingApi.res.update(id, { status: cur.status === '1' ? '0' : '1' }); return mockRequest(null) }
attachAgent(bookingApi); attachPrice(bookingApi)
// 航线服务商（按 bsId 存列表）
bookingApi._trans = {}
let _transSeq = 200
bookingApi.getTransList = (bsId, p = {}) => {
  const list = bookingApi._trans[bsId] || (bookingApi._trans[bsId] = [])
  return mockRequest(paginate(list.slice(), { page: p.page || 1, size: p.size || 10 }))
}
bookingApi.saveTrans = (bsId, row) => {
  const list = bookingApi._trans[bsId] || (bookingApi._trans[bsId] = [])
  if (row.id) { const t = list.find(x => x.id === row.id); if (t) Object.assign(t, row) }
  else list.unshift({ id: ++_transSeq, ...row })
  return mockRequest(null)
}
bookingApi.removeTrans = (bsId, id) => {
  const list = bookingApi._trans[bsId] || []; const idx = list.findIndex(x => x.id === id)
  if (idx > -1) list.splice(idx, 1); return mockRequest(null)
}

/* ============================================================================
 * 六、报关 customs（列表 + 关联代理商/成本项目/海关）
 *   status 字符串 '1'/'0'；modifyStatus 传目标值
 * ========================================================================== */
export const customsApi = defineMock('svc_customs_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i); const sub = String((i % 4) + 1)
    return {
      id: i + 1, name: `${country.name}报关${pad(i + 1)}`, csId: `CS${pad(i + 1)}`,
      abbr: `报关${pad(i + 1)}`, subtypeId: sub, subtypeName: at(SUBTYPE_LIST, i % 4).name,
      countryId: country.id, countryName: country.name,
      costitemConfiged: i % 2 === 0, customsConfiged: i % 3 === 0,
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
customsApi.list = (p = {}) => customsApi.res.query(o =>
  (!p.countryId || o.countryId === p.countryId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.code || String(o.csId).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
customsApi.save = d => (d.id ? customsApi.res.update(d.id, d) : customsApi.res.add(d))
customsApi.changeStatus = (id, status) => customsApi.res.update(id, { status })
attachAgent(customsApi)
// 关联成本项目（按 cscId）
customsApi._cost = {}
customsApi.getCostById = id => mockRequest(customsApi._cost[id] || [])
customsApi.saveCost = (id, list) => { customsApi._cost[id] = list; return mockRequest(null) }
// 关联海关（按 cscId）
customsApi._cabinet = {}
customsApi.getCabinetList = () => mockRequest(['深圳海关', '广州海关', '上海海关', '宁波海关'].map((n, i) => ({ id: `H${i + 1}`, name: n })))
customsApi.getServiceCabinet = id => mockRequest(customsApi._cabinet[id] || [])
customsApi.saveCabinet = (id, list) => { customsApi._cabinet[id] = list; return mockRequest(null) }

/* 通用：range 计费配置（车型/区间，按 kscId/tscId + priceType 存） */
function attachRange(api) {
  api._range = api._range || {}
  api.getRange = (id, priceType) => mockRequest(api._range[`${id}_${priceType}`] || null)
  api.saveRange = (id, priceType, rangeList) => { api._range[`${id}_${priceType}`] = rangeList; return mockRequest(null) }
}
/* 通用：目的地/地址（按 id + type 存） */
function attachDest(api, idKey) {
  api._dest = api._dest || {}
  api.getDest = (id, type) => mockRequest(api._dest[`${id}_${type}`] || [])
  api.saveDest = (id, type, list) => { api._dest[`${id}_${type}`] = list; return mockRequest(null) }
}
/* 通用：服务组合（svcgroup，按 typeId+subtypeId 过滤） */
function makeSvcGroup(key) {
  const api = defineMock(key, () => [], [], 1)
  api.query = (p = {}) => api.res.query(o => (!p.subtypeId || o.subtypeId === p.subtypeId), { page: p.page || 1, size: p.size || 10 })
  api.save = d => (d.id ? api.res.update(d.id, d) : api.res.add(d))
  return api
}

/* ============================================================================
 * 七、卡派 truck（列表 + 编辑 + 设置车型/区间 + 目的地 + 服务组合）
 *   status 字符串 '1'/'0'；priceType '0'车型/'1''2'区间；里程 type'3'存priceType'4'
 * ========================================================================== */
export const truckApi = defineMock('svc_truck_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i); const sub = String(i % 2) // 0整柜/1拼箱
    // 计费方式 priceType：subtypeId'0'→托数'1'/重量方数'2'；subtypeId'1'→车型'0'
    const priceType = sub === '0' ? at(['1', '2'], i) : '0'
    const addressType = at(['0', '1', '4'], i) // 机场0/港口1/私人地址4
    return {
      id: i + 1, name: `${country.name}卡派${pad(i + 1)}`, ksId: `KS${pad(i + 1)}`,
      abbr: `卡派${pad(i + 1)}`, subtypeId: sub, subtypeName: sub === '0' ? '整柜卡派' : '拼箱卡派',
      countryId: country.id, countryName: country.name, priceType,
      addressType, endAddressType: addressType, addressCategory: String(i % 2),
      x: i % 2 === 0, y: i % 3 === 0, terms: '',
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 2)
truckApi.list = (p = {}) => truckApi.res.query(o =>
  (!p.countryId || o.countryId === p.countryId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.addressType || o.addressType === p.addressType) &&
  (!p.addressCategory || o.addressCategory === p.addressCategory) &&
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.code || String(o.ksId).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
truckApi.getById = id => { const r = truckApi.res.raw().find(o => o.id === Number(id)); return mockRequest(r ? { ...r } : {}) }
truckApi.save = d => (d.id ? truckApi.res.update(d.id, d) : truckApi.res.add(d))
truckApi.changeStatus = (id, status) => truckApi.res.update(id, { status })
attachAgent(truckApi)
// 关联代理商下拉（cas 'A'，源 getCustTypeList → {custId,custName}，此处统一 {id,name}）
truckApi.getAgents = subtypeId => mockRequest(AGENTS.map((n, i) => ({ id: `A${i + 1}`, name: n })))
// 计费区间/车型（viewRange 返回 {rangeList}；saveRange 依 priceType 落 计费点x / 里程点y）
truckApi._range = {}
truckApi.viewRange = (id, priceType) => mockRequest({ rangeList: (truckApi._range[`${id}_${priceType}`] || []).slice() })
truckApi.saveRange = ({ kscId, priceType, rangeList }) => {
  truckApi._range[`${kscId}_${priceType}`] = rangeList
  if (String(priceType) === '4') truckApi.res.update(kscId, { y: true })
  else truckApi.res.update(kscId, { x: true })
  return mockRequest(null)
}
// 目的地（按 kscId+addressType 存 [{destinationId,destinationName,countryId,countryName,addressType}]）
truckApi._purpost = {}
let _truckSeq = 300
truckApi.getPurpost = (kscId, addressType) => mockRequest((truckApi._purpost[`${kscId}_${addressType}`] || []).slice())
truckApi.savePurpost = ({ kscId, type, delList = [], insList = [] }) => {
  const key = `${kscId}_${type}`
  let list = truckApi._purpost[key] || (truckApi._purpost[key] = [])
  const delIds = delList.map(d => d.destinationId)
  list = list.filter(x => !delIds.includes(x.destinationId))
  insList.forEach(ins => list.push({ ...ins, id: ++_truckSeq }))
  truckApi._purpost[key] = list
  truckApi.res.update(kscId, { y: true })
  return mockRequest(null)
}
// 服务组合（svcgroup，typeId '01'，按 subtypeId 过滤）
export const truckSvcGroup = makeSvcGroup('svc_truck_group')
// 服务组合子弹窗：关联服务名称候选（按 subtypeId）
export const getLscComplicatedList = (p = {}) => mockRequest(
  Array.from({ length: 8 }, (_, i) => ({ id: `TL${i + 1}`, name: `${lookup(TRUCK_SUBTYPE_LIST, p.subtypeId || '0')}服务${pad(i + 1)}` }))
)
// 海外仓（addressType '3'）
export const getFbastoreList = countryId => mockRequest(
  WAREHOUSES.map(w => ({ id: w.id, code: w.code, address: w.address, postal: '', stateName: '', countryId: '1', countryName: '美国' }))
)

/* ============================================================================
 * 八、拖车 trailer（列表 + 编辑 + 目的地址 + 设置柜型 + 服务组合）
 *   status 字符串 '1'/'0'；addressType 数字型
 * ========================================================================== */
export const trailerApi = defineMock('svc_trailer_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i); const sub = String(i % 2)
    return {
      id: i + 1, name: `${country.name}拖车${pad(i + 1)}`, tsId: `TS${pad(i + 1)}`,
      abbr: `拖车${pad(i + 1)}`, subtypeId: sub, subtypeName: sub === '0' ? '港区拖车' : '铁路拖车',
      countryId: country.id, addressCategory: String(i % 2),
      x: i % 2 === 0, y: i % 3 === 0,
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
trailerApi.list = (p = {}) => trailerApi.res.query(o =>
  (!p.countryId || o.countryId === p.countryId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.addressCategory || o.addressCategory === p.addressCategory) &&
  (p.addressType == null || p.addressType === '' || String(o.endAddressType) === String(p.addressType)) &&
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.code || String(o.tsId).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
trailerApi.getById = id => { const r = trailerApi.res.raw().find(o => o.id === Number(id)); return mockRequest(r ? { ...r } : {}) }
trailerApi.save = d => (d.id ? trailerApi.res.update(d.id, d) : trailerApi.res.add(d))
trailerApi.changeStatus = (id, status) => trailerApi.res.update(id, { status })
attachAgent(trailerApi)
// 关联代理商下拉（cas 'A' typeId '06'，源 getCustTypeList→{custId,custName}，此处统一 {id,name}）
trailerApi.getAgents = subtypeId => mockRequest(AGENTS.map((n, i) => ({ id: `A${i + 1}`, name: n })))
// 关联柜型（全部柜型 = CONTAINERS；按 tscId 存 [{cabinetId,cabinetName}]）
trailerApi.getCabinetList = () => mockRequest(CONTAINERS.map(c => ({ ...c })))
trailerApi._cabinet = {}
trailerApi.getServiceCabinet = id => mockRequest((trailerApi._cabinet[id] || []).slice())
trailerApi.saveCabinet = ({ tscId, delList = [], insList = [] }) => {
  let list = trailerApi._cabinet[tscId] || (trailerApi._cabinet[tscId] = [])
  const delIds = delList.map(d => d.cabinetId)
  list = list.filter(x => !delIds.includes(x.cabinetId))
  insList.forEach(ins => list.push({ ...ins }))
  trailerApi._cabinet[tscId] = list
  trailerApi.res.update(tscId, { x: list.length > 0 })
  return mockRequest(null)
}
// 目的地址：私人行内编辑（type 0）+ 其它类型穿梭（按 tscId + type）
let _trailerSeq = 400
trailerApi._priv = {}   // 私人地址（type 0）：[{id,country,countryId,province,provinceId,city,cityId,street,streetIds,result}]
trailerApi._addr = {}   // 其它类型：[{id,addrId,addrName,countryId,type}]
trailerApi.getPrivList = (tscId, p = {}) =>
  mockRequest(paginate((trailerApi._priv[tscId] || []).slice(), { page: p.page || 1, size: p.size || 10 }))
trailerApi.savePriv = (tscId, row) => {
  const list = trailerApi._priv[tscId] || (trailerApi._priv[tscId] = [])
  if (row.deleted === 1) {
    const idx = list.findIndex(x => x.id === row.id); if (idx > -1) list.splice(idx, 1)
  } else if (row.id) {
    const t = list.find(x => x.id === row.id); if (t) Object.assign(t, row)
  } else {
    list.unshift({ ...row, id: ++_trailerSeq })
  }
  trailerApi.res.update(tscId, { y: (trailerApi._priv[tscId] || []).length > 0 || (trailerApi._addr[`${tscId}_0`] || []).length > 0 })
  return mockRequest(null)
}
trailerApi.getAddrList = (tscId, type) => mockRequest((trailerApi._addr[`${tscId}_${type}`] || []).slice())
trailerApi.saveAddrOther = ({ tscId, type, delList = [], insList = [] }) => {
  const key = `${tscId}_${type}`
  let list = trailerApi._addr[key] || (trailerApi._addr[key] = [])
  const delIds = delList.map(d => (d && d.id != null ? d.id : d))
  list = list.filter(x => !delIds.includes(x.id))
  insList.forEach(ins => list.push({ ...ins, id: ++_trailerSeq }))
  trailerApi._addr[key] = list
  trailerApi.res.update(tscId, { y: true })
  return mockRequest(null)
}
export const trailerSvcGroup = makeSvcGroup('svc_trailer_group')
// 拖车私人地址：国家→省市级联（cascader）+ 街道/区
export const getTrailerAreas = countryId => mockRequest(
  (STATES[countryId] || STATES['1']).map((s, i) => ({
    id: `${countryId}-P${i}`, name: s.name,
    children: ['中心城', '港区', '开发区'].map((c, k) => ({ id: `${countryId}-P${i}-C${k}`, name: c }))
  }))
)
export const getTrailerStreets = (countryId, cityId) => mockRequest(
  ['一街道', '二街道', '三街道'].map((n, i) => ({ id: `${cityId || countryId}-ST${i}`, name: n, alias: n }))
)

/* ============================================================================
 * 九、仓储 warehousing（列表 + 编辑 + 关联代理商）
 *   status 字符串 '1'/'0'；关联成本项目类型列源已注释
 * ========================================================================== */
export const warehousingApi = defineMock('svc_warehousing_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i)
    return {
      id: i + 1, name: `${country.name}仓储${pad(i + 1)}`, serviceCode: `WH${pad(i + 1)}`,
      abbr: `仓储${pad(i + 1)}`, subtypeId: String((i % 4) + 1),
      belong: String(i % 3), examine: i % 2 === 0,
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
warehousingApi.list = (p = {}) => warehousingApi.res.query(o =>
  (!p.name || String(o.name).includes(p.name)) &&
  (!p.code || String(o.serviceCode).includes(p.code)),
  { page: p.page || 1, size: p.size || 10 })
warehousingApi.save = d => (d.id ? warehousingApi.res.update(d.id, d) : warehousingApi.res.add(d))
warehousingApi.changeStatus = (id, status) => warehousingApi.res.update(id, { status })
attachAgent(warehousingApi)

/* ============================================================================
 * 十、专线 privateline-line（列表 + 编辑 + 计费/目的地 + 代理商 + 服务组合 paivatelineSet）
 *   status 字符串 '1'/'0'；结构最复杂，onCharge 依 subtype+containerType+priceType
 * ========================================================================== */
export const privatelineApi = defineMock('svc_privateline_v2', () =>
  Array.from({ length: 16 }, (_, i) => {
    const sub = at(['0', '1', '2', '4'], i) // 空/海/铁/卡散（快递3过滤）
    const from = at(COUNTRIES, i); const to = at(COUNTRIES, i + 1)
    const containerType = (sub === '1' || sub === '2') ? String(i % 2) : ''
    return {
      id: i + 1, name: `${from.name}-${to.name}专线${pad(i + 1)}`, lsId: `LS${pad(i + 1)}`,
      productId: at(PRODUCTS, i).id, productName: at(PRODUCTS, i).productName,
      subtypeId: sub, subtypeName: at(SUBTYPE_LIST, ['0', '1', '2', '4'].indexOf(sub) >= 0 ? Number(sub === '4' ? 4 : sub) : 0).name,
      containerType, coverTank: String(i % 2),
      countryId: from.id, countryName: from.name,
      targets: [{ countryId: to.id, countryName: to.name }],
      departureName: `${from.name}港`, destinationName: `${to.name}港`,
      orgTag: at(['1', '2', '3', '4'], i),
      purposeType: i % 3, dispatch: String(i % 5), examine: i % 2 === 0,
      ytag: i % 2 === 0, xtag: i % 3 === 0,
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
privatelineApi.list = (p = {}) => privatelineApi.res.query(o =>
  (!p.productId || o.productId === p.productId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.containerType || o.containerType === p.containerType) &&
  (!p.coverTank || o.coverTank === p.coverTank) &&
  (!p.countryFromId || o.countryId === p.countryFromId) &&
  (p.countryId == null || p.countryId === '' || o.targets.some(t => t.countryId === p.countryId)) &&
  (!p.orgTag || o.orgTag === p.orgTag) &&
  (p.purposeType == null || p.purposeType === '' || o.purposeType === Number(p.purposeType)) &&
  (!p.dispatch || o.dispatch === p.dispatch) &&
  (!p.status || o.status === p.status) &&
  (!p.name || String(o.name).includes(p.name)),
  { page: p.page || 1, size: p.size || 10 })
privatelineApi.getById = id => { const r = privatelineApi.res.raw().find(o => o.id === Number(id)); return mockRequest(r ? { ...r } : {}) }
privatelineApi.save = d => (d.id ? privatelineApi.res.update(d.id, d) : privatelineApi.res.add(d))
privatelineApi.changeStatus = (id, status) => privatelineApi.res.update(id, { status })
attachAgent(privatelineApi); attachPrice(privatelineApi)
// 关联代理商下拉（cas 'A' typeId '05'，源 getCustTypeList→{custId,custName}）
privatelineApi.getAgents = subtypeId => mockRequest(AGENTS.map((n, i) => ({ id: `A${i + 1}`, name: n })))
// 计费/目的地保存后翻转状态点：xy 'Y'→目的地(ytag)，'X'→计费(xtag)
const _plSavePrice = privatelineApi.savePriceConfig
privatelineApi.savePriceConfig = (serviceId, xy, cfg) => {
  _plSavePrice(serviceId, xy, cfg)
  privatelineApi.res.update(serviceId, xy === 'Y' ? { ytag: true } : { xtag: true })
  return mockRequest(null)
}
export const privatelineSvcGroup = makeSvcGroup('svc_privateline_group')
// 关联服务（服务组子弹窗用；lineCreate '1' 已建禁选）
privatelineApi.getComplicatedList = (p = {}) => mockRequest(
  Array.from({ length: 8 }, (_, i) => ({ id: `PL${i + 1}`, name: `${lookup(SUBTYPE_LIST, p.subtypeId || '0')}线路${pad(i + 1)}`, status: '1', lineCreate: i % 3 === 0 ? '1' : '0' }))
)
// 起运港/目的港选择弹窗（源 getPortData 分页表格；此处返回全量供页面客户端分页）
privatelineApi.getPorts = (countryId, type, name) => mockRequest(
  PORTS.filter(p => (!countryId || String(countryId).split(',').includes(p.countryId)) && (!name || p.name.includes(name)))
    .map(p => ({ id: p.id, name: p.name, code: p.code }))
)

/* ============================================================================
 * 十一、专线服务组 privateline-line-group（国家维度，countryName/lscName，status 开关）
 * ========================================================================== */
export const lineGroupApi = defineMock('svc_line_group_v2', () =>
  Array.from({ length: 12 }, (_, i) => {
    const country = at(COUNTRIES, i)
    return {
      id: i + 1, name: `${country.name}线路组${pad(i + 1)}`,
      countryId: country.id, countryName: country.name,
      lscName: Array.from({ length: (i % 3) + 1 }, (_, k) => `${country.name}专线${k + 1}`).join('、'),
      lscIds: Array.from({ length: (i % 3) + 1 }, (_, k) => `PL${k + 1}`),
      status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 1)
lineGroupApi.list = (p = {}) => lineGroupApi.res.query(() => true, { page: p.page || 1, size: p.size || 10 })
lineGroupApi.save = d => (d.id ? lineGroupApi.res.update(d.id, d) : lineGroupApi.res.add(d))
lineGroupApi.changeStatus = (id, status) => lineGroupApi.res.update(id, { status })
// 编辑回显：组内已关联服务（源 getLscGroupItems，返回 [{id,name}]）
lineGroupApi.getItems = id => {
  const r = lineGroupApi.res.raw().find(o => o.id === Number(id)) || {}
  const ids = r.lscIds || []
  const names = (r.lscName || '').split('、')
  return mockRequest(ids.map((lid, i) => ({ id: lid, name: names[i] || lid })))
}

