// 系统管理模块 mock 接口
import { defineMock, pad, at, seedTime } from '../mockCrud'

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

export const airApi = defineMock('sys_air', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `号段${pad(i + 1)}`, prefix: `${999 - i}`, airline: at(AIRLINES, i), status: st(i), createTime: seedTime(i) })), ['name', 'airline', 'status'])

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

export const commodityApi = defineMock('sys_commodity', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `商品${pad(i + 1)}`, hsCode: `${8500 + i}00`, audit: at(AUDIT_STATUS, i), customer: `客户${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'audit', 'status'])

export const productApi = defineMock('sys_product', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `产品${pad(i + 1)}`, sku: `SKU${10000 + i}`, brand: `品牌${pad((i % 5) + 1)}`, price: money(i), status: st(i), createTime: seedTime(i) })), ['name', 'status'])

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

export const pcApi = defineMock('sys_pc', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `PC配置${pad(i + 1)}`, ckey: `pc.key${i + 1}`, cvalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const pdaApi = defineMock('sys_pda', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `PDA配置${pad(i + 1)}`, ckey: `pda.key${i + 1}`, cvalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

export const deliveryApi = defineMock('sys_delivery', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `发货计划${pad(i + 1)}`, customer: `客户${pad(i + 1)}`, planDate: `2024-${pad((i % 12) + 1)}-15`, planStatus: at(PLAN_STATUS, i), status: st(i), createTime: seedTime(i) })), ['name', 'planStatus', 'status'])

export const subscribeApi = defineMock('sys_subscribe', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `订阅${pad(i + 1)}`, cycle: at(CYCLES, i), receiver: `接收人${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'cycle', 'status'])

export const noticeCfgApi = defineMock('sys_noticecfg', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `通知配置${pad(i + 1)}`, channel: at(CHANNELS, i), event: at(NOTICE_EVENTS, i), status: st(i), createTime: seedTime(i) })), ['name', 'channel', 'status'])

export const noticeCtrApi = defineMock('sys_noticectr', () =>
  Array.from({ length: 14 }, (_, i) => ({ id: i + 1, name: `通知标题${pad(i + 1)}`, type: at(NOTICE_TYPES, i), read: at(READ_STATUS, i), date: seedTime(i), createTime: seedTime(i) })), ['name', 'type', 'read'])

export const noticeMngApi = defineMock('sys_noticemng', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `通知${pad(i + 1)}`, type: at(['系统', '公告'], i), publisher: `发布人${pad(i + 1)}`, status: st(i), createTime: seedTime(i) })), ['name', 'type', 'status'])

// 客户评级：对齐源(级别代码 code/级别描述 name/额度金额 rating/备注 remark)，无状态无筛选
export const levelApi = defineMock('sys_level', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, code: `LV${i + 1}`, name: `${at(['普通', '白银', '黄金', '钻石'], i)}会员`, rating: (i + 1) * 50000, remark: '', createTime: seedTime(i) })), ['name'], 2)

export const setApi = defineMock('sys_set', () =>
  Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `系统设置${pad(i + 1)}`, skey: `sys.key${i + 1}`, svalue: `值${i + 1}`, status: st(i), createTime: seedTime(i) })), ['name', 'status'])

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

export const statusApi = defineMock('sys_status', () =>
  Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `状态${pad(i + 1)}`, code: `ST${100 + i}`, scene: at(SCENES, i), status: st(i), createTime: seedTime(i) })), ['name', 'scene', 'status'])
