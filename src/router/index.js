import { createRouter, createWebHashHistory } from 'vue-router'
import {
  DataLine, OfficeBuilding, Operation, Setting, Money, Box,
  Document, PriceTag, TrendCharts, Connection, Wallet
} from '@element-plus/icons-vue'
import Layout from '@/components/Layout/index.vue'

// 唯一路由文件：所有页面在此注册，侧边栏与面包屑均自动读取 meta。
// 说明：业务页面全部“扁平”注册为 Layout 直接子路由，直接在 AppMain 的动态组件中渲染，
// 配合 keep-alive 缓存实例、避免反复加载；模块层级通过 meta.group 表达，无需二级路由包裹组件。

/* ============ 菜单模块配置（单一数据源：既生成路由，又生成菜单） ============ */
// 已迁移模块：机构管理 organizers（真实页面）
// keepAlive: true 的页面会被 keep-alive 缓存（保留筛选/滚动等组件状态）；
// 其组件 name 必须与路由 name 一致，供 AppMain 的 include 白名单匹配。
const organizersModule = {
  path: 'organizers', title: '机构管理', icon: OfficeBuilding,
  children: [
    { path: 'role', title: '权限设置', name: 'OrgRole', keepAlive: true, component: () => import('@/views/organizers/Role.vue') },
    { path: 'personnel', title: '人员管理', name: 'OrgPersonnel', keepAlive: true, component: () => import('@/views/organizers/Personnel.vue') },
    { path: 'department', title: '部门管理', name: 'OrgDepartment', keepAlive: true, component: () => import('@/views/organizers/Department.vue') },
    { path: 'customer', title: '客户管理', name: 'OrgCustomer', keepAlive: true, component: () => import('@/views/organizers/Customer.vue') },
    { path: 'agent', title: '代理商管理', name: 'OrgAgent', keepAlive: true, component: () => import('@/views/organizers/Agent.vue') },
    { path: 'supplier', title: '供应商管理', name: 'OrgSupplier', keepAlive: true, component: () => import('@/views/organizers/Supplier.vue') }
  ]
}

// 已迁移模块：订单管理 orderlist（9 个订单视图 + 代客下单录单页）
const orderlistModule = {
  path: 'orderlist', title: '订单管理', icon: Document,
  children: [
    { path: 'whole-order', title: '全程订单', name: 'OlWhole', keepAlive: true, component: () => import('@/views/orderlist/WholeOrder.vue') },
    { path: 'warehouse-order', title: '仓库订单', name: 'OlWarehouse', keepAlive: true, component: () => import('@/views/orderlist/WarehouseOrder.vue') },
    { path: 'order-sign', title: '订单签收', name: 'OlSign', keepAlive: true, component: () => import('@/views/orderlist/OrderSign.vue') },
    { path: 'salesman-order', title: '代客下单', name: 'OlSalesman', keepAlive: true, component: () => import('@/views/orderlist/SalesmanOrder.vue') },
    { path: 'salesman-add', title: '录单', name: 'OlSalesmanAdd', hidden: true, activeMenu: '/orderlist/salesman-order', component: () => import('@/views/orderlist/SalesmanAdd.vue') },
    { path: 'customs-order', title: '报关订单', name: 'OlCustoms', keepAlive: true, component: () => import('@/views/orderlist/CustomsOrder.vue') },
    { path: 'car-order', title: '卡派订单', name: 'OlCar', keepAlive: true, component: () => import('@/views/orderlist/CarOrder.vue') },
    { path: 'express-order', title: '快递订单', name: 'OlExpress', keepAlive: true, component: () => import('@/views/orderlist/ExpressOrder.vue') },
    { path: 'booking-order', title: '订舱订单', name: 'OlBooking', keepAlive: true, component: () => import('@/views/orderlist/BookingOrder.vue') },
    { path: 'trailer-order', title: '拖车订单', name: 'OlTrailer', keepAlive: true, component: () => import('@/views/orderlist/TrailerOrder.vue') }
  ]
}

