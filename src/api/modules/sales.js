// 销售管理模块 mock 接口（保真对齐 vue3-jht-admin/src/views/sales-management）
// 覆盖：服务组、佣金配置、订单统计、业务员订单管理、销售计划(公司/部门/业务员)、
//       代理计划(发货计划)、销售看板(echarts)。
// 说明：源销售页无审核流；状态/可见性由身份码(custType/custSubtype/ifCustomer)+本地编辑态驱动。
import { defineMock, pad, at } from '../mockCrud'
import { createResource } from '../persist'
import { mockRequest, paginate } from '../mock'

/* ============================ 共享字典 ============================ */
// 业务类型（viewType/type/activeName 共用）：空运0/海运1/铁路2/卡航4（快递3 已弃用，源注释保留）
export const BIZ_TYPE_LIST = [
  { id: '0', name: '空运' }, { id: '1', name: '海运' },
  { id: '2', name: '铁路' }, { id: '4', name: '卡航' }
  // { id: '3', name: '快递' }  // 源注释保留：快递业务类型已弃用
]
// 单位规则：海运/铁路(1/2)→CBM，空运/卡航(0/4)→KG
export const unitByBiz = biz => (['1', '2'].includes(String(biz)) ? 'CBM' : 'KG')
// 审核状态（订单统计/业务员订单 顶部筛选）：待审核0/审核中3/审核通过1/审核拒绝2
export const AUDIT_LIST = [
  { id: '0', name: '待审核' }, { id: '3', name: '审核中' },
  { id: '1', name: '审核通过' }, { id: '2', name: '审核拒绝' }
]
// 地址类型：FBA仓库0/私人地址1/自有海外仓2
export const ADDRESS_TYPE_LIST = [
  { id: '0', name: 'FBA仓库' }, { id: '1', name: '私人地址' }, { id: '2', name: '自有海外仓' }
]
// 报关方式(customs0)：普通报关0/出口退税1
export const CUSTOMS0_LIST = [{ id: '0', name: '普通报关' }, { id: '1', name: '出口退税' }]
// 报关方式(customs1，源注释保留)：自有进口商报关0/无进口商1
// export const CUSTOMS1_LIST = [{ id: '0', name: '自有进口商报关' }, { id: '1', name: '无进口商' }]
// 派送方式（表格列语义）：快递0/卡派1/自提2/整柜直送3/到仓4
export const DELIVERY_WAY_LIST = [
  { id: '0', name: '快递' }, { id: '1', name: '卡派' }, { id: '2', name: '自提' },
  { id: '3', name: '整柜直送' }, { id: '4', name: '到仓' }
]
// 提货方式(pickList，声明未用于表格，保真保留)
export const PICK_LIST = [
  { id: '0', name: '自主送货' }, { id: '1', name: '上门提货' },
  { id: '2', name: '快递发货' }, { id: '3', name: '整柜直装' }
]
// 计费单位(priceUnit)：重量计费2/体积计费3
export const PRICE_UNIT_LIST = [{ id: '2', name: '重量计费' }, { id: '3', name: '体积计费' }]
// 公司类型(comType)：客户1/二级代理商2
export const COM_TYPE_LIST = [{ id: '1', name: '客户' }, { id: '2', name: '二级代理商' }]
// 计量方式(佣金)：按重量2(KG)/按体积3(CBM)
export const MEASURE_METHOD_LIST = [{ id: '2', name: '按重量' }, { id: '3', name: '按体积' }]
// 看板视图类型：公司看板1/部门看板2/员工看板3
export const VIEW_TYPE_LIST = [
  { id: '1', name: '公司看板' }, { id: '2', name: '部门看板' }, { id: '3', name: '员工看板' }
]
// 关键字检索类型（业务员订单）：原单号1/柜号2/快递单号3/提单号4
export const SELECT_TYPE_LIST = [
  { id: '1', name: '原单号' }, { id: '2', name: '柜号' }, { id: '3', name: '快递单号' }, { id: '4', name: '提单号' }
]
// searchMore 付款状态多选：已付款0/未付款1/逾期未付款2/冻结3/账单未出4
export const PAY_STATUS_LIST = [
  { id: '0', name: '已付款' }, { id: '1', name: '未付款' }, { id: '2', name: '逾期未付款' },
  { id: '3', name: '冻结' }, { id: '4', name: '账单未出' }
]
// searchMore 是否发货：未发货0/已发货1/部分发货2（数字型）
export const IF_LOADING_LIST = [
  { id: 0, name: '未发货' }, { id: 1, name: '已发货' }, { id: 2, name: '部分发货' }
]
// 快递状态：未出0/已出1
export const EXPRESS_NO_LIST = [{ id: '0', name: '未出' }, { id: '1', name: '已出' }]
// 代理计划-服务商机构类型(orgType2)：船东1/空运公司2/铁路公司3
export const ORG_TYPE2_LIST = [
  { id: '1', name: '船东' }, { id: '2', name: '空运公司' }, { id: '3', name: '铁路公司' }
]
// 状态开关：开启1/关闭0
export const SWITCH_STATUS_LIST = [{ id: '1', name: '开启' }, { id: '0', name: '关闭' }]

