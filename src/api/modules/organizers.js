// 机构管理模块 mock 接口：角色/人员/部门/客户/代理商/供应商
// 数据经 persist.js 持久化到 localStorage，增删改查刷新后保留。
import { createResource } from '../persist'
import { mockRequest } from '../mock'

/* ============ 公共枚举 / 选项 ============ */
export const CUST_TYPES = ['聚货通', '客户', '代理商', '供应商']
export const CUSTOMER_SUBTYPES = ['直客', '同行']
export const ENTITY_TYPES = ['个人', '企业']
export const AUDIT_STATUS = ['待审核', '已通过', '已拒绝']
export const CONTRACT_STATUS = ['未签署', '已签署', '已注销']
export const CERT_TYPES = ['身份证', '护照', '营业执照']
export const SUPPLIER_BRANCH = ['总部', '分公司']
export const STATUS_OPTIONS = ['启用', '禁用']
export const POST_OPTIONS = ['总经理', '运营经理', '客服主管', '财务主管', '业务专员', '操作专员']
// 客户/代理商/供应商 扩展字段选项（对齐原项目表单）
export const COOP_PERIODS = ['1年', '2年', '3年', '5年', '长期']
export const COMPANY_SIZES = ['1-20人', '20-50人', '50-100人', '100-500人', '500人以上']
export const SALE_TYPES = ['直销', '分销', '平台代运营']
export const PLATFORM_TYPES = ['线下', '平台']
export const PLATFORMS = ['亚马逊', 'eBay', 'Shopify', '独立站', 'Temu', 'TikTok']
export const ADD_SOURCES = ['手工录入', '批量导入', '官网注册', '业务开发']
export const CUSTOMER_SOURCES = ['业务开发', '老客户介绍', '展会', '网络推广']
export const YES_NO = ['是', '否']
// 可开通的服务大类（开通服务弹窗用）
export const SERVICE_CATEGORIES = ['快递', '订舱', '卡派', '拖车', '报关', '仓储', '专线']

// 区域联动（country → state → city），供客户/代理商/供应商级联选择
// 四级地区：国家 / 州省 / 城市 / 区县（对齐原项目 countryId/stateId/cityId/countyId）
const county = (a, b) => [{ value: a, label: a }, { value: b, label: b }]
export const REGIONS = [
  { value: '美国', label: '美国', children: [
    { value: '加利福尼亚州', label: '加利福尼亚州', children: [
      { value: '洛杉矶', label: '洛杉矶', children: county('市中心区', '长滩区') },
      { value: '旧金山', label: '旧金山', children: county('湾区', '奥克兰区') }
    ] },
    { value: '纽约州', label: '纽约州', children: [
      { value: '纽约市', label: '纽约市', children: county('曼哈顿区', '布鲁克林区') },
      { value: '奥尔巴尼', label: '奥尔巴尼', children: county('中心区', '北区') }
    ] }
  ] },
  { value: '德国', label: '德国', children: [
    { value: '巴伐利亚', label: '巴伐利亚', children: [
      { value: '慕尼黑', label: '慕尼黑', children: county('老城区', '施瓦宾区') },
      { value: '纽伦堡', label: '纽伦堡', children: county('中央区', '南区') }
    ] },
    { value: '黑森', label: '黑森', children: [
      { value: '法兰克福', label: '法兰克福', children: county('市中心', '西区') }
    ] }
  ] },
  { value: '日本', label: '日本', children: [
    { value: '东京都', label: '东京都', children: [
      { value: '新宿', label: '新宿', children: county('西新宿', '歌舞伎町') },
      { value: '涩谷', label: '涩谷', children: county('道玄坂', '神南') }
    ] },
    { value: '大阪府', label: '大阪府', children: [
      { value: '大阪市', label: '大阪市', children: county('北区', '中央区') }
    ] }
  ] },
  { value: '英国', label: '英国', children: [
    { value: '英格兰', label: '英格兰', children: [
      { value: '伦敦', label: '伦敦', children: county('威斯敏斯特', '金融城') },
      { value: '曼彻斯特', label: '曼彻斯特', children: county('市中心', '索尔福德') }
    ] }
  ] },
  { value: '澳大利亚', label: '澳大利亚', children: [
    { value: '新南威尔士', label: '新南威尔士', children: [
      { value: '悉尼', label: '悉尼', children: county('CBD', '帕拉马塔') }
    ] },
    { value: '维多利亚', label: '维多利亚', children: [
      { value: '墨尔本', label: '墨尔本', children: county('市中心', '南岸') }
    ] }
  ] }
]