// 已迁移模块：运营管理 operation（24 个基础配置页面）
const operationModule = {
  path: 'operation', title: '运营管理', icon: Operation,
  children: [
    { path: 'area-management', title: '国家省州', name: 'OpArea', keepAlive: true, component: () => import('@/views/operation/AreaManagement.vue') },
    { path: 'port-management', title: '机场港口', name: 'OpPort', keepAlive: true, component: () => import('@/views/operation/PortManagement.vue') },
    { path: 'international-flight', title: '国际航线', name: 'OpFlight', keepAlive: true, component: () => import('@/views/operation/InternationalFlight.vue') },
    { path: 'domestic-area', title: '区域配置', name: 'OpDomesticArea', keepAlive: true, component: () => import('@/views/operation/DomesticArea.vue') },
    { path: 'service-agency', title: '服务机构', name: 'OpAgency', keepAlive: true, component: () => import('@/views/operation/ServiceAgency.vue') },
    { path: 'vehicle-management', title: '车型选择', name: 'OpVehicle', keepAlive: true, component: () => import('@/views/operation/VehicleManagement.vue') },
    { path: 'container-management', title: '货柜管理', name: 'OpContainer', keepAlive: true, component: () => import('@/views/operation/ContainerManagement.vue') },
    { path: 'fbacontainer-management', title: 'FBA仓库管理', name: 'OpFba', keepAlive: true, component: () => import('@/views/operation/FbaContainerManagement.vue') },
    { path: 'rate', title: '汇率记录', name: 'OpRate', keepAlive: true, component: () => import('@/views/operation/Rate.vue') },
    { path: 'currency-management', title: '货币管理', name: 'OpCurrency', keepAlive: true, component: () => import('@/views/operation/CurrencyManagement.vue') },
    { path: 'taboo-management', title: '禁忌词语', name: 'OpTaboo', keepAlive: true, component: () => import('@/views/operation/TabooManagement.vue') },
    { path: 'service-genara', title: '服务大类', name: 'OpGenera', keepAlive: true, component: () => import('@/views/operation/ServiceGenara.vue') },
    { path: 'job-setup', title: '岗位设置', name: 'OpJob', keepAlive: true, component: () => import('@/views/operation/JobSetup.vue') },
    { path: 'report-definition', title: '报表定义', name: 'OpReport', keepAlive: true, component: () => import('@/views/operation/ReportDefinition.vue') },
    { path: 'customs-factor', title: '报关要素', name: 'OpFactor', keepAlive: true, component: () => import('@/views/operation/CustomsFactor.vue') },
    { path: 'order-type', title: '下单配置', name: 'OpOrderType', keepAlive: true, component: () => import('@/views/operation/OrderType.vue') },
    { path: 'task-document', title: '任务单证', name: 'OpDoc', keepAlive: true, component: () => import('@/views/operation/TaskDocument.vue') },
    { path: 'file-config', title: '文件配置', name: 'OpFile', keepAlive: true, component: () => import('@/views/operation/FileConfig.vue') },
    { path: 'examine-config', title: '验货配置', name: 'OpExamine', keepAlive: true, component: () => import('@/views/operation/ExamineConfig.vue') },
    { path: 'aviation-plate', title: '航空板', name: 'OpPlate', keepAlive: true, component: () => import('@/views/operation/AviationPlate.vue') },
    { path: 'single-shipment', title: '分单发货', name: 'OpSingle', keepAlive: true, component: () => import('@/views/operation/SingleShipment.vue') },
    { path: 'container-shipment', title: '整柜发货', name: 'OpCship', keepAlive: true, component: () => import('@/views/operation/ContainerShipment.vue') },
    { path: 'order-delivery', title: '订单派送', name: 'OpDelivery', keepAlive: true, component: () => import('@/views/operation/OrderDelivery.vue') },
    { path: 'outsourc-shipment', title: '外协发货', name: 'OpOutsourc', keepAlive: true, component: () => import('@/views/operation/OutsourcShipment.vue') }
  ]
}

