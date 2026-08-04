// 系统管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'
import { mockRequest } from '../mock'

export const STATUS_OPTIONS = ['启用', '禁用']
export const WEIGHT_TYPES = ['实重', '体积重', '取大']
export const AIRLINES = ['国航', '东航', '南航']
export const LICENSE_TYPES = ['A2', 'B2', 'C1']
export const CAR_TYPES = ['厢式', '平板', '冷藏']
export const AUDIT_STATUS = ['待审核', '通过', '拒绝']
export const COMMISSION_TYPES = ['固定', '比例']
export const PLAN_STATUS = ['待执行', '已完成']
export const CYCLES = ['每日', '每周', '每月']
export const CHANNELS = ['站内', '短信', '邮件']
export const NOTICE_EVENTS = ['下单', '签收', '异常']
export const NOTICE_TYPES = ['系统', '业务', '公告']
export const READ_STATUS = ['未读', '已读']
export const FEEDBACK_TYPES = ['建议', '投诉', '咨询']
export const HANDLE_STATUS = ['待处理', '已处理']
export const SCENES = ['订单', '运单', '财务']
const st = i => (i % 5 === 0 ? '禁用' : '启用')
const money = i => Number((((i * 37) % 2000) + 20).toFixed(2))

export const weightApi = defineMock('sys_weight', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `计重规则${pad(i + 1)}`, type: at(WEIGHT_TYPES, i), factor: 5000 + i * 100, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

// 航空号段：源为按航司聚合的号段库存统计(总数/剩余/已分配/已打单/已发运)，通过分配/回收/导入管理
export const airApi = defineMock('sys_air', () =>
  Array.from({ length: 8 }, (_, i) => {
    const total = (i + 3) * 1000
    const allocated = Math.floor(total * 0.6)
    const printedOrder = Math.floor(total * 0.3)
    const shipped = Math.floor(total * 0.2)
    return {
      id: i + 1,
      airlineCompany: `${at(['国航', '东航', '南航', '海航', '厦航', '深航', '川航', '吉祥'], i)}(${['CA', 'MU', 'CZ', 'HU', 'MF', 'ZH', '3U', 'HO'][i]})`,
      total, surplus: total - allocated, allocated, printedOrder, shipped,
      createTime: seedTime(i)
    }
  }), ['airlineCompany'], 2)

// 司机管理：对齐源(姓名/证件类型+号码/手机/邮箱/所在地区/驾照日期/驾照照片/状态)
export const CERT_TYPES = ['身份证', '护照', '港澳通行证', '其他']
const CITIES = [['广东', '深圳', '南山区'], ['浙江', '杭州', '西湖区'], ['江苏', '苏州', '工业园区'], ['上海', '上海', '浦东新区']]
export const driverApi = defineMock('sys_driver', () =>
  Array.from({ length: 14 }, (_, i) => {
    const c = CITIES[i % CITIES.length]
    return {
      id: i + 1, name: `司机${pad(i + 1)}`,
      certType: at(CERT_TYPES, i), certNo: `${pick3(i)}${String(101010199001010000 + i * 137).slice(0, 15)}`,
      phone: `138${String(10000000 + i * 137).slice(0, 8)}`, email: `driver${i + 1}@jht.com`,
      state: c[0], city: c[1], county: c[2],
      expire: `20${pad(26 + (i % 5))}-${pad((i % 12) + 1)}-15`,
      photo: '', overtime: i % 2 === 0 ? '是' : '否', distance: i % 3 === 0 ? '是' : '否',
      status: st(i), createTime: seedTime(i)
    }
  }), ['name', 'status'], 2)
function pick3(i) { return ['110', '310', '440'][i % 3] }

// 车辆管理：对齐源(车牌/关联车型/车况/保险到期/三者险保额/尾板/GPS/上牌时间/状态)
export const CAR_CONDITIONS = ['良好', '正常', '待保养', '维修中']
export const carApi = defineMock('sys_car', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1, plateNo: `粤B${String(10000 + i * 37).slice(0, 5)}`,
    vehicleType: at(CAR_TYPES, i), condition: at(CAR_CONDITIONS, i),
    insureExpire: `20${pad(26 + (i % 4))}-${pad((i % 12) + 1)}-20`,
    thirdInsure: `${(i % 5 + 1) * 50}万`,
    tailBoard: i % 2 === 0 ? '有' : '无', gps: i % 2 === 0 ? '有' : '无',
    regDate: `20${pad(18 + (i % 6))}-${pad((i % 12) + 1)}-10`,
    status: st(i), createTime: seedTime(i)
  })), ['plateNo~', 'vehicleType', 'status'], 2)

