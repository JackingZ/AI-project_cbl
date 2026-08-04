# 发货计划 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/delivery-plan/` (index 1323 + addEditForm 1567 + detail 551 + deliveryGroups 147 + hintModel 130 行)
- 目标: `src/views/system/DeliveryPlan.vue` (58 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (最复杂的一页; 目标 name/customer/planDate/planStatus 骨架, 与源订舱发货计划业务几乎无重叠)

源含 3 种页面态(发货计划 `product-page` / 计划详情 `product-detail` / 任务模板 `product-template-page`), 多级联动筛选, 生成 Booking 弹窗, 计划详情订单台账。目标只是名称+日期的简单增删改。

---

## 1. 筛选项 (源大量联动, 目标仅 2 项)

| 源 | 目标 | 结论 |
|---|---|---|
| 业务类型 `type`(字典 BOOKING_BUSINESS_TYPE, 联动清空下级) | 无 | 需补 |
| 目的国 `countryId`(远程) | 无 | 需补 |
| 服务 `bscId`(依赖 type, 联动填 countryId) | 无 | 需补 |
| 服务商 `bscTransId`(依赖 bscId, `orgName/serviceCode`) | 无 | 需补 |
| 计划状态 `status`(已下达0/已装满1/已完成2/已过期4/已取消3) | 计划状态 `planStatus`(PLAN_STATUS 通用) | 字段差异: 源 status 五态数值 |
| 起运时间 `shipTime`(daterange, 默认本月) | 无 | 需补 |
| 截单时间 `cutoffTime`(daterange) | 无 | 需补 |
| 订舱服务名称 `bscName`(输入) | 计划名称 `name` | 字段差异 |
| 新增 `v-permission=['addPlan']` | 新增(无键) | 需补 |
| 查询 `v-permission=['queryPlan']` | 无 | 需补 |

## 2. 表格列 (目标全错配)

源发货计划列: 订舱服务 `bscName` / 派件方式(dispatchFormat: 快递0/卡派1/自提2/整柜直送3) / 装载容器(按 type 前缀航空版/柜型/车型 + `containerName`) / 数量 `quantity` / 限重 `loadLimit` / 已装载 `loaded` / 起运日期 `shipDate`(格式化) / 截单日期 `cutoffDate` / 运输天数 `transTime` / 计划状态(0-4模板) / 发起人(`createUser` - `createDept`) / 操作(240宽)

源任务模板列(product-template-page): 订舱服务/派件方式/柜型/数量/限重/起运/截单/运输天数/频率(`frequency`+unit)/周期(`cycle`+unit)/操作(含 enable 开关)

目标列: name / customer / planDate / planStatus / status / createTime — 全部虚构, 无一真实对应。

结论: 整表重写。发货计划与任务模板是两套表格。

## 3. 操作按钮 (源多条件, 目标仅编辑/删除)

源发货计划操作:
- 查看 `viewProduct` → 切到 product-detail 详情页
- 编辑 `editProduct`, 条件 `enable !== 0 && $checkPermission(['editPlan'])`
- 取消 `cancelProduct`, 条件 `status !== 4 && enable === 0 && $checkPermission(['deletePlan'])`
- 删除 `deleteProduct`, 条件 `enable !== 0 && $checkPermission(['deletePlan'])`
- 生成Booking `makeBooking`, 条件 `status !== 4 && enable === 0 && ifBooking === 0` (无独立权限键)

目标: 编辑/删除(无键, 无条件)。

结论: 补 查看(跳详情→改弹窗)/编辑/取消/删除/生成Booking, 各带源的显示条件。

## 4. 表单/子页面 (目标全无)

- **addEditForm 新增/编辑** (1567 行, 字段): 业务类型 / 订舱服务 / 目的国 / 服务 / 服务组 / 服务商 / 柜型 / 航空版 / 体积 / 车型 / 数量 / 1个SO多条柜(单选0/1) / 限重 / 派件方式 / 起运日期 / 截单日期 / 运输时间 / 目的仓代码 / 装货仓库 / 创建频率(天/周) / 周期数量(天/周) / 备注 — 大量按 type 条件显隐
- **detail 计划详情** (551 行): 只读表单(业务类型/订舱服务/服务组/服务商/航空板/柜型/车型/数量/1个SO多条柜/限重/派件方式/起运日期/截单日期/运输时间/目的仓代码/备注) + 订单台账表格(原单号/SO号/提单号/航空单号/订单状态/审核状态/业务类型/服务/起运港/目的港/供应商/下单客户/多个装还柜状态/下单时间/查看)
- **hintModel** 启用确认弹窗; **deliveryGroups** 团购(源已注释, 可略)
- **生成Booking 弹窗**: 供应商 `supplyId` / 发货人 `consignor` / 收货人 `consignee` / 通知人 `notifier` (均远程必填)

结论: 均需补占位弹窗/页面, 深操作走 demoAction。

## 5. 建议 can 动作 (逐字对齐)

| 动作 | 源权限键 |
|---|---|
| 查询 | `queryPlan` |
| 新增 | `addPlan` |
| 编辑 | `editPlan` |
| 删除/取消 | `deletePlan` |
| 生成Booking | (源无键) 建议新增 can |
| 查看详情 | (源无键) |