// 已迁移模块：系统管理 system
const systemModule = {
  path: 'system', title: '系统管理', icon: Setting,
  children: [
    { path: 'calc-weight', title: '收费重量计算', name: 'SysWeight', keepAlive: true, component: () => import('@/views/system/CalcWeight.vue') },
    { path: 'air-them-roughly', title: '航空号段', name: 'SysAir', keepAlive: true, component: () => import('@/views/system/AirThemRoughly.vue') },
    { path: 'chauffeur-management', title: '司机管理', name: 'SysDriver', keepAlive: true, component: () => import('@/views/system/ChauffeurManagement.vue') },
    { path: 'car-management', title: '车辆', name: 'SysCar', keepAlive: true, component: () => import('@/views/system/CarManagement.vue') },
    { path: 'commodity-audit', title: '商品审核', name: 'SysCommodity', keepAlive: true, component: () => import('@/views/system/CommodityAudit.vue') },
    { path: 'product-library', title: '产品库', name: 'SysProduct', keepAlive: true, component: () => import('@/views/system/ProductLibrary.vue') },
    { path: 'job-commission', title: '岗位提成', name: 'SysCommission', keepAlive: true, component: () => import('@/views/system/JobCommission.vue') },
    { path: 'pc-config', title: '着陆页配置', name: 'SysPc', keepAlive: true, component: () => import('@/views/system/PcConfig.vue') },
    { path: 'pda-config', title: 'PDA配置', name: 'SysPda', keepAlive: true, component: () => import('@/views/system/PdaConfig.vue') },
    { path: 'delivery-plan', title: '发货计划', name: 'SysDelivery', keepAlive: true, component: () => import('@/views/system/DeliveryPlan.vue') },
    { path: 'subscribe-plan', title: '计划订阅', name: 'SysSubscribe', keepAlive: true, component: () => import('@/views/system/SubscribePlan.vue') },
    { path: 'notice-config', title: '通知配置', name: 'SysNoticeCfg', keepAlive: true, component: () => import('@/views/system/NoticeConfig.vue') },
    { path: 'notice-center', title: '通知中心', name: 'SysNoticeCtr', keepAlive: true, component: () => import('@/views/system/NoticeCenter.vue') },
    { path: 'notice-manage', title: '通知管理', name: 'SysNoticeMng', keepAlive: true, component: () => import('@/views/system/NoticeManage.vue') },
    { path: 'customer-level', title: '客户评级', name: 'SysLevel', keepAlive: true, component: () => import('@/views/system/CustomerLevel.vue') },
    { path: 'jht-set', title: '设置', name: 'SysSet', keepAlive: true, component: () => import('@/views/system/JhtSet.vue') },
    { path: 'feedback', title: '反馈', name: 'SysFeedback', keepAlive: true, component: () => import('@/views/system/Feedback.vue') },
    { path: 'status-config', title: '状态设置', name: 'SysStatus', keepAlive: true, component: () => import('@/views/system/StatusConfig.vue') }
  ]
}

// 已迁移模块：仓库管理 warehouse
const warehouseModule = {
  path: 'warehouse', title: '仓库管理', icon: Box,
  children: [
    { path: 'unloading-apply', title: '卸货', name: 'WhUnload', keepAlive: true, component: () => import('@/views/warehouse/UnloadingApply.vue') },
    { path: 'measure-apply', title: '计量', name: 'WhMeasure', keepAlive: true, component: () => import('@/views/warehouse/MeasureApply.vue') },
    { path: 'trailer-task', title: '拖托', name: 'WhTrailerTask', keepAlive: true, component: () => import('@/views/warehouse/TrailerTask.vue') },
    { path: 'cabinet-removal', title: '拆柜任务', name: 'WhRemoval', keepAlive: true, component: () => import('@/views/warehouse/CabinetRemoval.vue') },
    { path: 'moving-apply', title: '调拨', name: 'WhMoving', keepAlive: true, component: () => import('@/views/warehouse/MovingApply.vue') },
    { path: 'output-apply', title: '出库', name: 'WhOutput', keepAlive: true, component: () => import('@/views/warehouse/OutputApply.vue') },
    { path: 'inventory-apply', title: '盘点', name: 'WhInventory', keepAlive: true, component: () => import('@/views/warehouse/InventoryApply.vue') },
    { path: 'examine-apply', title: '验货', name: 'WhExamine', keepAlive: true, component: () => import('@/views/warehouse/ExamineApply.vue') },
    { path: 'anomaly-list', title: '异常', name: 'WhAnomaly', keepAlive: true, component: () => import('@/views/warehouse/AnomalyList.vue') },
    { path: 'transfer-task', title: '换单', name: 'WhTransfer', keepAlive: true, component: () => import('@/views/warehouse/TransferTask.vue') },
    { path: 'warehouse-config', title: '仓库配置', name: 'WhConfig', keepAlive: true, component: () => import('@/views/warehouse/WarehouseConfig.vue') }
  ]
}