// 商品审核：源为审核台账(审核状态 state 0/1/2、起运国/目的国、海关编码、双语名/材质/用途、品牌规格、计量单位、类别、价格是否配置 ifPrice)
export const commodityApi = defineMock('sys_commodity', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    state: i % 3,
    startCountryName: '中国',
    countryName: at(['美国', '德国', '日本', '英国', '澳大利亚'], i),
    code: `${8500 + i}00`,
    cnName: at(CN_PROD, i), enName: at(EN_PROD, i),
    brand: `品牌${pad((i % 5) + 1)}`, size: `${(i % 5 + 1) * 10}cm`,
    cnMaterial: at(['塑料', '金属', '硅胶', '布料'], i), enMaterial: at(['Plastic', 'Metal', 'Silicone', 'Fabric'], i),
    cnPurpose: at(['家用', '办公', '运动', '户外'], i), enPurpose: at(['Home', 'Office', 'Sports', 'Outdoor'], i),
    unitName: at(MEASURE_UNIT_NAMES, i), title: at(PRODUCT_CATEGORIES, i),
    ifPrice: i % 2, // 0未配置/1已配置
    createTime: seedTime(i)
  })), [], 2)
// 商品审核按 目的国/审核状态/关键词(海关编码/中文名/英文名) 过滤
commodityApi.list = (p = {}) => commodityApi.res.query(o => {
  const countryOk = !p.countryName || o.countryName === p.countryName
  const stateOk = p.state == null || p.state === '' || o.state === p.state
  const priceOk = p.ifPrice == null || p.ifPrice === '' || o.ifPrice === p.ifPrice
  const kwOk = !p.keyword ||
    (p.selectType === '1' && String(o.code).includes(p.keyword)) ||
    (p.selectType === '2' && String(o.cnName).includes(p.keyword)) ||
    (p.selectType === '3' && String(o.enName).includes(p.keyword)) || (!p.selectType)
  return countryOk && stateOk && priceOk && kwOk
}, { page: p.page || 1, size: p.size || 10 })

// 产品库：对齐源(审核状态state 0/1/2、SKU、双语名/材质/用途、品牌规格、计量单位、商品类别、报关信息、状态 0启1禁)
export const PRODUCT_STATE = ['待审核', '审核通过', '审核拒绝']
export const PRODUCT_CATEGORIES = ['普货', '纯电', '带电', '带磁', '危险品']
export const MEASURE_UNIT_NAMES = ['个', '件', '套', '台', '箱']
const CN_PROD = ['蓝牙耳机', '保温杯', '瑜伽垫', '数据线', 'LED灯', '积木玩具', '手机壳', '登山包']
const EN_PROD = ['Bluetooth Earphone', 'Vacuum Cup', 'Yoga Mat', 'Data Cable', 'LED Light', 'Building Blocks', 'Phone Case', 'Hiking Bag']
export const productApi = defineMock('sys_product', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    state: i % 3, // 0待审核/1通过/2拒绝
    skuCode: `SKU${10000 + i}`,
    cnName: at(CN_PROD, i), enName: at(EN_PROD, i),
    brand: `品牌${pad((i % 5) + 1)}`, size: `${(i % 5 + 1) * 10}cm`,
    cnMaterial: at(['塑料', '金属', '硅胶', '布料'], i), enMaterial: at(['Plastic', 'Metal', 'Silicone', 'Fabric'], i),
    cnPurpose: at(['家用', '办公', '运动', '户外'], i), enPurpose: at(['Home', 'Office', 'Sports', 'Outdoor'], i),
    unitName: at(MEASURE_UNIT_NAMES, i), title: at(PRODUCT_CATEGORIES, i),
    status: i % 5 === 0 ? 1 : 0, // 0启用/1禁用（源反常）
    createTime: seedTime(i)
  })), [], 2)
// 产品库按 状态 state / 关键词(SKU/中文名/英文名) 过滤
productApi.list = (p = {}) => productApi.res.query(o => {
  const stateOk = p.state == null || p.state === '' || o.state === p.state
  const kwOk = !p.keyword ||
    (p.selectType === '1' && String(o.skuCode).includes(p.keyword)) ||
    (p.selectType === '2' && String(o.cnName).includes(p.keyword)) ||
    (p.selectType === '3' && String(o.enName).includes(p.keyword)) ||
    (!p.selectType)
  return stateOk && kwOk
}, { page: p.page || 1, size: p.size || 10 })

