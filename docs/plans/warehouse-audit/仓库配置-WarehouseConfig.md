# 仓库配置 WarehouseConfig.vue 一致性审计

- 源：`agent/workProject2-jht/src/views/warehose-management/warehouse-config/`（超重配置页，21 文件含 shiftPostCompontent 子目录；index.vue 24959B + tabsData.vue 6136B + addEditForm.vue 39225B 等，主干 ~9195 行级）
- 目标：`src/views/warehouse/WarehouseConfig.vue`（56 行，通用 CRUD 骨架，唯一带 status el-switch 的一页）
- 结论：**系统性错配**（本页偏差绝对量最大）。源是「仓库列表 + 8 个子配置 tab + 巨型新增/编辑表单」的复合配置中心；目标是仓库名称/编码/地址/负责人/状态 五字段的 CRUD 骨架。

## 主干结构（源）

- **双视图切换**：`isMoreShow` 控制 列表视图 ↔ tab 配置视图（`handleMore` 进入、`handleBack` 返回）
- **多 tab（tabsData.vue，8 个，每个 v-if $checkPermission 独立权限）**：
  1. 班次信息 schedulingInformation — `warehouseScheduling`
  2. 班次岗位分配 shiftPostAllocation — `warehouseShiftPost`
  3. 分拣口 dischargingHatch — `warehouseDischargingHatch`
  4. 操作中心 operatingCenter — `warehouseOperatingCenter`
  5. 库位信息 locationManagement — `warehouseLocationManagement`
  6. 转仓信息 transferInformation — `warehouseTransferInfmt`
  7. 入库条款 warehouseClause — `warehouseClause`
  8. 成本项目配置 custItemConfig — `warehouseCustItemConfig`
  （另 轮岗配置 postShiftConfiguration 已注释）
- **无树结构**；地址走 国家→州省→城市 三级联动下拉
- 目标：无 tab、无双视图、无子配置。**整套 tab 配置体系全缺**

## 筛选项

| 源 | 目标 | 判定 |
|---|---|---|
| 供应商 custId(v-if custId==='0'，远程) | — | 源有目标无（背景：单角色可简化） |
| 国家/地区 countryId(远程 filterable) | — | 源有目标无=需补 |
| 州/省 stateId(联动，依赖国家) | — | 源有目标无=需补 |
| 城市 cityId(联动，依赖州省) | — | 源有目标无=需补 |
| 启用状态 status(禁用/启用) | 状态 status(启用/禁用) | 大致一致（值域相近） |
| 仓库配置 wareConfig(有/无卸货平台、有/无叉车) | — | 源有目标无=需补 |
| 仓库属性 wareAttr(是/非监管仓、是/非中转仓) | — | 源有目标无=需补 |
| 仓库名称 name(input) | 仓库名称 name(input) | 一致 |
| 商品属性 categoryList(multiple，已注释) | — | 源已注释 |

## 表格列

| 源列 | 目标列 | 判定 |
|---|---|---|
| 仓库名称 name | 仓库名称 name | 一致 |
| 国家/地区 countryName | — | 源有目标无=需补 |
| 州省市区(stateName>cityName>countyName) | — | 源有目标无=需补 |
| 仓库邮编 postal | — | 源有目标无=需补 |
| 仓库地址 address | 地址 address | 字段差异（label 简化，prop 同） |
| 入库限重 weight(+单位 filterUnit) | — | 源有目标无=需补 |
| 卸货平台 unloading(√/--) | — | 源有目标无=需补 |
| 叉车 forklift(√/--) | — | 源有目标无=需补 |
| 监管仓 supervise(√/--) | — | 源有目标无=需补 |
| 中转仓 transfer(√/--) | — | 源有目标无=需补 |
| 添加时间 createTime(formatTime) | 创建时间 createTime | 一致 |
| 状态 status(el-switch 启用/禁用 1/0) | 状态(el-switch 启用/禁用) | 一致（目标唯一保留 switch 的页，✓） |
| — | 仓库编码 code | **目标有源无（虚构）**：源列表无「仓库编码」列 |
| — | 负责人 manager | **目标有源无（虚构）**：源列表无「负责人」列 |

## 操作按钮

| 源 | 权限键(v-permission) | 目标 | 判定 |
|---|---|---|---|
| 新增仓库 | `warehouseOutStockAdd` | 新增 openAdd(弹窗) | 权限0接入。源为巨型 addEditForm(39225B) |
| 查询 | `warehouseOutStockQuery` | (SearchBar 内置) | 权限0接入 |
| 设置服务(→transferModal) | `warehouseSetService` | — | 源有目标无=需补 |
| 编辑(→addEditForm) | `warehouseOutStockUpdate` | 编辑 openEdit | 权限0接入 |
| 删除 | `warehouseOutStockDel` | 删除 remove | 权限0接入（此项源目标皆有，✓） |
| 更多(→tab 配置视图) | 8 键任一(`warehouseScheduling`等) | — | 源有目标无=需补（核心：进入子配置） |
| 状态开关 onStatus(confirm) | 无独立键 | toggle(el-switch) | 大致一致 |

## 子组件/子页面（源 20 文件，目标 0）

addEditForm(新增/编辑巨表单,39225B)、custItemConfig、dischargeForm、dischargingHatch、locationForm、locationManagement、opeartingForm、operatingCenter、postShiftConfiguration、postShiftForm、schedulingForm、schedulingInformation、shiftPostAllocation、shiftPostCompontent(目录)、transferInfoForm、transferInformation、transferModal(设置服务弹窗)、warehouseClause、workShiftConfiguration、workShiftForm、tabsData。**目标全缺**

## 评分：3/10

仓库列表主干（名称/地址/状态 + 新增/编辑/删除 + status switch）勉强对得上，删除权限项也齐全（相对最好的一页）。但源核心价值——8 tab 子配置体系、地址三级联动、限重/卸货平台/叉车/监管仓/中转仓、设置服务、巨型编辑表单——全缺。目标虚构了「仓库编码」「负责人」。

## 建议 can 动作

`usePagePerms()` → `can('add')` 新增仓库、`can('query')` 查询、`can('edit')` 编辑、`can('del')` 删除、`can('setService')` 设置服务、`can('status')` 启停、`can('more')` 进入子配置。子 tab 若落地再拆：`can('scheduling')`/`can('shiftPost')`/`can('dischargingHatch')`/`can('operatingCenter')`/`can('location')`/`can('transfer')`/`can('clause')`/`can('custItem')`。