const COUNTRIES = REGIONS.map(r => r.value)
const pad = n => String(n).padStart(2, '0')
const pick = (arr, i) => arr[i % arr.length]
const seedTime = i => `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:00:00`
function regionAt(i) {
  const c = REGIONS[i % REGIONS.length]
  const s = c.children[i % c.children.length]
  const city = s.children[i % s.children.length]
  const cnty = city.children[i % city.children.length]
  return { country: c.value, state: s.value, city: city.value, county: cnty.value }
}

/* ============ 权限设置 / 角色 ============ */
// 菜单路由权限树（模块→叶子页面路径），供角色权限配置使用。
// 路径与 router/index.js 里 menuModules 保持一致。
export const MENU_TREE = [
  { id: 'organizers', label: '机构管理', children: [
    { id: '/organizers/role', label: '权限设置' },
    { id: '/organizers/personnel', label: '人员管理' },
    { id: '/organizers/department', label: '部门管理' },
    { id: '/organizers/customer', label: '客户管理' },
    { id: '/organizers/agent', label: '代理商管理' },
    { id: '/organizers/supplier', label: '供应商管理' }
  ]},
  { id: 'orderlist', label: '订单管理', children: [
    { id: '/orderlist/whole-order', label: '全程订单' },
    { id: '/orderlist/warehouse-order', label: '仓库订单' },
    { id: '/orderlist/order-sign', label: '订单签收' },
    { id: '/orderlist/salesman-order', label: '代客下单' },
    { id: '/orderlist/customs-order', label: '报关订单' },
    { id: '/orderlist/car-order', label: '卡派订单' },
    { id: '/orderlist/express-order', label: '快递订单' },
    { id: '/orderlist/booking-order', label: '订舱订单' },
    { id: '/orderlist/trailer-order', label: '拖车订单' }
  ]},
  { id: 'operation', label: '运营管理', children: [
    { id: '/operation/area-management', label: '国家省州' },
    { id: '/operation/port-management', label: '机场港口' },
    { id: '/operation/international-flight', label: '国际航线' },
    { id: '/operation/domestic-area', label: '区域配置' },
    { id: '/operation/service-agency', label: '服务机构' },
    { id: '/operation/vehicle-management', label: '车型选择' },
    { id: '/operation/container-management', label: '货柜管理' },
    { id: '/operation/fbacontainer-management', label: 'FBA仓库管理' },
    { id: '/operation/rate', label: '汇率记录' },
    { id: '/operation/currency-management', label: '货币管理' },
    { id: '/operation/taboo-management', label: '禁忌词语' },
    { id: '/operation/service-genara', label: '服务大类' },
    { id: '/operation/job-setup', label: '岗位设置' },
    { id: '/operation/report-definition', label: '报表定义' },
    { id: '/operation/customs-factor', label: '报关要素' },
    { id: '/operation/order-type', label: '下单配置' },
    { id: '/operation/task-document', label: '任务单证' },
    { id: '/operation/file-config', label: '文件配置' },
    { id: '/operation/examine-config', label: '验货配置' },
    { id: '/operation/aviation-plate', label: '航空板' },
    { id: '/operation/single-shipment', label: '分单发货' },
    { id: '/operation/container-shipment', label: '整柜发货' },
    { id: '/operation/order-delivery', label: '订单派送' },
    { id: '/operation/outsourc-shipment', label: '外协发货' }
  ]},
  { id: 'system', label: '系统管理', children: [
    { id: '/system/calc-weight', label: '收费重量计算' },
    { id: '/system/air-them-roughly', label: '航空号段' },
    { id: '/system/chauffeur-management', label: '司机管理' },
    { id: '/system/car-management', label: '车辆' },
    { id: '/system/commodity-audit', label: '商品审核' },
    { id: '/system/product-library', label: '产品库' },
    { id: '/system/job-commission', label: '岗位提成' },
    { id: '/system/pc-config', label: '着陆页配置' },
    { id: '/system/pda-config', label: 'PDA配置' },
    { id: '/system/delivery-plan', label: '发货计划' },
    { id: '/system/subscribe-plan', label: '计划订阅' },
    { id: '/system/notice-config', label: '通知配置' },
    { id: '/system/notice-center', label: '通知中心' },
    { id: '/system/notice-manage', label: '通知管理' },
    { id: '/system/customer-level', label: '客户评级' },
    { id: '/system/jht-set', label: '设置' },
    { id: '/system/feedback', label: '反馈' },
    { id: '/system/status-config', label: '状态设置' }
  ]},
  { id: 'warehouse', label: '仓库管理', children: [
    { id: '/warehouse/unloading-apply', label: '卸货' },
    { id: '/warehouse/measure-apply', label: '计量' },
    { id: '/warehouse/trailer-task', label: '拖托' },
    { id: '/warehouse/cabinet-removal', label: '拆柜任务' },
    { id: '/warehouse/moving-apply', label: '调拨' },
    { id: '/warehouse/output-apply', label: '出库' },
    { id: '/warehouse/inventory-apply', label: '盘点' },
    { id: '/warehouse/examine-apply', label: '验货' },
    { id: '/warehouse/anomaly-list', label: '异常' },
    { id: '/warehouse/transfer-task', label: '换单' },
    { id: '/warehouse/warehouse-config', label: '仓库配置' }
  ]},
  { id: 'financial', label: '财务管理', children: [
    { id: '/financial/invoice-receivable', label: '应收发票' },
    { id: '/financial/invoice-payable', label: '应付发票' },
    { id: '/financial/invoice-out', label: '开票' },
    { id: '/financial/collection-order', label: '收款单' },
    { id: '/financial/cash-order', label: '申请单' },
    { id: '/financial/payment-order', label: '付款单' },
    { id: '/financial/check-order', label: '对账单' },
    { id: '/financial/fiscal-period', label: '会计期间' },
    { id: '/financial/company-credit', label: '公司信用' },
    { id: '/financial/risk-control', label: '风险控制' },
    { id: '/financial/financial-order', label: '专线订单' }
  ]},
  { id: 'price', label: '价格管理', children: [
    { id: '/price/goods-surcharge', label: '货物附加费' },
    { id: '/price/charge-config', label: '收费配置' },
    { id: '/price/private-line', label: '专线价格' },
    { id: '/price/express', label: '快递价格' },
    { id: '/price/booking', label: '订舱价格' },
    { id: '/price/warehouse', label: '仓储价格' },
    { id: '/price/car', label: '卡派价格' },
    { id: '/price/trailer', label: '拖车价格' },
    { id: '/price/customs-clearance', label: '报关价格' },
    { id: '/price/supplier', label: '供应商价格' },
    { id: '/price/outsourc', label: '外协价格' }
  ]},
  { id: 'sales', label: '销售管理', children: [
    { id: '/sales/plan-distribut', label: '销售计划' },
    { id: '/sales/sales-billboard', label: '销售看板' },
    { id: '/sales/service-group', label: '服务组' },
    { id: '/sales/agent-booking-plan', label: '代理计划' },
    { id: '/sales/commission-config', label: '佣金配置' },
    { id: '/sales/orders-statistics', label: '订单统计' },
    { id: '/sales/manager-order', label: '经理人' }
  ]},
  { id: 'service', label: '服务配置', children: [
    { id: '/service/express', label: '快递' },
    { id: '/service/booking', label: '订舱' },
    { id: '/service/truck', label: '卡派' },
    { id: '/service/trailer', label: '拖车' },
    { id: '/service/customs-clearance', label: '报关' },
    { id: '/service/warehousing', label: '仓储' },
    { id: '/service/privateline', label: '专线' }
  ]},
  { id: 'business', label: '业务配置', children: [
    { id: '/business/express-port', label: '快递接口' }
  ]},
  { id: 'operating-cost', label: '运营成本', children: [
    { id: '/operating-cost/projects', label: '成本项目' },
    { id: '/operating-cost/project-groups', label: '成本项目组' }
  ]}
]

