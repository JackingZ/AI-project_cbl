// 仓库管理模块 mock 接口（作业/任务类）
import { defineMock, pad, at, seedTime } from '../mockCrud'

export const STATUS_OPTIONS = ['启用', '禁用']
const WAREHOUSES = ['深圳仓', '上海仓', '宁波仓', '洛杉矶仓']
const wh = i => at(WAREHOUSES, i)
const container = i => `CT${200000 + i * 7}`
const order = i => `YD${100000 + i * 11}`

// 卸货申请单：对齐源(卸货类型 整车/整柜/快递、司机车牌、预计/实际卸货时间、卸货口、仓库对接人、操作人/申请人、4态、签收子表)
export const UNLOAD_TYPES = ['整车', '整柜', '快递']
export const UNLOAD_STATUS = ['待卸货', '卸货中', '已完成', '已取消']
export const unloadApi = defineMock('wh_unload', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    unloadNo: `XH${100000 + i}`,
    originalNo: order(i),
    unloadType: at(UNLOAD_TYPES, i),
    unloadStatus: at(UNLOAD_STATUS, i),
    warehouseName: wh(i),
    licenseNo: i % 3 === 2 ? `SF${700000000 + i}` : `粤B${String(10000 + i).slice(0, 5)}`,
    expressName: i % 3 === 2 ? at(['顺丰', '京东', '中通'], i) : '',
    driversName: i % 3 === 2 ? '' : `司机${pad(i + 1)}`,
    driversMobile: i % 3 === 2 ? '' : `138${String(10000000 + i * 137).slice(0, 8)}`,
    expectedUnloadTime: seedTime(i),
    expectedWcName: `${(i % 6) + 1}号卸货口`,
    warehouseContactPerson: `对接人${pad(i + 1)}`,
    actualUnloadStartTime: i % 2 ? seedTime(i) : '',
    actualUnloadEndTime: i % 3 === 2 ? seedTime(i + 1) : '',
    executorName: `操作员${pad(i + 1)}`,
    assignorName: `申请人${pad(i + 1)}`,
    signItems: [
      { originalNo: order(i), totalNumber: (i % 8) + 1, problemNumber: i % 4 === 0 ? (i % 3) + 1 : 0 },
      { originalNo: order(i + 1), totalNumber: (i % 5) + 2, problemNumber: 0 }
    ],
    createTime: seedTime(i)
  })), ['unloadNo~', 'unloadType', 'unloadStatus'], 2)

// 计量申请：对齐源(计量单号/原单号/仓库/审核状态机0-4/总票件/计量员/复核/计量明细子表)
export const MEASURE_STATUS = { 0: '待计量', 1: '计量中', 2: '已计量', 3: '复核中', 4: '已完成' }
export const measureApi = defineMock('wh_measure', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    measureNo: `JL${100000 + i}`,
    originalNo: order(i),
    warehouseName: wh(i),
    status: [0, 1, 2, 3, 4][i % 5],
    totalNumber: (i % 8) + 1,
    totalWeight: (i % 50) + 10,
    totalVolume: Number(((i % 20) / 2 + 1).toFixed(2)),
    executorName: `计量员${pad(i + 1)}`,
    reviewerName: i % 3 === 0 ? `复核员${pad(i + 1)}` : '',
    items: [
      { boxNo: `BX${1000 + i}`, length: 40 + i, width: 30 + i, height: 20 + i, weight: (i % 20) + 5, volume: Number((((40 + i) * (30 + i) * (20 + i)) / 1e6).toFixed(3)) }
    ],
    createTime: seedTime(i)
  })), ['measureNo~', 'status'], 2)

// 拖托任务：对齐源(任务类型 入库/出库/移库/计量拖托、拖托人、要求完成时间、3态、托盘明细子表)。源无增删改,仅查看/打印托标
export const TOWAGE_METHODS = ['入库', '出库', '移库', '计量拖托']
export const TOWAGE_STATUS = ['待执行', '执行中', '已完成']
export const PALLET_EQUIP = ['托盘', '中转箱']
export const trailerTaskApi = defineMock('wh_trailer', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    towageNo: `TT${100000 + i}`,
    towageMethod: at(TOWAGE_METHODS, i),
    pickerId: `拖托员${pad(i + 1)}`,
    status: at(TOWAGE_STATUS, i),
    expectedFinishTime: seedTime(i + 2),
    pallets: [
      { towageNo: `TT${100000 + i}`, equipment: at(PALLET_EQUIP, i), palletNo: `PL${300000 + i * 3}`, status: at(TOWAGE_STATUS, i), startingArea: `A${(i % 5) + 1}区`, storageLocation: `B${(i % 4) + 1}区`, finishTime: i % 2 ? seedTime(i + 3) : '' }
    ],
    createTime: seedTime(i)
  })), ['towageNo~', 'towageMethod', 'status'], 2)