// 岗位提成：对齐源(岗位/计量方式 measure/计量单位 unit/区间阶梯 sections[{lower,upper,amount}]/版本 version)
export const MEASURE_TYPES = ['按重量', '按体积', '按票数', '按票重']
export const MEASURE_UNITS = ['KG', 'CBM', '票', '件']
export const commissionApi = defineMock('sys_commission', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, name: `岗位提成${pad(i + 1)}`,
    measure: at(MEASURE_TYPES, i), unit: at(MEASURE_UNITS, i),
    sections: [{ lower: 0, upper: (i % 5 + 1) * 100, amount: (i % 10 + 1) * 2 }],
    version: `v${(i % 3) + 1}.0`,
    createTime: seedTime(i)
  })), ['name'], 2)

// 着陆页配置：源为「官网首页」单表单——导航logo/banner图组/底部logo/底部二维码 + 联系电话 + 工作时间，整份保存
// 存单条配置记录(id=1)，页面读取 res.raw()[0]，保存走 update
export const pcApi = defineMock('sys_pc', () => ([{
  id: 1,
  navLogo: '',
  banners: ['', '', '', '', ''],
  bottomLogo: '',
  qr1Title: '微信公众号', qr1Img: '',
  qr2Title: '客服微信', qr2Img: '',
  phone: '400-888-8888',
  workTime: '周一至周五 9:00-18:00',
  createTime: seedTime(0)
}]), [], 2)

// PDA配置：源实为「PDA App 版本管理」——版本号/更新日志(富文本)/apk上传/强制更新/上下线开关(唯一线上)
export const PDA_FORCE = ['是', '否']
export const PDA_STATUS = ['上线', '下线']
export const pdaApi = defineMock('sys_pda', () =>
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    versions: `V${(8 - i)}.${i % 3}.0`,
    content: `<p>1. 修复了若干已知问题</p><p>2. 优化扫描与拣货流程性能</p><p>3. 新增 V${8 - i} 批量操作能力</p>`,
    apkUrl: `https://cdn.jht.com/pda/jht-pda-v${8 - i}.${i % 3}.0.apk`,
    uploaded: at(PDA_FORCE, i),
    status: i === 0 ? '上线' : '下线', // 唯一线上版
    createTime: seedTime(i)
  })), [], 2)
// PDA 版本按发布时间区间(dateRange=[start,end])过滤，按发布时间倒序
pdaApi.list = (p = {}) => pdaApi.res.query(o =>
  (!p.dateRange || !p.dateRange.length ||
    (String(o.createTime).slice(0, 10) >= p.dateRange[0] && String(o.createTime).slice(0, 10) <= p.dateRange[1])),
  { page: p.page || 1, size: p.size || 10 })

// 发货计划：源为订舱发货计划(订舱服务/派件方式/装载容器/数量/限重/已装载/起运截单日期/运输天数/状态0-4/发起人)
export const DELIVERY_PLAN_STATUS = ['已下达', '已装满', '已完成', '已取消', '已过期']
export const DISPATCH_WAYS = ['快递', '卡派', '自提', '整柜直送']
export const deliveryApi = defineMock('sys_delivery', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    bscName: `订舱服务${pad(i + 1)}`,
    dispatch: i % 4, // 快递0/卡派1/自提2/整柜直送3
    containerName: at(['PMC板', '40HQ', '20GP', '厢式货车'], i),
    quantity: (i % 5) + 1, loadLimit: (i % 10 + 5) * 1000, loaded: i % 5,
    shipDate: `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)}`,
    cutoffDate: `2024-${pad((i % 12) + 1)}-${pad((i % 25) + 1)}`,
    transTime: (i % 15) + 5,
    status: i % 5, // 0已下达/1已装满/2已完成/3已取消/4已过期
    createUser: `操作员${pad(i + 1)}`, createDept: at(['运营部', '客服部', '仓储部'], i),
    ifBooking: i % 2,
    createTime: seedTime(i)
  })), ['bscName'], 2)
deliveryApi.list = (p = {}) => deliveryApi.res.query(o =>
  (p.status == null || p.status === '' || o.status === p.status) &&
  (!p.bscName || String(o.bscName).includes(p.bscName)),
  { page: p.page || 1, size: p.size || 10 })