// 权限矩阵：模块(一级) → 页面(二级, path=menuPerms) → 按钮(三级, id=perms)
// 页面勾选 → 写入 menuPerms（驱动登录菜单过滤）；按钮勾选 → 写入 perms（操作权限）
const DEFAULT_ACTIONS = [
  { key: 'view', label: '查看' },
  { key: 'add', label: '新增' },
  { key: 'edit', label: '编辑' },
  { key: 'del', label: '删除' },
  { key: 'export', label: '导出' }
]
export const PERM_MATRIX = MENU_TREE.map(m => ({
  id: m.id,
  label: m.label,
  children: m.children.map(p => ({
    id: p.id,
    label: p.label,
    buttons: DEFAULT_ACTIONS.map(a => ({ id: `${p.id}:${a.key}`, label: a.label }))
  }))
}))
// 全部页面 path（全选用）
export const ALL_MENU_PATHS = PERM_MATRIX.flatMap(m => m.children.map(p => p.id))
// 全部按钮 id（全选用）
export const ALL_PERM_IDS = PERM_MATRIX.flatMap(m => m.children.flatMap(p => p.buttons.map(b => b.id)))

// 旧版按钮权限树（兼容保留，不再用于角色配置界面）
export const PERMISSION_TREE = [
  { id: 'organizers', label: '机构管理', children: [
    { id: 'org_role', label: '权限设置', children: [{ id: 'org_role_add', label: '新增' }, { id: 'org_role_edit', label: '编辑' }, { id: 'org_role_del', label: '删除' }] },
    { id: 'org_personnel', label: '人员管理', children: [{ id: 'org_person_add', label: '新增' }, { id: 'org_person_edit', label: '编辑' }, { id: 'org_person_reset', label: '重置密码' }] },
    { id: 'org_dept', label: '部门管理', children: [{ id: 'org_dept_add', label: '新增' }, { id: 'org_dept_edit', label: '编辑' }] }
  ] },
  { id: 'orderlist', label: '订单管理', children: [
    { id: 'order_whole', label: '全程订单', children: [{ id: 'order_whole_view', label: '查看' }, { id: 'order_whole_export', label: '导出' }] },
    { id: 'order_sign', label: '订单签收', children: [{ id: 'order_sign_do', label: '签收' }] }
  ] },
  { id: 'financial', label: '财务管理', children: [
    { id: 'fin_recv', label: '应收发票', children: [{ id: 'fin_recv_view', label: '查看' }] },
    { id: 'fin_pay', label: '应付发票', children: [{ id: 'fin_pay_view', label: '查看' }] }
  ] }
]