/* ============================ 兼容旧引用（占位骨架导出，保留避免其它页报错） ============================ */
export const STATUS_OPTIONS = ['启用', '禁用']
export const PLAN_STATUS = ['进行中', '已完成']
export const COMMISSION_TYPES = ['固定', '比例']

/* ============================ 工具函数 ============================ */
export const lookup = (list, id) => (list.find(x => String(x.id) === String(id)) || {}).name || '--'
const money = i => Number((((i * 137) % 90000) + 1000).toFixed(2))
const dstr = (i, o = 0) => `2024-${pad(((i + o) % 12) + 1)}-${pad(((i + o) % 27) + 1)}`
const dtime = i => `${dstr(i)} ${pad((i % 12) + 8)}:00:00`
const nowStr = () => {
  const n = new Date(); const p = x => String(x).padStart(2, '0')
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())} ${p(n.getHours())}:${p(n.getMinutes())}:${p(n.getSeconds())}`
}

/* ============================ 基础名录（选择弹窗/下拉共用） ============================ */
const COUNTRIES = [
  { id: '1', name: '美国', alias: 'US' }, { id: '2', name: '德国', alias: 'DE' },
  { id: '3', name: '日本', alias: 'JP' }, { id: '4', name: '英国', alias: 'GB' },
  { id: '5', name: '澳大利亚', alias: 'AU' }, { id: '6', name: '加拿大', alias: 'CA' }
]
const CLIENTS = ['深圳华通贸易', '广州速卖电商', '上海远洋供应链', '义乌小商品', '东莞跨境优选', '杭州云仓科技']
const COMPANIES = [
  { id: 'C1', name: '聚货通深圳总公司' }, { id: 'C2', name: '聚货通广州分公司' },
  { id: 'C3', name: '聚货通上海分公司' }, { id: 'C4', name: '聚货通义乌分公司' }
]
const DEPARTMENTS = [
  { id: 'D1', name: '空运事业部', parentId: 'C1' }, { id: 'D2', name: '海运事业部', parentId: 'C1' },
  { id: 'D3', name: '铁路事业部', parentId: 'C2' }, { id: 'D4', name: '卡航事业部', parentId: 'C2' }
]
const SALESMEN = [
  { id: 'U1', realName: '张业务', deptName: '空运事业部', deptId: 'D1', postType: 0 },
  { id: 'U2', realName: '李业务', deptName: '海运事业部', deptId: 'D2', postType: 0 },
  { id: 'U3', realName: '王业务', deptName: '铁路事业部', deptId: 'D3', postType: 0 },
  { id: 'U4', realName: '赵财务', deptName: '财务部', deptId: 'D5', postType: 1 },
  { id: 'U5', realName: '钱客服', deptName: '客服部', deptId: 'D6', postType: 2 }
]
const SERVICES = Array.from({ length: 12 }, (_, i) => ({
  id: `L${i + 1}`, name: `${at(['美国', '德国', '日本', '英国'], i)}${at(['空运', '海运', '铁路', '卡航'], i)}专线`,
  status: '1', subtypeId: String((i % 4) + 1), countryId: String((i % 6) + 1)
}))
const SERVICE_GROUPS = ['美线服务组', '欧线服务组', '日本服务组', '英国服务组', '澳洲服务组']
const WAREHOUSES = ['ONT8', 'LAX9', 'FRA3', 'NRT5', 'LHR2']

// 服务大类子类型（getServiceSubtypeList typeId:'05'，排除 id='3'）
const SUBTYPE_LIST = [
  { id: '1', name: '普船' }, { id: '2', name: '快船' },
  { id: '3', name: '特殊' }, { id: '4', name: '空派' }
]

/* ============================ 1. 服务组（service-group） ============================ */
// status：开启'1'/关闭'0'。提交字段为 lscIds（非 serviceIds）。
export const groupApi = defineMock('sales_group', () =>
  Array.from({ length: 14 }, (_, i) => {
    const country = at(COUNTRIES, i)
    const svc = SERVICES.filter((_, k) => k % 3 === i % 3).slice(0, 3)
    return {
      id: i + 1, name: `${country.name}${at(SERVICE_GROUPS, i)}${pad(i + 1)}`,
      countryId: country.id, countryName: country.name,
      subtypeId: String((i % 4) + 1), subtypeName: at(SUBTYPE_LIST, i % 4).name,
      lscName: svc.map(s => s.name).join('、'), lscId: svc.map(s => s.id).join(','),
      serviceIds: svc.map(s => s.id), status: i % 5 === 0 ? '0' : '1', createTime: dtime(i)
    }
  }), [], 2)
groupApi.list = (p = {}) => groupApi.res.query(() => true, { page: p.page || 1, size: p.size || 10 })
groupApi.setStatus = (id, status) => groupApi.res.update(id, { status: String(status) === '1' ? '1' : '0' })
groupApi.saveGroup = d => {
  const payload = { ...d, status: String(d.status ?? '1') === '1' ? '1' : '0' }
  return payload.id ? groupApi.res.update(payload.id, payload) : groupApi.res.add(payload)
}

/* ============================ 2. 佣金配置（commission-config） ============================ */
// 6 项比例系数 + 阶梯区间 extentVoList(min/max/unitPrice) + 版本(startTime~endTime) + 关联服务。
export const commissionApi = defineMock('sales_commission', () =>
  Array.from({ length: 12 }, (_, i) => {
    const svc = SERVICES.filter((_, k) => k % 4 === i % 4).slice(0, 2)
    return {
      id: i + 1, name: `佣金方案${pad(i + 1)}`,
      comId: at(COMPANIES, i).id, comName: at(COMPANIES, i).name,
      subtypeId: String((i % 4) + 1), subtypeName: at(SUBTYPE_LIST, i % 4).name,
      countryId: String((i % 6) + 1), countryName: at(COUNTRIES, i).name,
      lscId: svc[0]?.id || '', lscName: svc.map(s => s.name).join('、'),
      measureMethod: i % 2 === 0 ? 2 : 3,
      teamRatio: (i % 5) + 1, customerRatio: (i % 4) + 1, colleaguesRatio: (i % 3) + 1,
      escrowCustomerRatio: (i % 3) + 2, informalRatio: (i % 2) + 1,
      extentVoList: [
        { min: 0, max: 100, unitPrice: 5 + (i % 5) },
        { min: 100, max: 500, unitPrice: 4 + (i % 4) },
        { min: 500, max: 99999, unitPrice: 3 + (i % 3) }
      ],
      serviceIds: svc.map(s => s.id),
      startTime: dstr(i), endTime: dstr(i, 6), tag: i % 3 === 0 ? '1' : '0',
      createTime: dtime(i)
    }
  }), [], 2)
commissionApi.list = (p = {}) => commissionApi.res.query(o =>
  (!p.comId || o.comId === p.comId) &&
  (!p.subtypeId || o.subtypeId === p.subtypeId) &&
  (!p.lscId || o.lscId === p.lscId),
  { page: p.page || 1, size: p.size || 10 })
commissionApi.save = d => (d.id ? commissionApi.res.update(d.id, d) : commissionApi.res.add(d))
// 佣金版本（按 name 分组返回自身切片；mock 无多版本存储）
commissionApi.getVersion = (id, p = {}) => {
  const cur = commissionApi.res.raw().find(o => o.id === Number(id))
  const rows = cur ? [{ ...cur, versionNo: 'v1' }] : []
  return mockRequest(paginate(rows, { page: p.page || 1, size: p.size || 10 }))
}
// 操作日志（mock 造 3 条）
commissionApi.getLog = (id, p = {}) => mockRequest(paginate(
  Array.from({ length: 6 }, (_, i) => ({
    id: i + 1, operator: at(['张三', '李四', '王五'], i),
    action: at(['新增', '编辑', '关联服务'], i), time: dtime(i), remark: ''
  })), { page: p.page || 1, size: p.size || 10 }))

/* ============================ 订单宽表 种子（订单统计 / 业务员订单 共用模型） ============================ */
// 40+ 字段宽表；嵌套对象 custName/consignee/buyer/seller/lsc/express/measure/um/orderStatusLine。
const buildOrderSeed = n => Array.from({ length: n }, (_, i) => {
  const type = at(['0', '1', '2', '4'], i)
  const cur = at(['USD', 'EUR', 'CNY', 'JPY'], i)
  const custType = String(i % 2) // 行维度：0直客/1同行
  const deliveryWay = String(i % 5)
  const country = at(COUNTRIES, i)
  return {
    id: i + 1, code: `KP${700000 + i}`,
    custName: { name: at(CLIENTS, i), id: i + 1 },
    custType,
    orderStatusLine: {
      status: [{ statusName: at(['已下单', '已入仓', '运输中', '已到港', '已签收'], i), updateAt: dtime(i), describe: `状态描述${i}` }]
    },
    orderStatus_name: at(['已下单', '已入仓', '运输中', '已到港', '已签收'], i),
    orderStatus_describe: `状态描述${i}`, orderStatus_updateAt: dtime(i),
    createTime: dtime(i), wsInTime: dstr(i, 1), wareHouseAt: `${at(['深圳', '广州', '东莞'], i)}仓`,
    buyer: { name: at(CLIENTS, i + 1) }, seller: { name: '聚货通总部' },
    salesman: at(['张业务', '李业务', '王业务'], i), finances: at(['赵财务', '孙财务'], i), customers: at(['钱客服', '周客服'], i),
    addressType: String(i % 3),
    consignee: { country: country.name, province: at(['加州', '巴伐利亚', '东京都'], i), city: at(['洛杉矶', '慕尼黑', '东京'], i) },
    warehouse: at(WAREHOUSES, i), lsc: { value: `${country.name}专线` },
    type, customs0: String(i % 2), includeTax: i % 2 === 0, deliveryWay,
    express: {
      expressName: at(['DHL', 'FedEx', 'UPS', ''], i),
      trackingNos: deliveryWay === '0' ? [`TRK${i}001`, `TRK${i}002`] : []
    },
    containerNo: type === '1' ? `CN${5000 + i}` : '', billNo: type === '1' ? `BL${3000 + i}` : '',
    batch: `B${pad(i + 1)}`, packages: (i % 50) + 10,
    measure: {
      totalVolume: (i % 30) + 5, totalWight: (i % 800) + 100,
      priceVolume: (i % 20) + 3, priceWight: (i % 600) + 80, priceUnit: i % 2 === 0 ? '2' : '3'
    },
    um: { umLength: 'CM', umWeight: 'KGS' }, bulky: `1:${(i % 5) + 3}`,
    method: String(i % 5), credit: money(i), creditRating: at(['A', 'B', 'C'], i),
    cutoffTime: i % 3 === 0 ? dstr(i, 2) : '', invoiceTime: dstr(i, 2),
    amount: money(i), amountUnit: cur, selfAmount: Number((money(i) * 7).toFixed(2)), selfAmountUnit: 'CNY',
    payTime: dstr(i, 3), isPayment: i % 2 === 0, overDay: i % 4 === 0 ? (i % 15) : 0,
    audit: at(['0', '1', '2', '3'], i), remarks: '',
    // searchMore/统计相关
    ifLoading: i % 3, inventoryStatus: String(i % 8), measureStatus: String(i % 6),
    examineStatus: String(i % 5), declartionStatus: at(['415', '416', '417'], i), expressNo: deliveryWay === '0' ? '1' : '0'
  }
})

const orderMatch = (o, p) =>
  (!p.audit || o.audit === p.audit) &&
  (p.type === '' || p.type == null || o.type === p.type) &&
  (!p.countryId || o.consignee.country === lookup(COUNTRIES, p.countryId)) &&
  (!p.keyWord || (
    (p.selectType === '1' && o.code.includes(p.keyWord)) ||
    (p.selectType === '2' && o.containerNo.includes(p.keyWord)) ||
    (p.selectType === '3' && (o.express.trackingNos || []).join(',').includes(p.keyWord)) ||
    (p.selectType === '4' && o.billNo.includes(p.keyWord)) ||
    (!['1', '2', '3', '4'].includes(String(p.selectType)) && o.code.includes(p.keyWord))
  ))

const orderStatistics = () => ({
  orderCount: 128, paymentCount: 8620, unpaymentCount: 4200, overDueCount: 32,
  shippedCount: 74560.5, deliveringCount: 52340.8, receiverCount: 54
})

/* ============================ 3. 订单统计（orders-statistics） ============================ */
export const statApi = defineMock('sales_stat', () => buildOrderSeed(24), [], 2)
statApi.list = (p = {}) => statApi.res.query(o => orderMatch(o, p), { page: p.page || 1, size: p.size || 10 })
statApi.statistics = () => mockRequest(orderStatistics())

/* ============================ 4. 业务员订单管理（manager-order） ============================ */
export const managerApi = defineMock('sales_manager', () => buildOrderSeed(24), [], 2)
managerApi.list = (p = {}) => managerApi.res.query(o => orderMatch(o, p), { page: p.page || 1, size: p.size || 10 })
managerApi.statistics = () => mockRequest(orderStatistics())
// 左侧订单状态菜单（硬编码，number 为占位）
managerApi.getMenuList = () => mockRequest([
  { id: 1, name: '未入库', number: '111' },
  { id: 2, name: '未完成审核', number: '' },
  { id: 3, name: '收货异常', number: '' },
  { id: 4, name: '已收货', number: '' },
  { id: 5, name: '已订舱', number: '' },
  { id: 6, name: '已签收', number: '' },
  {
    id: 7, name: '未付款', number: '777', children: [
      { id: 8, name: '票结未付', number: '' },
      { id: 9, name: '逾期未付', number: '' },
      { id: 10, name: '账单未付', number: '' }
    ]
  },
  { id: 11, name: '信用不足', number: '' },
  { id: 12, name: '已付款', number: '' }
])
// 订单状态字典（searchMore：入库/计量/验货/报关）
managerApi.getStatusList = () => mockRequest([
  ...['未入库', '部分入库', '已入库'].map((name, i) => ({ id: `WS${i}`, name, type: 'WS_IN' })),
  ...['未计量', '已计量'].map((name, i) => ({ id: `ME${i}`, name, type: 'MEASURE' })),
  ...['未验货', '已验货'].map((name, i) => ({ id: `EX${i}`, name, type: 'EXAMINE' })),
  ...['未报关', '报关中', '已报关'].map((name, i) => ({ id: `CD${i}`, name, type: 'CUSTOM_DECLARATION' })),
  { id: '99', name: '作废', type: 'WS_IN' }
])
// searchMore 业务员/财务/客服列表（postType：0业务员/1财务/2客服）
managerApi.getUserList = () => mockRequest(SALESMEN)

/* ============================ 5. 销售计划（plan-distribut：公司/部门/业务员） ============================ */
// 三档共用 distribut 详情：company=按列合计表格；depart/sales=瀑布流任务卡。
const buildPlanSeed = (prefix, n, isType) => Array.from({ length: n }, (_, i) => ({
  id: i + 1, name: `${prefix}计划${pad(i + 1)}`,
  companyId: at(COMPANIES, i).id, companyName: at(COMPANIES, i).name,
  deptId: isType !== 'company' ? at(DEPARTMENTS, i).id : '', deptName: isType !== 'company' ? at(DEPARTMENTS, i).name : '',
  userId: isType === 'sales' ? at(SALESMEN, i).id : '', userName: isType === 'sales' ? at(SALESMEN, i).realName : '',
  year: '2024', fiscalId: (i % 6) + 1, fiscalName: `2024年第${(i % 12) + 1}期`,
  subtypeId: String((i % 4) + 1), business: String((i % 4) + 1),
  airNum: (i % 10) * 100 + 500, seaNum: (i % 8) * 50 + 200, trainNum: (i % 6) * 40 + 100, carNum: (i % 5) * 60 + 150,
  createTime: dtime(i)
}))
export const planApi = {
  company: defineMock('sales_plan_company', () => buildPlanSeed('公司', 10, 'company'), [], 2),
  depart: defineMock('sales_plan_depart', () => buildPlanSeed('部门', 10, 'depart'), [], 2),
  sales: defineMock('sales_plan_sales', () => buildPlanSeed('业务员', 10, 'sales'), [], 2)
}
planApi.listCompany = (p = {}) => planApi.company.res.query(() => true, { page: p.page || 1, size: p.size || 10 })
planApi.listDepart = (p = {}) => planApi.depart.res.query(() => true, { page: p.page || 1, size: p.size || 10 })
planApi.listSales = (p = {}) => planApi.sales.res.query(() => true, { page: p.page || 1, size: p.size || 10 })
// 分配详情（company：分月合计表；depart/sales：任务卡）
planApi.getDistribut = (row, isType) => {
  if (isType === 'company') {
    // 按月分配表，每行含 airNum/seaNum/trainNum/carNum
    const rows = Array.from({ length: 12 }, (_, m) => ({
      period: `2024年第${m + 1}期`, fiscalId: m + 1,
      airNum: 100 + m * 10, seaNum: 60 + m * 5, trainNum: 40 + m * 4, carNum: 80 + m * 6
    }))
    return mockRequest(rows)
  }
  // depart/sales：任务卡（周 + 服务组/目标）
  const cards = Array.from({ length: 6 }, (_, w) => ({
    week: w + 1, weekLabel: `第${w + 1}周`,
    items: SERVICE_GROUPS.slice(0, 3).map((g, k) => ({
      groupName: g, target: (w + 1) * 100 + k * 20, business: String((k % 4) + 1)
    }))
  }))
  return mockRequest(cards)
}

/* ============================ 6. 代理计划（agent-booking-plan / 发货计划） ============================ */
// type：'1'/'2'→体积(CBM)，'0'/'4'→重量(KG)；orgType2 服务商机构类型；服务商多选逗号拼接。
export const agentPlanApi = defineMock('sales_agent_plan', () =>
  Array.from({ length: 12 }, (_, i) => {
    const type = at(['0', '1', '2', '4'], i)
    return {
      id: i + 1, code: `FH${pad(i + 1)}`, name: `发货计划${pad(i + 1)}`,
      type, unit: unitByBiz(type),
      countryId: String((i % 6) + 1), countryName: at(COUNTRIES, i).name,
      orgType2: String((i % 3) + 1),
      providerIds: SERVICE_GROUPS.slice(0, (i % 3) + 1).map((_, k) => `P${k + 1}`).join(','),
      providerNames: SERVICE_GROUPS.slice(0, (i % 3) + 1).join(','),
      planNum: (i % 20) * 100 + 500, planTime: dstr(i, 1),
      remark: '', createTime: dtime(i)
    }
  }), [], 1)
agentPlanApi.list = (p = {}) => agentPlanApi.res.query(o =>
  (p.type === '' || p.type == null || o.type === p.type) &&
  (!p.countryId || o.countryId === p.countryId) &&
  (!p.keyWord || o.name.includes(p.keyWord) || o.code.includes(p.keyWord)),
  { page: p.page || 1, size: p.size || 10 })
agentPlanApi.save = d => (d.id ? agentPlanApi.res.update(d.id, d) : agentPlanApi.res.add(d))
// 服务商选择（1200px 弹窗数据源）
agentPlanApi.getProviders = (p = {}) => mockRequest(paginate(
  Array.from({ length: 20 }, (_, i) => ({
    id: `P${i + 1}`, name: `${at(SERVICE_GROUPS, i)}供应商${pad(i + 1)}`,
    orgType2: String((i % 3) + 1), countryName: at(COUNTRIES, i).name, contact: `联系人${i + 1}`
  })), { page: p.page || 1, size: p.size || 10 }))

/* ============================ 7. 销售看板（sales-billboard，echarts） ============================ */
// 卡片(taskObj) + 公司/部门/员工排名图(区块2) + 服务组排名图(区块3)。
// 图表原用 ve-histogram(v-charts, Vue2-only)，目标以 vue-echarts 还原（柱线混合/堆叠）。
export const boardApi = {
  // 4 张统计卡：计划/完成/完成率（air/sea/train/car）
  getCard: (p = {}) => {
    const base = i => 8000 + i * 500
    const plan = base(1), actual = i => Math.round(base(i) * (0.6 + (i % 4) * 0.15))
    return mockRequest({
      planAir: plan, actualAir: actual(1), air: 76,
      planSea: base(2), actualSea: actual(2), sea: 88,
      planTrain: base(3), actualTrain: actual(3), train: 64,
      planCar: base(4), actualCar: actual(4), car: 92
    })
  },
  // 区块2：公司/部门/员工排名 + 图（chartData2 columns:['名称','计划量','完成量']）
  getChart: (p = {}) => {
    const nameKey = { '1': 'companyName', '2': 'deptName', '3': 'userName' }[p.type || '1']
    const src = { '1': COMPANIES.map(c => c.name), '2': DEPARTMENTS.map(d => d.name), '3': SALESMEN.filter(s => s.postType === 0).map(s => s.realName) }[p.type || '1']
    const rows = src.map((nm, i) => {
      const planNum = 5000 + i * 800, actualNum = Math.round(planNum * (0.5 + (i % 5) * 0.12))
      return { [nameKey]: nm, name: nm, planNum, actualNum, percent: Math.round((actualNum / planNum) * 100) }
    }).sort((a, b) => b.actualNum - a.actualNum)
    return mockRequest(rows)
  },
  // 区块3：服务组排名 + 图（chartData3 同结构）
  getGroupChart: (p = {}) => {
    const rows = SERVICE_GROUPS.map((nm, i) => {
      const planNum = 4000 + i * 600, actualNum = Math.round(planNum * (0.55 + (i % 4) * 0.13))
      return { groupName: nm, name: nm, planNum, actualNum, percent: Math.round((actualNum / planNum) * 100) }
    }).sort((a, b) => b.actualNum - a.actualNum)
    return mockRequest(rows)
  },
  // detail.vue 明细图（源为 mock 硬编码：目标量/完成量 堆叠）
  getDetail: () => mockRequest({
    rows: Array.from({ length: 6 }, (_, i) => ({
      name: `${at(SERVICE_GROUPS, i)}`, target: 2000 + i * 300,
      actual: Math.round((2000 + i * 300) * (0.6 + (i % 4) * 0.1)),
      percent: Math.round((0.6 + (i % 4) * 0.1) * 100)
    }))
  })
}

/* ============================ 选择弹窗 / 下拉 数据源 ============================ */
export const getCountryOptions = () => mockRequest(COUNTRIES)
export const getCompanyOptions = () => mockRequest(COMPANIES)
export const getUnCompanyOptions = () => mockRequest(COMPANIES.slice(1)) // 分公司（排除总公司）
export const getDepartmentTree = (companyId = '') => mockRequest(
  DEPARTMENTS.filter(d => !companyId || d.parentId === companyId).map(d => ({ label: d.name, value: d.id }))
)
export const getSalesmanOptions = () => mockRequest(SALESMEN.filter(s => s.postType === 0))
export const getServiceSubtypeOptions = () => mockRequest(SUBTYPE_LIST.filter(s => s.id !== '3')) // 排除 id='3'
export const getServiceOptions = (p = {}) => mockRequest(
  SERVICES.filter(s => s.status === '1' &&
    (!p.subtypeId || s.subtypeId === p.subtypeId) &&
    (!p.countryId || s.countryId === p.countryId))
)
export const getWarehouseOptions = (countryId = '') => mockRequest(
  WAREHOUSES.map((code, i) => ({ id: `W${i + 1}`, code, countryId: String((i % 6) + 1) }))
    .filter(w => !countryId || w.countryId === countryId)
)
export const getAgentOptions = () => mockRequest(CLIENTS.map((name, i) => ({ id: i + 1, name })))
// 会计期间（看板/佣金版本 期间下拉）
export const getFiscalOptions = () => mockRequest(
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, fiscalPeriod: `2024年第${i + 1}期`, year: '2024' }))
)
// 周期下拉（看板 weekList，label=第X周(start~end)）
export const getWeekOptions = () => mockRequest(
  Array.from({ length: 52 }, (_, i) => ({
    id: i + 1, start: dstr(i), end: dstr(i, 0)
  }))
)