// 计划订阅：源为订阅人管理(姓名/手机/微信/邮箱 + 手机/微信/邮件通知 + 计划/装载/成本订阅内容 + 航线/仓库订阅)
export const subscribeApi = defineMock('sys_subscribe', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `订阅人${pad(i + 1)}`,
    phone: `138${String(20000000 + i * 211).slice(0, 8)}`,
    wechat: `wx${10000 + i}`,
    email: `sub${i + 1}@jht.com`,
    bySms: i % 2 === 0, byWechat: i % 3 === 0, byEmail: true,
    plan: i % 2 === 0, loaded: i % 3 === 0, cost: i % 2 === 1,
    flightCount: i % 5, storeCount: i % 4,
    createTime: seedTime(i)
  })), ['name'], 2)
subscribeApi.list = (p = {}) => subscribeApi.res.query(o => {
  const kwOk = !p.keyword ||
    (p.selectType === '1' && String(o.name).includes(p.keyword)) ||
    (p.selectType === '2' && String(o.phone).includes(p.keyword)) || (!p.selectType)
  return kwOk
}, { page: p.page || 1, size: p.size || 10 })

// 通知配置：源为「通知类型树 + 5 种通知方式勾选(站内信/手机/邮箱/微信/app) + 通知接收人」的树形配置页
// 数据存二级通知项，页面在前端组装成 父(通知类型)→子(通知项) 树；每项含 5 个方式开关 + status(该项是否开启)
export const NOTICE_METHODS = [
  { key: 'mail', label: '站内信' },
  { key: 'phone', label: '手机' },
  { key: 'email', label: '邮箱' },
  { key: 'wechat', label: '微信' },
  { key: 'app', label: 'app' }
]
const NOTICE_CFG_GROUPS = [
  { group: '订单通知', items: ['下单成功', '订单取消', '订单异常'] },
  { group: '运单通知', items: ['运单生成', '到港提醒', '已签收'] },
  { group: '财务通知', items: ['账单生成', '充值到账', '扣费提醒'] }
]
export const noticeCfgApi = defineMock('sys_noticecfg', () => {
  let id = 0
  const rows = []
  NOTICE_CFG_GROUPS.forEach((g, gi) => {
    g.items.forEach((name, ii) => {
      const seed = gi * 3 + ii
      rows.push({
        id: ++id, group: g.group, name,
        mail: true, phone: seed % 2 === 0, email: true, wechat: seed % 3 === 0, app: seed % 2 === 1,
        persons: `接收人${pad((seed % 4) + 1)}`,
        status: seed % 5 === 0 ? '禁用' : '启用',
        createTime: seedTime(seed)
      })
    })
  })
  return rows
}, [], 2)

// 通知中心：源为「消息收件箱」——类型分组 + 未读/已读 + 批量标记已读 + 内容详情
export const noticeCtrApi = defineMock('sys_noticectr', () =>
  Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `${at(NOTICE_TYPES, i)}通知：${at(['您有新的订单待处理', '运单已到港，请及时安排', '本月账单已生成', '系统将于今晚维护'], i)}`,
    content: `尊敬的用户，${at(['您有一笔新订单 SO${i} 待确认。', '运单 WB${i} 已到港，请安排后续操作。', '您的 6 月账单已出账，请及时核对。', '系统将于今晚 23:00-24:00 进行例行维护。'], i)}`,
    type: at(NOTICE_TYPES, i),
    subType: at(['下单', '到港', '账单', '维护'], i),
    read: i % 3 === 0 ? '已读' : '未读',
    receiveTime: seedTime(i),
    createTime: seedTime(i)
  })), [], 2)
// 通知中心按 类型/已读状态/关键词(标题) 过滤
noticeCtrApi.list = (p = {}) => noticeCtrApi.res.query(o =>
  (!p.type || o.type === p.type) &&
  (!p.subType || o.subType === p.subType) &&
  (!p.read || o.read === p.read) &&
  (!p.keyword || String(o.title).includes(p.keyword)),
  { page: p.page || 1, size: p.size || 10 })