// 为角色按用户名查询（登录鉴权用）
export function getPersonnelByUsername(username) {
  return personnelResource.raw().find(p => p.username === username) || null
}

// 各角色默认菜单权限（种子 + 旧数据迁移共用）；'*' 表示全部
const ROLE_MENU_PERMS = {
  '超级管理员': ['*'],
  '运营主管': [
    '/orderlist/whole-order', '/orderlist/warehouse-order', '/orderlist/order-sign', '/orderlist/customs-order',
    '/operation/area-management', '/operation/port-management', '/operation/international-flight', '/operation/order-type',
    '/warehouse/unloading-apply', '/warehouse/output-apply', '/warehouse/inventory-apply'
  ],
  '客服专员': ['/orderlist/whole-order', '/orderlist/order-sign', '/orderlist/salesman-order', '/organizers/customer'],
  '财务专员': [
    '/financial/invoice-receivable', '/financial/invoice-payable', '/financial/invoice-out',
    '/financial/collection-order', '/financial/payment-order', '/financial/check-order', '/financial/company-credit'
  ],
  '代理商管理员': ['/orderlist/whole-order', '/orderlist/booking-order', '/price/booking']
}

const roleResource = createResource('org_role', () =>
  [
    // menuPerms: 该角色可见的页面完整 path 数组；['*'] 表示全部菜单
    { id: 1, name: '超级管理员', custType: '聚货通', perms: ['org_role_add', 'org_role_edit', 'org_role_del', 'org_person_add'], menuPerms: ROLE_MENU_PERMS['超级管理员'], remark: '系统内置', createTime: '2024-01-01 09:00:00' },
    { id: 2, name: '运营主管', custType: '聚货通', perms: ['order_whole_view', 'order_whole_export'], menuPerms: ROLE_MENU_PERMS['运营主管'], remark: '', createTime: '2024-02-10 09:00:00' },
    { id: 3, name: '客服专员', custType: '客户', perms: ['order_whole_view'], menuPerms: ROLE_MENU_PERMS['客服专员'], remark: '', createTime: '2024-03-05 09:00:00' },
    { id: 4, name: '财务专员', custType: '聚货通', perms: ['fin_recv_view', 'fin_pay_view'], menuPerms: ROLE_MENU_PERMS['财务专员'], remark: '', createTime: '2024-03-20 09:00:00' },
    { id: 5, name: '代理商管理员', custType: '代理商', perms: [], menuPerms: ROLE_MENU_PERMS['代理商管理员'], remark: '', createTime: '2024-04-01 09:00:00' }
  ]
)

