// 机构“更多”附加信息 mock 接口：联系信息/地址信息/我的设置/收款信息/开票信息/文件列表
// 六类子记录统一存于一个资源，用 ownerType(customer/supplier/agent)+ownerId 归属主体。
// 数据经 persist.js 持久化到 localStorage，刷新后保留。
import { createResource } from '../persist'
import { mockRequest } from '../mock'
import { REGIONS } from './organizers'

/* ============ 选项枚举 ============ */
// 枚举对齐源项目 workProject2-jht
export const ADDRESS_TYPES = ['办公室', '客服部', '提货仓库', '到货仓库']
export const SETTING_TYPES = ['发货人', '收货人', '通知人', '进口商', '海外代理', '订舱代理', '报关抬头']
export const COLLECTION_TYPES = ['银行卡', '微信', '支付宝', 'PayPal', '其它']
export const CURRENCIES = ['USD 美元', 'EUR 欧元', 'CNY 人民币', 'GBP 英镑', 'JPY 日元']
export const FILE_TYPES = ['身份证正面', '身份证反面', '营业执照', 'WCA证书', 'ITAT证书', 'NVOCC证书', '合同', '其他']
export const VALID_OPTIONS = ['有效', '无效']

const COUNTRIES = REGIONS.map(r => r.value)
const pad = n => String(n).padStart(2, '0')
const t = i => `2024-${pad((i % 12) + 1)}-${pad((i % 27) + 1)} ${pad((i % 12) + 8)}:30:00`

// 为 owner(1、2) 各造几条示例子记录，令“更多”打开即有数据
function seed() {
  const rows = []
  let id = 1
  const push = r => rows.push({ id: id++, createTime: t(id), updateTime: t(id), ...r })
  ;['customer', 'supplier', 'agent'].forEach(ownerType => {
    for (let ownerId = 1; ownerId <= 2; ownerId++) {
      const base = { ownerType, ownerId }
      const c = COUNTRIES[ownerId % COUNTRIES.length]
      push({ ...base, tab: 'contact', country: c, dept: '业务部', duty: '业务对接', name: `联系人${ownerId}`, tel: `010-8888${ownerId}00`, phone: `139${pad(ownerId)}00000${ownerId}`, email: `contact${ownerId}@demo.com`, sns: `wx_demo${ownerId}`, address: `${c}某街${ownerId}号` })
      push({ ...base, tab: 'address', isDefault: ownerId === 1, addrType: '提货仓库', name: `默认仓${ownerId}`, region: [c], address: `${c}物流园${ownerId}区`, contactName: `联系人${ownerId}` })
      push({ ...base, tab: 'file', fileType: '营业执照', name: `营业执照${ownerId}`, code: `LIC${pad(ownerId)}0001`, des: '扫描件' })
      if (ownerType !== 'customer') {
        push({ ...base, tab: 'collection', collType: '银行卡', country: c, currency: 'USD 美元', acctNo: `62220${ownerId}0000${ownerId}`, swiftCode: `BKCHCNBJ${ownerId}`, remark: '主账户' })
        push({ ...base, tab: 'bill', name: `${c}${ownerId}公司`, taxId: `91${pad(ownerId)}000000000`, bank: '中国银行', country: c, currency: 'CNY 人民币', amount: `${ownerId * 10}万`, remark: '' })
      }
    }
  })
  // SYSTEM自身档案（设置页），ownerId 固定为 0
  const jht = { ownerType: 'jht', ownerId: 0 }
  const jc = COUNTRIES[0]
  push({ ...jht, tab: 'contact', country: jc, dept: '运营中心', duty: '客服主管', name: 'SYSTEM客服', tel: '0755-88886666', phone: '13900000000', email: 'service@jht.com', sns: 'jht_service', address: '深圳市南山区SYSTEM大厦' })
  push({ ...jht, tab: 'address', isDefault: true, addrType: '到货仓库', name: '深圳总仓', region: [jc], address: '深圳市宝安区物流园A区', contactName: '仓管员' })
  push({ ...jht, tab: 'setting', settingType: '发货人', contact: 'SYSTEM', company: 'SYSTEM供应链', phone: '0755-88886666', email: 'ship@jht.com', region: [jc], valid: '有效' })
  push({ ...jht, tab: 'collection', collType: '银行卡', country: jc, currency: 'CNY 人民币', acctNo: '6222001234567890', swiftCode: 'BKCHCNBJ', remark: '对公账户' })
  push({ ...jht, tab: 'bill', name: 'SYSTEM供应链有限公司', taxId: '91440300000000000X', bank: '中国银行深圳分行', country: jc, currency: 'CNY 人民币', amount: '100万', remark: '' })
  push({ ...jht, tab: 'file', fileType: 'NVOCC证书', name: 'NVOCC经营资质', code: 'NVOCC00001', des: '无船承运业务经营资格' })
  return rows
}

const moreResource = createResource('org_more', seed, 3)

/* ============ CRUD ============ */
// 按主体 + 标签页拉取子记录列表（不分页，子表数据量小）
export function getMoreList(ownerType, ownerId, tab) {
  return moreResource.list(
    r => r.ownerType === ownerType && Number(r.ownerId) === Number(ownerId) && r.tab === tab
  )
}
export function addMore(ownerType, ownerId, tab, data) {
  return moreResource.add({ ownerType, ownerId: Number(ownerId), tab, updateTime: nowStr(), ...data })
}
export function updateMore(id, data) {
  return moreResource.update(id, { updateTime: nowStr(), ...data })
}
export function deleteMore(id) {
  return moreResource.remove(id)
}
// 设为默认地址：同主体同标签页其余记录取消默认
export function setDefaultAddress(ownerType, ownerId, id) {
  moreResource.raw().forEach(r => {
    if (r.ownerType === ownerType && Number(r.ownerId) === Number(ownerId) && r.tab === 'address') {
      moreResource.update(r.id, { isDefault: r.id === Number(id) })
    }
  })
  return mockRequest(null)
}

function nowStr() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