// 拆柜任务：对齐源(柜号 cabinetNo、仓库、审核状态 status 0待审核/1通过/3审核中、拆柜明细子表、实拆件数/托盘数)。源列表只读+编辑+审核
export const REMOVAL_STATUS = { 0: '待审核', 1: '已通过', 3: '审核中' }
export const removalApi = defineMock('wh_removal', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    cabinetNo: container(i),
    warehouseName: wh(i),
    status: [0, 1, 3][i % 3],
    totalPackages: (i % 20) + 10,
    actualPackages: (i % 20) + 10,
    palletCount: (i % 5) + 1,
    auditRemark: '',
    items: [
      { originalNo: order(i), packages: (i % 8) + 1, actualPackages: (i % 8) + 1, palletNo: `PL${300000 + i}`, goodsStatus: at(['正常', '破损', '缺件'], i) },
      { originalNo: order(i + 1), packages: (i % 5) + 2, actualPackages: (i % 5) + 2, palletNo: `PL${300001 + i}`, goodsStatus: '正常' }
    ],
    createTime: seedTime(i)
  })), ['cabinetNo~'], 2)

// 调拨申请：对齐源(调拨单号/调出仓/调入仓/审核状态机0待审3审核中1通过2拒绝4已签收/总票数/申请人/审核人/明细挑单子表)
export const MOVING_STATUS = { 0: '待审核', 3: '审核中', 1: '已通过', 2: '已拒绝', 4: '已签收' }
export const movingApi = defineMock('wh_moving', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    movingNo: `DB${100000 + i}`,
    fromWh: wh(i), toWh: wh(i + 1),
    status: [0, 3, 1, 2, 4][i % 5],
    totalNumber: (i % 10) + 1,
    applicant: `申请人${pad(i + 1)}`,
    auditor: i % 3 === 0 ? `审核人${pad(i + 1)}` : '',
    auditTime: i % 3 === 0 ? seedTime(i) : '',
    remark: '',
    items: [
      { originalNo: order(i), targetWh: wh(i + 1), measureStatus: at(['待计量', '已计量'], i), examineStatus: at(['待验货', '已验货'], i) }
    ],
    createTime: seedTime(i)
  })), ['movingNo~', 'status'], 2)

// 出库申请：源由订单流生成,不可手工增删改。审核状态机(0待审/3审核中/1通过/2拒绝/4已完成)+出库类型/服务类型/总箱数体积重量/车柜型/操作人申请人/装载时间
export const OUTPUT_STATUS = { 0: '待审核', 1: '已通过', 2: '已拒绝', 3: '审核中', 4: '已完成' }
export const OUTPUT_TYPES = ['整柜出库', '散货出库', '快递出库']
export const outputApi = defineMock('wh_output', () =>
  Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    outputNo: `CK${100000 + i}`,
    status: [0, 3, 1, 2, 4][i % 5],
    outputType: at(OUTPUT_TYPES, i),
    serviceType: at(['海运整柜', '空运', '卡航'], i),
    warehouseName: wh(i),
    totalBox: (i % 30) + 5, totalVolume: (i % 20) + 3, totalWeight: (i % 200) + 50,
    containerType: at(['40HQ', '20GP', '厢式货车'], i),
    executorName: `操作员${pad(i + 1)}`, assignorName: `申请人${pad(i + 1)}`,
    loadTime: i % 2 ? seedTime(i) : '',
    auditRemark: '',
    createTime: seedTime(i)
  })), ['outputNo~', 'outputType'], 2)

// 盘点申请：对齐源(盘点单号/仓库/状态/理论vs实盘 票件托/库存锁/盘点员/盘点明细子表)
export const INVENTORY_STATUS = { 0: '待盘点', 1: '盘点中', 2: '已完成', 3: '已取消' }
export const inventoryApi = defineMock('wh_inventory', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    inventoryNo: `PD${100000 + i}`,
    warehouseName: wh(i),
    status: [0, 1, 2, 3][i % 4],
    theoryOrder: (i % 10) + 5, theoryNumber: (i % 20) + 10, theoryPallet: (i % 5) + 1,
    actualOrder: (i % 10) + 5, actualNumber: (i % 20) + 9, actualPallet: (i % 5) + 1,
    locked: i % 2 === 0,
    executorName: `盘点员${pad(i + 1)}`,
    items: [
      { originalNo: order(i), theoryNum: (i % 8) + 1, actualNum: (i % 8) + 1, diff: 0, location: `${at(['A', 'B', 'C'], i)}${(i % 9) + 1}区` }
    ],
    createTime: seedTime(i)
  })), ['inventoryNo~', 'status'], 2)