// 迁移：旧缓存里的角色记录若无 menuPerms 字段，按角色名补齐默认权限（无匹配则空数组=默认拒绝）
roleResource.raw().forEach(r => {
  if (!('menuPerms' in r)) {
    roleResource.update(r.id, { menuPerms: ROLE_MENU_PERMS[r.name] || [] })
  }
})

/* ============ 部门管理（树） ============ */
const deptResource = createResource('org_dept', () =>
  [
    { id: 1, parentId: 0, name: '聚货通总部', alias: 'JHT-HQ', manager: '张伟', remark: '', createTime: '2024-01-01 09:00:00' },
    { id: 2, parentId: 1, name: '运营中心', alias: 'Operation', manager: '李强', remark: '', createTime: '2024-01-02 09:00:00' },
    { id: 3, parentId: 1, name: '财务部', alias: 'Finance', manager: '王芳', remark: '', createTime: '2024-01-02 09:00:00' },
    { id: 4, parentId: 2, name: '客服组', alias: 'Service', manager: '赵敏', remark: '', createTime: '2024-01-03 09:00:00' },
    { id: 5, parentId: 2, name: '调度组', alias: 'Dispatch', manager: '孙磊', remark: '', createTime: '2024-01-03 09:00:00' },
    { id: 6, parentId: 3, name: '出纳组', alias: 'Cashier', manager: '周洁', remark: '', createTime: '2024-01-04 09:00:00' }
  ]
)