// 已迁移模块：财务管理 financial
const financialModule = {
  path: 'financial', title: '财务管理', icon: Money,
  children: [
    { path: 'invoice-receivable', title: '应收发票', name: 'FinRecv', keepAlive: true, component: () => import('@/views/financial/InvoiceReceivable.vue') },
    { path: 'invoice-payable', title: '应付发票', name: 'FinPayable', keepAlive: true, component: () => import('@/views/financial/InvoicePayable.vue') },
    { path: 'invoice-out', title: '开票', name: 'FinOut', keepAlive: true, component: () => import('@/views/financial/InvoiceOut.vue') },
    { path: 'collection-order', title: '收款单', name: 'FinCollect', keepAlive: true, component: () => import('@/views/financial/CollectionOrder.vue') },
    { path: 'cash-order', title: '申请单', name: 'FinCash', keepAlive: true, component: () => import('@/views/financial/CashOrder.vue') },
    { path: 'payment-order', title: '付款单', name: 'FinPayment', keepAlive: true, component: () => import('@/views/financial/PaymentOrder.vue') },
    { path: 'check-order', title: '对账单', name: 'FinCheck', keepAlive: true, component: () => import('@/views/financial/CheckOrder.vue') },
    { path: 'fiscal-period', title: '会计期间', name: 'FinPeriod', keepAlive: true, component: () => import('@/views/financial/FiscalPeriod.vue') },
    { path: 'company-credit', title: '公司信用', name: 'FinCredit', keepAlive: true, component: () => import('@/views/financial/CompanyCredit.vue') },
    { path: 'risk-control', title: '风险控制', name: 'FinRisk', keepAlive: true, component: () => import('@/views/financial/RiskControl.vue') },
    { path: 'financial-order', title: '专线订单', name: 'FinOrder', keepAlive: true, component: () => import('@/views/financial/FinancialOrder.vue') }
  ]
}

// 已迁移模块：价格管理 price
const priceModule = {
  path: 'price', title: '价格管理', icon: PriceTag,
  children: [
    { path: 'goods-surcharge', title: '货物附加费', name: 'PriceSurcharge', keepAlive: true, component: () => import('@/views/price/GoodsSurcharge.vue') },
    { path: 'charge-config', title: '收费配置', name: 'PriceCharge', keepAlive: true, component: () => import('@/views/price/ChargeConfig.vue') },
    { path: 'private-line', title: '专线价格', name: 'PricePrivate', keepAlive: true, component: () => import('@/views/price/PrivateLine.vue') },
    { path: 'express', title: '快递价格', name: 'PriceExpress', keepAlive: true, component: () => import('@/views/price/Express.vue') },
    { path: 'booking', title: '订舱价格', name: 'PriceBooking', keepAlive: true, component: () => import('@/views/price/Booking.vue') },
    { path: 'warehouse', title: '仓储价格', name: 'PriceWarehouse', keepAlive: true, component: () => import('@/views/price/Warehouse.vue') },
    { path: 'car', title: '卡派价格', name: 'PriceCar', keepAlive: true, component: () => import('@/views/price/Car.vue') },
    { path: 'trailer', title: '拖车价格', name: 'PriceTrailer', keepAlive: true, component: () => import('@/views/price/Trailer.vue') },
    { path: 'customs-clearance', title: '报关价格', name: 'PriceCustoms', keepAlive: true, component: () => import('@/views/price/CustomsClearance.vue') },
    { path: 'supplier', title: '供应商价格', name: 'PriceSupplier', keepAlive: true, component: () => import('@/views/price/Supplier.vue') },
    { path: 'outsourc', title: '外协价格', name: 'PriceOutsourc', keepAlive: true, component: () => import('@/views/price/Outsourc.vue') }
  ]
}

// 已迁移模块：销售管理 sales
const salesModule = {
  path: 'sales', title: '销售管理', icon: TrendCharts,
  children: [
    { path: 'plan-distribut', title: '销售计划', name: 'SalesPlan', keepAlive: true, component: () => import('@/views/sales/PlanDistribut.vue') },
    { path: 'sales-billboard', title: '销售看板', name: 'SalesBillboard', keepAlive: true, component: () => import('@/views/sales/SalesBillboard.vue') },
    { path: 'service-group', title: '服务组', name: 'SalesGroup', keepAlive: true, component: () => import('@/views/sales/ServiceGroup.vue') },
    { path: 'agent-booking-plan', title: '代理计划', name: 'SalesAgentPlan', keepAlive: true, component: () => import('@/views/sales/AgentBookingPlan.vue') },
    { path: 'commission-config', title: '佣金配置', name: 'SalesCommission', keepAlive: true, component: () => import('@/views/sales/CommissionConfig.vue') },
    { path: 'orders-statistics', title: '订单统计', name: 'SalesStat', keepAlive: true, component: () => import('@/views/sales/OrdersStatistics.vue') },
    { path: 'manager-order', title: '经理人', name: 'SalesManager', keepAlive: true, component: () => import('@/views/sales/ManagerOrder.vue') }
  ]
}

