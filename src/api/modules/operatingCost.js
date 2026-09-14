// 运营成本模块 mock 接口（保真对齐 vue3-jht-admin/src/views/operating-cost）
// 覆盖 3 子页：成本项目 projects / 成本项目组 project-groups / 服务附加费 service-surcharge。
// 说明：服务附加费页源码整页被注释（仅保留 head-info 空壳），无接口调用，故本文件不含其资源。
// 编码陷阱：结算单位 settlement 为字符串码 '0'~'9'/'A'；项目组类型 type 为字符串 '0'~'4'（表格用 parseInt 比较）。
import { defineMock, pad, at } from '../mockCrud'
import { mockRequest, paginate } from '../mock'

/* ============================================================================
 * 一、共享字典
 * ========================================================================== */

// 服务大类（getServiceTypeConfigList / getServiceTypeList）：快递00/卡派01/订舱02/报关03/仓储04/专线05/拖车06
export const SERVICE_TYPE_LIST = [
  { id: '00', name: '快递' }, { id: '01', name: '卡派' }, { id: '02', name: '订舱' }, { id: '03', name: '报关' },
  { id: '04', name: '仓储' }, { id: '05', name: '专线' }, { id: '06', name: '拖车' }
]

// 结算单位 settlementList（id 为字符串码，'A' 为按个数）
export const SETTLEMENT_LIST = [
  { id: '0', name: '按重量' }, { id: '1', name: '按体积' }, { id: '2', name: '按金额' }, { id: '3', name: '按票' },
  { id: '4', name: '按箱' }, { id: '5', name: '按车' }, { id: '6', name: '按柜' }, { id: '7', name: '按里程' },
  { id: '8', name: '按时间' }, { id: '9', name: '按托' }, { id: 'A', name: '按个数' }
]

// 项目组类型 typeList（字符串 id）
export const GROUP_TYPE_LIST = [
  { id: '0', name: '普通组' }, { id: '1', name: '计费生成的发票费用组' }, { id: '2', name: '订舱成本费用组' },
  { id: '3', name: '国内出口杂费组' }, { id: '4', name: '国外目的港清关费' }
]