/* ============ 人员管理 ============ */
const DEPT_NAMES = ['运营中心', '财务部', '客服组', '调度组', '出纳组']
const ROLE_NAMES = ['运营主管', '客服专员', '财务专员', '代理商管理员']
// 人员所属公司池：聚货通总部 + 各类型下属公司，令超管可见全部公司人员
const CUST_POOL = [
  { custType: '聚货通', custName: '聚货通总部' },
  { custType: '客户', custName: '美国01贸易有限公司' },
  { custType: '客户', custName: '德国02贸易有限公司' },
  { custType: '代理商', custName: '美国01物流代理' },
  { custType: '代理商', custName: '日本03物流代理' },
  { custType: '供应商', custName: '美国01供应链服务商' },
  { custType: '供应商', custName: '英国04供应链服务商' }
]
const personnelResource = createResource('org_personnel', () =>
  Array.from({ length: 30 }, (_, i) => {
    /* seed v2: 人员跨公司分布 */
    // 前 8 人固定为聚货通总部（含 admin），其余轮转分布到各类型公司
    const cust = i < 8 ? CUST_POOL[0] : CUST_POOL[((i - 8) % (CUST_POOL.length - 1)) + 1]
    return {
      id: i + 1,
      realName: i === 0 ? '系统管理员' : `员工${pad(i + 1)}`,
      username: i === 0 ? 'admin' : `user${pad(i + 1)}`,
      phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
      custType: cust.custType,
      custName: cust.custName,
      deptName: pick(DEPT_NAMES, i),
      postName: i === 0 ? '总经理' : pick(POST_OPTIONS, i + 1),
      roleName: i === 0 ? '超级管理员' : pick(ROLE_NAMES, i),
      status: i % 7 === 0 && i !== 0 ? '禁用' : '启用',
      createTime: seedTime(i)
    }
  }),
  2 // seed 版本：升级后旧 localStorage 缓存自动作废重建
)

/* ============ 客户管理 ============ */
const customerResource = createResource('org_customer', () =>
  Array.from({ length: 26 }, (_, i) => {
    const r = regionAt(i)
    return {
      id: i + 1,
      name: `${pick(COUNTRIES, i)}${pad(i + 1)}贸易有限公司`,
      alias: `Trade${pad(i + 1)} Co.,Ltd`,
      code: `CUS${pad(i + 1)}${String(1000 + i)}`,
      subtype: pick(CUSTOMER_SUBTYPES, i),
      entity: pick(ENTITY_TYPES, i),
      country: r.country, state: r.state, city: r.city, county: r.county,
      contact: `联系人${pad(i + 1)}`,
      phone: `139${String(20000000 + i * 211).slice(0, 8)}`,
      parentName: i % 3 === 0 ? '聚货通总部' : `${pick(COUNTRIES, i + 1)}一级代理`,
      contract: pick(CONTRACT_STATUS, i),
      coopPeriod: pick(COOP_PERIODS, i),
      addSource: pick(ADD_SOURCES, i),
      custSource: pick(CUSTOMER_SOURCES, i),
      legal: `法人${pad(i + 1)}`,
      licenseCode: `9144${String(1000000000 + i * 6301).slice(0, 10)}`,
      certType: pick(CERT_TYPES, i),
      setupDate: `20${pad(15 + (i % 8))}-${pad((i % 12) + 1)}-15`,
      companySize: pick(COMPANY_SIZES, i),
      registeredCapital: `${(i + 1) * 50}万`,
      saleType: pick(SALE_TYPES, i),
      platformType: pick(PLATFORM_TYPES, i),
      platform: pick(PLATFORMS, i),
      shopUrl: `https://shop${pad(i + 1)}.example.com`,
      brand: `Brand${pad(i + 1)}`,
      famousMark: pick(YES_NO, i + 1),
      financeStaff: i % 3 === 0 ? [((i % 20) + 2)] : [],
      serviceStaff: [((i % 18) + 3)],
      audit: pick(AUDIT_STATUS, i),
      status: i % 6 === 0 ? '禁用' : '启用',
      createTime: seedTime(i)
    }
  }),
  2
)