// 通知管理：源为「通知项 × 四类客户关联服务(穿梭) + 通知模版」配置页
// 四类客户：聚货通/供应商/代理商/客户，各含 启用开关 + 已关联服务数
export const NOTICE_CUST_TYPES = [
  { key: 'jht', label: '聚货通' },
  { key: 'supplier', label: '供应商' },
  { key: 'agent', label: '代理商' },
  { key: 'customer', label: '客户' }
]
export const NOTICE_SERVICES = ['海运整柜', '海运拼箱', '空运专线', '国际快递', '卡车派送', '报关服务', '仓储服务', '保险服务']
export const noticeMngApi = defineMock('sys_noticemng', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    msgType: at(['订单通知', '运单通知', '财务通知'], i),
    msgSubType: `${at(['下单成功', '运单生成', '账单生成', '到港提醒', '扣费提醒'], i)}通知`,
    jht: i % 2 === 0, supplier: i % 3 === 0, agent: i % 2 === 1, customer: true,
    jhtServices: [], supplierServices: [], agentServices: [], customerServices: [at(NOTICE_SERVICES, i)],
    templateTitle: `${at(['下单成功', '运单生成', '账单生成'], i)}模版`,
    templateContent: `尊敬的{客户名称}，您的业务【${at(['下单成功', '运单生成', '账单生成'], i)}】，详情请登录系统查看。`,
    createTime: seedTime(i)
  })), [], 2)

// 状态设置：源为「状态-角色权限矩阵」——按服务大类/排序筛选，每状态配置 5 角色 × (仅查看/可下载)
export const STATUS_ROLES = ['供应商', '聚货通', '一级代理商', '二级代理商', '客户']
export const STATUS_SERVICE_TYPES = ['仓储', '专线', '卡车', '拖车', '快递', '订舱', '报关']
export const statusApi = defineMock('sys_status', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    sorted: (i + 1) * 10,
    statusName: `${at(STATUS_SERVICE_TYPES, i)}-${at(['已下单', '已入仓', '运输中', '已到港', '已签收', '已完成'], i)}`,
    statusType: at(STATUS_SERVICE_TYPES, i),
    describes: `${at(['订单已创建', '货物已入仓', '货物运输中', '货物已到港', '客户已签收', '流程已完成'], i)}的状态节点`,
    fileDownload: i % 2, // 1 是 / 0 否
    viewRoles: i % 2 === 0 ? ['聚货通', '客户'] : ['聚货通', '一级代理商', '客户'],
    fileRoles: i % 2 === 1 ? ['聚货通', '客户'] : [],
    createTime: seedTime(i)
  })), [], 2)
// 状态按 服务大类 过滤 + 排序(升/降)
statusApi.list = (p = {}) => {
  const res = statusApi.res.raw().filter(o => !p.statusType || o.statusType === p.statusType)
  const sorted = res.slice().sort((a, b) => p.sortDir === 'desc' ? b.sorted - a.sorted : a.sorted - b.sorted)
  const page = p.page || 1, size = p.size || 10
  return mockRequest({ list: sorted.slice((page - 1) * size, page * size), total: sorted.length })
}

// 客户评级：对齐源(级别代码 code/级别描述 name/额度金额 rating/备注 remark)，无状态无筛选
export const levelApi = defineMock('sys_level', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, code: `LV${i + 1}`, name: `${at(['普通', '白银', '黄金', '钻石'], i)}会员`, rating: (i + 1) * 50000, remark: '', createTime: seedTime(i) })), ['name'], 2)

// 反馈：源为受理台(只读+处理流程)——来源/所属公司/反馈内容/页面截图/状态/时间；操作 查看详情/忽略/已处理/删除，无新增编辑
export const FEEDBACK_SOURCES = ['PC端', 'PDA端', '小程序', 'APP']
export const FEEDBACK_HANDLE_STATUS = ['待处理', '已忽略', '已处理']
export const feedbackApi = defineMock('sys_feedback', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    source: at(FEEDBACK_SOURCES, i),
    companyName: `${at(['客户', '代理商', '供应商'], i)}${pad(i + 1)}`,
    type: at(FEEDBACK_TYPES, i),
    content: `反馈内容示例${pad(i + 1)}：${at(['界面显示异常', '功能建议优化', '操作流程咨询', '数据统计问题'], i)}`,
    screenshot: '',
    handle: at(FEEDBACK_HANDLE_STATUS, i),
    createTime: seedTime(i)
  })), ['source', 'handle'], 2)
// 反馈按 来源/状态 精确 + 创建时间区间(dateRange=[start,end]) 过滤
feedbackApi.list = (p = {}) => feedbackApi.res.query(o =>
  (!p.source || o.source === p.source) &&
  (!p.handle || o.handle === p.handle) &&
  (!p.dateRange || !p.dateRange.length ||
    (String(o.createTime).slice(0, 10) >= p.dateRange[0] && String(o.createTime).slice(0, 10) <= p.dateRange[1])),
  { page: p.page || 1, size: p.size || 10 })