// 项目类型（getServiceSubtypeConfigList，按服务大类 typeId 派生的小类）
const SUBTYPE_MAP = {
  '00': [{ id: '0', name: '本地快递' }, { id: '1', name: '国际快递' }],
  '01': [{ id: '0', name: '整柜' }, { id: '1', name: '拼箱' }],
  '02': [{ id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' }, { id: '4', name: '卡航' }],
  '03': [{ id: '0', name: '出口报关' }, { id: '1', name: '进口报关' }],
  '04': [{ id: '0', name: '普通仓储' }, { id: '1', name: '海外仓储' }],
  '05': [{ id: '0', name: '空运' }, { id: '1', name: '海运' }, { id: '2', name: '铁路' }, { id: '4', name: '卡散' }],
  '06': [{ id: '0', name: '普通拖车' }]
}

// 结算单位 → 计量单位（getUmBySettlement）
const UM_MAP = {
  '0': [{ id: 'KGS', name: 'KGS' }, { id: 'LBS', name: 'LBS' }],
  '1': [{ id: 'CBM', name: 'CBM' }, { id: 'CUFT', name: 'CUFT' }],
  '2': [{ id: 'USD', name: 'USD' }, { id: 'CNY', name: 'CNY' }],
  '3': [{ id: 'TICKET', name: '票' }],
  '4': [{ id: 'BOX', name: '箱' }],
  '5': [{ id: 'CAR', name: '车' }],
  '6': [{ id: 'CABINET', name: '柜' }],
  '7': [{ id: 'KM', name: '公里' }, { id: 'MILE', name: '英里' }],
  '8': [{ id: 'HOUR', name: '小时' }, { id: 'DAY', name: '天' }],
  '9': [{ id: 'PALLET', name: '托' }],
  'A': [{ id: 'PCS', name: '个' }]
}

/* ============================================================================
 * 二、共享下拉数据源
 * ========================================================================== */

// 服务大类下拉（成本项目 & 项目组关联弹窗共用）
export function getServiceTypeList() {
  return mockRequest(SERVICE_TYPE_LIST.slice())
}
// 项目类型下拉（按 serviceTypeId 派生）
export function getCostitemTypeList({ typeId } = {}) {
  return mockRequest(SUBTYPE_MAP[typeId] ? SUBTYPE_MAP[typeId].slice() : [])
}
// 结算单位对应计量单位
export function getUmBySettlement({ settlement } = {}) {
  return mockRequest(UM_MAP[settlement] ? UM_MAP[settlement].slice() : [])
}

/* ============================================================================
 * 三、成本项目 costitem（cost_projects_v2）
 * ========================================================================== */

const SETTLEMENT_CODES = SETTLEMENT_LIST.map(s => s.id)
const seedTypes = i => {
  const svc = at(SERVICE_TYPE_LIST, i)
  const subs = SUBTYPE_MAP[svc.id] || []
  return subs.slice(0, (i % 2) + 1).map(s => ({ typeId: s.id, typeName: s.name }))
}
const projects = defineMock('cost_projects_v2', () =>
  Array.from({ length: 14 }, (_, i) => {
    const svc = at(SERVICE_TYPE_LIST, i)
    return {
      id: i + 1,
      name: `成本项目${pad(i + 1)}`,
      alias: `CostItem${pad(i + 1)}`,
      serviceTypeId: svc.id,
      serviceTypeName: svc.name,
      types: seedTypes(i),
      settlement: at(SETTLEMENT_CODES, i),
      umId: undefined,
      umName: undefined,
      invoice: `Invoice desc ${pad(i + 1)}`,
      remark: i % 3 === 0 ? '' : `备注${pad(i + 1)}`,
      ranging: svc.id === '04' ? i % 2 === 0 : undefined
    }
  }), ['name', 'serviceTypeId', 'typeId'], 2
)
// 列表：serviceTypeId 精确 + typeId 命中 types 数组 + name 模糊
export function getCostitemList(p = {}) {
  const rows = projects.res.raw().filter(o =>
    (!p.name || String(o.name || '').includes(p.name)) &&
    (!p.serviceTypeId || o.serviceTypeId === p.serviceTypeId) &&
    (!p.typeId || (o.types || []).some(t => t.typeId === p.typeId))
  )
  return mockRequest(paginate(rows, { page: p.page || 1, size: p.size || 10 }))
}
export function saveCostitem(d) {
  return d.id ? projects.update(d.id, d) : projects.add(d)
}
export function deleteCostitem(id) { return projects.remove(id) }

/* ============================================================================
 * 四、成本项目组 costgroup（cost_groups_v2）
 * ========================================================================== */

const groups = defineMock('cost_groups_v2', () =>
  Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `成本项目组${pad(i + 1)}`,
    type: at(GROUP_TYPE_LIST, i).id,
    remark: i % 3 === 0 ? '' : `备注${pad(i + 1)}`
  })), ['name'], 2
)
export function getCostgroupList(p = {}) {
  return groups.list({ page: p.page || 1, size: p.size || 10 })
}
export function saveCostgroup(d) {
  return d.id ? groups.update(d.id, d) : groups.add(d)
}
export function deleteCostgroup(id) { return groups.remove(id) }

// 组-成员关联（getCostmemberList / saveCostmember）：按 costgroupId 存已选成本项目 id
const _members = {}
export function getCostmemberList({ costgroupId } = {}) {
  const ids = _members[costgroupId] || []
  return mockRequest(ids.map(costitemId => ({ costitemId })))
}
export function saveCostItems({ costgroupId, costmembers } = {}) {
  _members[costgroupId] = (costmembers || []).map(m => m.costitemId)
  return mockRequest(null)
}
// 关联弹窗左侧数据源：按服务大类过滤成本项目（getCostitemList serviceTypeId + size 9999）
export function getCostList({ serviceTypeId } = {}) {
  const rows = projects.res.raw().filter(o => !serviceTypeId || o.serviceTypeId === serviceTypeId)
  return mockRequest(rows.map(o => ({ id: o.id, name: o.name })))
}