// 验货申请：源为验货单查看(列表只读)，含验货方式/验货结果/验货员/商品明细/验货照片
export const EXAMINE_RESULT = ['合格', '不合格']
const EXAMINE_TYPES = ['入库检验', '退货入库']
export const examineApi = defineMock('wh_examine', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    originalNo: order(i),
    warehouseName: wh(i),
    examineType: at(EXAMINE_TYPES, i),
    examineResult: i % 3 === 0 ? '不合格' : '合格',
    executorName: `验货员${pad(i + 1)}`,
    examineTime: i % 4 === 3 ? '' : seedTime(i),
    photos: [],
    goodsItems: [
      { skuCode: `SKU${1000 + i}`, cnName: `商品${pad(i + 1)}`, packages: (i % 8) + 1, result: i % 3 === 0 ? '不合格' : '合格' },
      { skuCode: `SKU${1001 + i}`, cnName: `商品${pad(i + 2)}`, packages: (i % 5) + 2, result: '合格' }
    ],
    createTime: seedTime(i)
  })), ['originalNo~', 'examineResult'], 2)

// 异常处理：源为货物异常通知处理(所属环节、异常类型、照片、处理三分支 退件/增值服务/拒绝 + 批量通知客户/管理员)
export const ANOMALY_TYPES = ['破损', '缺件', '超重', '标签异常', '包装异常']
export const ANOMALY_STAGES = ['卸货', '计量', '验货', '拆柜', '出库']
export const ANOMALY_HANDLE = ['待处理', '已退件', '已增值处理', '已拒绝']
export const anomalyApi = defineMock('wh_anomaly', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    anomalyNo: `YC${100000 + i}`,
    originalNo: order(i),
    stage: at(ANOMALY_STAGES, i),
    type: at(ANOMALY_TYPES, i),
    warehouseName: wh(i),
    description: `${at(ANOMALY_TYPES, i)}异常示例${pad(i + 1)}`,
    photos: [],
    handle: at(ANOMALY_HANDLE, i),
    createTime: seedTime(i)
  })), ['anomalyNo~', 'type', 'handle'], 2)

// 换单任务：源为扫码换单作业(扫快递单号→匹配,含换单明细/文件下载)
export const transferApi = defineMock('wh_transfer', () =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    originalNo: order(i),
    oldTrackingNo: `SF${700000000 + i}`,
    newTrackingNo: `JD${800000000 + i}`,
    warehouseName: wh(i),
    status: at(['待换单', '已换单'], i),
    operator: `操作员${pad(i + 1)}`,
    transferTime: i % 2 ? seedTime(i) : '',
    createTime: seedTime(i)
  })), ['originalNo~', 'status'], 2)

// 仓库配置：对齐源(名称/国家地区/州省市区/邮编/地址/入库限重+单位/卸货平台·叉车·监管仓·中转仓 布尔/状态)
export const WEIGHT_UNITS = ['KG', 'T', 'LB']
const CFG_REGION = [
  { c: '美国', s: '加利福尼亚州', ci: '洛杉矶' }, { c: '德国', s: '黑森', ci: '法兰克福' },
  { c: '日本', s: '东京都', ci: '新宿' }, { c: '英国', s: '英格兰', ci: '伦敦' }
]
export const configApi = defineMock('wh_config', () =>
  Array.from({ length: 8 }, (_, i) => {
    const r = CFG_REGION[i % CFG_REGION.length]
    return {
      id: i + 1,
      name: wh(i) + pad(i + 1),
      code: `WH${1000 + i}`,
      countryName: r.c, stateName: r.s, cityName: r.ci,
      postal: `${100000 + i * 137}`.slice(0, 6),
      address: `${r.ci}${at(['中心路', '港区路', '物流大道'], i)}${i + 1}号`,
      weight: (i % 5 + 1) * 500, unitOfWeight: 'KG',
      unloading: i % 2 === 0 ? 1 : 0,   // 卸货平台
      forklift: i % 2 === 1 ? 1 : 0,    // 叉车
      supervise: i % 3 === 0 ? 1 : 0,   // 监管仓
      transfer: i % 3 === 1 ? 1 : 0,    // 中转仓
      status: i % 5 === 0 ? '0' : '1',
      createTime: seedTime(i)
    }
  }), ['name'], 2)