// 已迁移模块：服务配置 service
const serviceModule = {
  path: 'service', title: '服务配置', icon: Connection,
  children: [
    { path: 'express', title: '快递', name: 'SvcExpress', keepAlive: true, component: () => import('@/views/service/Express.vue') },
    { path: 'booking', title: '订舱', name: 'SvcBooking', keepAlive: true, component: () => import('@/views/service/Booking.vue') },
    { path: 'truck', title: '卡派', name: 'SvcTruck', keepAlive: true, component: () => import('@/views/service/Truck.vue') },
    { path: 'trailer', title: '拖车', name: 'SvcTrailer', keepAlive: true, component: () => import('@/views/service/Trailer.vue') },
    { path: 'customs-clearance', title: '报关', name: 'SvcCustoms', keepAlive: true, component: () => import('@/views/service/CustomsClearance.vue') },
    { path: 'warehousing', title: '仓储', name: 'SvcWarehousing', keepAlive: true, component: () => import('@/views/service/Warehousing.vue') },
    { path: 'privateline', title: '专线', name: 'SvcPrivateline', keepAlive: true, component: () => import('@/views/service/Privateline.vue') }
  ]
}

// 已迁移模块：业务配置 business
const businessModule = {
  path: 'business', title: '业务配置', icon: Setting,
  children: [
    { path: 'express-port', title: '快递接口', name: 'BizExpressPort', keepAlive: true, component: () => import('@/views/business/ExpressPort.vue') }
  ]
}

// 已迁移模块：运营成本 operating-cost
const operatingCostModule = {
  path: 'operating-cost', title: '运营成本', icon: Wallet,
  children: [
    { path: 'projects', title: '成本项目', name: 'CostProjects', keepAlive: true, component: () => import('@/views/operating-cost/Projects.vue') },
    { path: 'project-groups', title: '成本项目组', name: 'CostGroups', keepAlive: true, component: () => import('@/views/operating-cost/ProjectGroups.vue') }
  ]
}

// 统一模块列表（顺序即菜单顺序）
const menuModules = [organizersModule, orderlistModule, operationModule, systemModule, warehouseModule, financialModule, priceModule, salesModule, serviceModule, businessModule, operatingCostModule]

// 将模块配置扁平化为 Layout 直接子路由；模块信息写入 meta.group，供菜单/面包屑还原层级
const businessRoutes = menuModules.flatMap(m =>
  m.children.map(c => ({
    path: `${m.path}/${c.path}`,
    name: c.name,
    component: c.component,
    meta: {
      title: c.title, group: m.path, groupTitle: m.title, groupIcon: m.icon,
      keepAlive: !!c.keepAlive, hidden: !!c.hidden, activeMenu: c.activeMenu
    }
  }))
)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '数据概览', icon: DataLine }
      },
      ...businessRoutes
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 统一路由守卫：登录鉴权 + 菜单权限校验
// 未登录→登录页；已登录访问登录页→首页；无权限页面→回首页并提示。
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.name === 'Login') {
    return token ? next({ name: 'Dashboard' }) : next()
  }
  if (!token) return next({ name: 'Login', query: { redirect: to.fullPath } })

  // 动态引入 store，规避与 store 的循环依赖
  const { useUserStore } = await import('@/store/user')
  const { usePermissionStore } = await import('@/store/permission')
  const userStore = useUserStore()
  await userStore.ensurePerms()
  const perm = usePermissionStore()

  // 隐藏的详情/子页按 activeMenu 归属其列表页判定权限
  const checkPath = to.meta?.activeMenu || to.path
  // dashboard、无 group 的页面（如首页）默认放行
  if (!to.meta?.group || perm.hasPerm(checkPath)) return next()

  ElMessage.warning('无该页面访问权限')
  next(from.name ? false : { name: 'Dashboard' })
})

export default router