/* ============ 代理商管理 ============ */
const agentResource = createResource('org_agent', () =>
  Array.from({ length: 18 }, (_, i) => {
    const r = regionAt(i)
    return {
      id: i + 1,
      name: `${pick(COUNTRIES, i)}${pad(i + 1)}物流代理`,
      abbr: `AG${pad(i + 1)}`,
      alias: `Agent${pad(i + 1)}`,
      code: `AGT${pad(i + 1)}${String(2000 + i)}`,
      country: r.country, state: r.state, city: r.city, county: r.county,
      legal: `法人${pad(i + 1)}`,
      licenseCode: `9144${String(1000000000 + i * 7919).slice(0, 10)}`,
      certType: pick(CERT_TYPES, i),
      setupDate: `20${pad(15 + (i % 8))}-${pad((i % 12) + 1)}-15`,
      parentName: '聚货通总部',
      coopPeriod: pick(COOP_PERIODS, i),
      coopAmount: `${(i + 1) * 10}万`,
      companySize: pick(COMPANY_SIZES, i),
      registeredCapital: `${(i + 1) * 80}万`,
      saleType: pick(SALE_TYPES, i),
      platformType: pick(PLATFORM_TYPES, i),
      platform: pick(PLATFORMS, i),
      ifRequestPay: pick(YES_NO, i),
      ifPickup: pick(YES_NO, i + 1),
      ifManualReview: pick(YES_NO, i),
      isBranch: pick(YES_NO, i + 1),
      ifSelfFinance: pick(YES_NO, i),
      financeStaff: [((i % 20) + 2)],
      serviceStaff: [((i % 18) + 3), ((i % 15) + 5)],
      services: SERVICE_CATEGORIES.slice(0, (i % 4) + 1),
      serviceCountries: COUNTRIES.slice(0, (i % 3) + 1),
      status: i % 5 === 0 ? '禁用' : '启用',
      createTime: seedTime(i)
    }
  }),
  2
)

/* ============ 供应商管理 ============ */
const supplierResource = createResource('org_supplier', () =>
  Array.from({ length: 16 }, (_, i) => {
    const r = regionAt(i)
    return {
      id: i + 1,
      name: `${pick(COUNTRIES, i)}${pad(i + 1)}供应链服务商`,
      abbr: `SP${pad(i + 1)}`,
      alias: `Supplier${pad(i + 1)}`,
      code: `SUP${pad(i + 1)}${String(3000 + i)}`,
      branch: pick(SUPPLIER_BRANCH, i),
      subtype: pick(SERVICE_CATEGORIES, i),
      country: r.country, state: r.state, city: r.city, county: r.county,
      legal: `法人${pad(i + 1)}`,
      licenseCode: `9133${String(2000000000 + i * 5333).slice(0, 10)}`,
      certType: pick(CERT_TYPES, i),
      setupDate: `20${pad(14 + (i % 9))}-${pad((i % 12) + 1)}-20`,
      parentName: '聚货通总部',
      coopPeriod: pick(COOP_PERIODS, i),
      ifRequestPay: pick(YES_NO, i),
      domainPrefix: `sp${pad(i + 1)}`,
      financeStaff: i % 2 === 0 ? [((i % 20) + 2)] : [],
      serviceStaff: [((i % 18) + 3)],
      services: SERVICE_CATEGORIES.slice(0, (i % 3) + 1),
      serviceCountries: COUNTRIES.slice(0, (i % 2) + 1),
      status: i % 5 === 0 ? '禁用' : '启用',
      createTime: seedTime(i)
    }
  }),
  2
)

/* ============ 通用查询构造 ============ */
const kw = (v, q) => !q || String(v ?? '').includes(q)

/* ---- 角色 ---- */
export function getRoleList() { return roleResource.list() }
export function addRole(data) { return roleResource.add(data) }
export function updateRole(id, data) { return roleResource.update(id, data) }
export function deleteRole(id) { return roleResource.remove(id) }

/* ---- 部门（树） ---- */
export function getDeptTree() { return deptResource.list() }
export function addDept(data) { return deptResource.add(data) }
export function updateDept(id, data) { return deptResource.update(id, data) }
export function deleteDept(id) {
  // 连同子部门一并删除
  const all = deptResource.raw()
  const ids = []
  const collect = pid => all.filter(d => d.parentId === pid).forEach(c => { ids.push(c.id); collect(c.id) })
  ids.push(Number(id)); collect(Number(id))
  return deptResource.bulkRemove(ids)
}

/* ---- 人员 ---- */
export function getPersonnelList(p = {}) {
  const { keyword, custType, custName, dept, status, page = 1, size = 10 } = p
  return personnelResource.query(
    r => (kw(r.realName, keyword) || kw(r.phone, keyword) || kw(r.username, keyword)) &&
         (!custType || r.custType === custType) &&
         (!custName || kw(r.custName, custName)) &&
         (!dept || r.deptName === dept) && (!status || r.status === status),
    { page, size }
  )
}

// 所属公司下拉选项（去重，供人员筛选用）
export function getCustNameOptions() {
  const names = [...new Set(personnelResource.raw().map(r => r.custName))]
  return mockRequest(names)
}
// 全部人员（供“关联人员”穿梭框选择，按财务/客服简单分组）
export function getStaffOptions() {
  return mockRequest(personnelResource.raw().map(p => ({
    id: p.id,
    realName: p.realName,
    deptName: p.deptName,
    // 财务部归为财务人员(finance)，其余归为运营客服(service)
    group: p.deptName === '财务部' || p.deptName === '出纳组' ? 'finance' : 'service'
  })))
}
export function addPersonnel(data) { return personnelResource.add(data) }
export function updatePersonnel(id, data) { return personnelResource.update(id, data) }
export function deletePersonnel(id) { return personnelResource.remove(id) }
export function togglePersonnelStatus(id, status) { return personnelResource.setStatus(id, status) }
export function resetPassword(id) { return mockRequest({ id, password: 'Jht@' + Math.floor(100000 + (Number(id) * 7919) % 900000) }) }

/* ---- 客户 ---- */
export function getCustomerList(p = {}) {
  const { name, subtype, country, audit, status, page = 1, size = 10 } = p
  return customerResource.query(
    r => kw(r.name, name) && (!subtype || r.subtype === subtype) && (!country || r.country === country) &&
         (!audit || r.audit === audit) && (!status || r.status === status),
    { page, size }
  )
}
export function addCustomer(data) { return customerResource.add(data) }
// 批量导入客户（导入弹窗解析后的行）
export function bulkImportCustomer(rows = []) {
  const normalized = rows.map(r => ({
    subtype: '直客', entity: '企业', contract: '未签署', audit: '待审核',
    status: '启用', parentName: '聚货通总部', ...r
  }))
  return customerResource.bulkAdd(normalized)
}
export function updateCustomer(id, data) { return customerResource.update(id, data) }
export function deleteCustomer(id) { return customerResource.remove(id) }
export function toggleCustomerStatus(id, status) { return customerResource.setStatus(id, status) }

/* ---- 代理商 ---- */
export function getAgentList(p = {}) {
  const { name, country, status, page = 1, size = 10 } = p
  return agentResource.query(
    r => kw(r.name, name) && (!country || r.country === country) && (!status || r.status === status),
    { page, size }
  )
}
export function addAgent(data) { return agentResource.add(data) }
export function updateAgent(id, data) { return agentResource.update(id, data) }
export function deleteAgent(id) { return agentResource.remove(id) }
export function toggleAgentStatus(id, status) { return agentResource.setStatus(id, status) }

/* ---- 供应商 ---- */
export function getSupplierList(p = {}) {
  const { name, country, status, page = 1, size = 10 } = p
  return supplierResource.query(
    r => kw(r.name, name) && (!country || r.country === country) && (!status || r.status === status),
    { page, size }
  )
}
export function addSupplier(data) { return supplierResource.add(data) }
export function updateSupplier(id, data) { return supplierResource.update(id, data) }
export function deleteSupplier(id) { return supplierResource.remove(id) }
export function toggleSupplierStatus(id, status) { return supplierResource.setStatus(id, status) }
