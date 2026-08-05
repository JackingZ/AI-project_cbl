# 卸货申请单 一致性审计 (Unloading Apply)

- SOURCE (Vue2 真实业务):
  - `agent/workProject2-jht/src/views/warehose-management/unloading-apply/index.vue`
  - `agent/workProject2-jht/src/views/warehose-management/unloading-apply/detail.vue`
  - `agent/workProject2-jht/src/views/warehose-management/unloading-apply/searchMore.vue`
- TARGET (Vue3 通用 CRUD 骨架):
  - `src/views/warehouse/UnloadingApply.vue`

## 判定 (Verdict): 大缺漏 (major gaps)

理由：源页面是一个真实的仓库卸货作业单据 —— 卸货类型(整车/整柜/快递)、司机/车牌/柜号/快递、预计与实际卸货时间、卸货口、仓库对接人、以及详情页内嵌的"订单签收单"子表(收货件数/问题件箱数/问题件照片查看)。目标页只是一个 `applyNo/containerNo/warehouse/taskStatus` 的通用增删改查骨架，字段、列、筛选几乎全部虚构或极度简化，且完全没有详情页、没有签收子表、没有权限集成。除"卸货单/状态"这一概念外，业务信息几乎全部丢失，因此属于大缺漏。

---

## 1. 筛选项 (Filter / Search items)

源筛选分两部分：`index.vue` 主搜索行 + `searchMore.vue` 高级筛选。

| 维度 | 源字段 | 源标签 | 目标字段 | 结论 |
|---|---|---|---|---|
| 主搜索 | `originalNo` (input) | 原单号 | — | 源有目标无=需补 |
| 主搜索 | `unloadNo` (input) | 卸货申请单号 | `applyNo` (input, 卸货单号) | 字段差异 (命名 unloadNo→applyNo) |
| 主搜索 | `unloadType` (select: 整车1/整柜2/快递3) | 卸货类型 | — | 源有目标无=需补 |
| 主搜索 | `unloadStatus` (select: 待卸货1/卸货中2/已完成3/已取消4) | 状态 | `taskStatus` (select: 待卸货/已卸货) | 字段差异 (4态→2态, 值由数字→中文串) |
| 主搜索 | `countryId` (远程 select, 联动仓库) | 国家/地区 | — | 源有目标无=需补 |
| 主搜索 | `warehouseId` (远程 select) | 仓库 | — | 源有目标无=需补 (目标仅在表单里有 warehouse input) |
| 主搜索 | `applyTime` (daterange, 默认近30天) | 申请起/止期 | — | 源有目标无=需补 |
| 主搜索 | `value` + `key` (车牌1/柜号2 组合输入) | 车牌/柜号 | — | 源有目标无=需补 |
| 高级(searchMore) | `originalNo` | 原单号 | — | 源有目标无=需补 |
| 高级 | `warehouseName` | 仓库名称 | — | 源有目标无=需补 |
| 高级 | `lineNo` | 排队序号 | — | 源有目标无=需补 |
| 高级 | `driversName` | 司机姓名 | — | 源有目标无=需补 |
| 高级 | `driversMobile` | 司机联系电话 | — | 源有目标无=需补 |
| 高级 | `expectedWcName` | 卸货口 | — | 源有目标无=需补 |
| 高级 | `actualUnloadStartTime` (datetime) | 实际卸货时间 | — | 源有目标无=需补 |
| 高级 | `actualUnloadEndTime` (datetime) | 卸货完成时间 | — | 源有目标无=需补 |
| 高级 | `warehouseContactPerson` | 仓库对接人 | — | 源有目标无=需补 |

注：`searchMore.vue` 在源 `index.vue` 中未被实例化引用(`moreShow` data 存在但模板未渲染)，属源侧遗留高级筛选组件；作为业务字段清单仍列出。

【目标有源无】：无。

---

## 2. 表格列 (Table columns)

| 源 prop | 源 label | 目标 prop | 结论 |
|---|---|---|---|
| `unloadNo` (fixed left) | 卸货申请单ID | `applyNo` (卸货单号) | 字段差异 (命名) |
| `unloadStatus` (映射4态) | 状态 | `taskStatus` (2态直显) | 字段差异 (4态→2态) |
| `warehouseName` | 仓库名称 | `warehouse` (仓库) | 字段差异 (命名) |
| `executorName` | 操作人 | — | 源有目标无=需补 |
| `assignorName` | 申请人 | — | 源有目标无=需补 |
| `createTime` | 申请时间 | `createTime` (创建时间) | 一致 (标签差异) |
| `unloadType` (整车/整柜/快递) | 卸货类型 | — | 源有目标无=需补 |
| `licenseNo` | 车牌/柜/快递号 | — | 源有目标无=需补 |
| `driversName` | 司机姓名 | — | 源有目标无=需补 |
| `driversMobile` | 司机联系电话 | — | 源有目标无=需补 |
| `expectedUnloadTime` | 预计卸货时间 | — | 源有目标无=需补 |
| `expectedWcName` | 预计卸货口 | — | 源有目标无=需补 |
| `warehouseContactPerson` | 仓库对接人 | — | 源有目标无=需补 |
| `actualUnloadStartTime` | 实际卸货时间 | — | 源有目标无=需补 |
| `actualUnloadEndTime` | 卸货完成时间 | — | 源有目标无=需补 |

【目标有源无】：`containerNo` (柜号) —— 源无独立柜号列(柜号并入 `licenseNo` "车牌/柜/快递号")，属目标新增/拆分列。

---

## 3. 表单字段 (Add / Edit form fields)

源页面 **没有新增/编辑表单** —— 卸货单是仓库作业系统下发的业务单据，前端只做查询与查看详情，无增删改。目标凭空虚构了新增/编辑弹窗。

| 目标表单字段 | 源对应 | 结论 |
|---|---|---|
| `applyNo` 卸货单号 | 源仅查询/展示,无录入 | 目标有源无 (整块新增/编辑功能虚构) |
| `containerNo` 柜号 | 源并入 licenseNo | 目标有源无 |
| `warehouse` 仓库 | 源为 warehouseId 远程选择 | 字段差异 (input vs 远程 select) |
| `taskStatus` 状态 | 源 unloadStatus 4态 | 字段差异 (2态) |

结论：整个"新增/编辑表单"是目标虚构，源业务中不存在录入表单；建议改为"无表单"或以查看详情为主。

---

## 4. 详情字段 (Detail page fields — detail.vue)

目标 **完全没有详情页**(源的独立详情被"删除",非仅替换为 modal)。源 `detail.vue` 详情字段：

| 源字段 | 标签 | 目标 | 结论 |
|---|---|---|---|
| `unloadNo` | 卸货申请单ID | 无详情页 | 源有目标无=需补 |
| `warehouseName` | 仓库名称 | 无 | 需补 |
| `executorName` | 操作人 | 无 | 需补 |
| `assignorName` | 申请人 | 无 | 需补 |
| `createTime` | 申请时间 | 无 | 需补 |
| `unloadType` | 卸货类型(整车/整柜/快递) | 无 | 需补 |
| `licenseNo` | 车牌/柜/快递单号 | 无 | 需补 |
| `expressName` | 快递公司 (仅 unloadType===3 显示) | 无 | 需补 (条件字段) |
| `driversName` | 司机姓名 (unloadType!==3 显示) | 无 | 需补 (条件字段) |
| `driversMobile` | 司机联系电话 (unloadType!==3 显示) | 无 | 需补 (条件字段) |
| `expectedUnloadTime` | 预计卸货时间 | 无 | 需补 |
| `expectedWcName` | 预计卸货口 | 无 | 需补 |
| `warehouseContactPerson` | 仓库对接人 | 无 | 需补 |
| `actualUnloadStartTime` | 实际卸货时间 | 无 | 需补 |
| `actualUnloadEndTime` | 卸货完成时间 | 无 | 需补 |
| `unloadStatus` | 状态(4态) | 无 | 需补 |

详情页内嵌 **"订单签收单"子表** (list) —— 整块缺失，需补：

| 子表 prop | 标签 | 说明 |
|---|---|---|
| `originalNo` | 原单号 | |
| `totalNumber` | 收货件数 | |
| `problemNumber` | 问题件箱数 | |
| (操作) | 问题件照片 | `problemNumber` 存在时显示"查看"按钮 → 弹出图片 dialog，读取 `row.qcImage`(逗号分隔)拼 OSS 路径展示 |

源详情还有被注释的签字/图片区(仓库签字、送货人签字、车牌图片)，当前已注释，可不补。

---

## 5. 操作按钮 (Action buttons — 文案 / 权限 key / 条件 / 弹窗or跳转)

VERBATIM 提取源全部权限指令值：

| 位置 | 文案 | v-permission (VERBATIM) | 条件 | 弹窗/跳转 |
|---|---|---|---|---|
| 主搜索查询按钮 | 查询 | `v-permission="['warehouseConfigQuery']"` | 无 | 触发列表查询 |
| 表格行操作 | 查看详情 | `v-permission="['warehouseUnloadView']"` | 无(每行都有) | 页内切换 `detailShow` 显示 detail 子组件(非路由跳转,非 modal) |
| 详情子表 | 查看(问题件照片) | 无权限指令 | `v-if="scope.row.problemNumber"` | 弹窗 el-dialog 图片预览 |

源全部 v-permission 值(去重)：`warehouseConfigQuery`、`warehouseUnloadView`。

| 目标按钮 | 文案 | 源对应 | 结论 |
|---|---|---|---|
| openAdd | 新增 | 源无 | 目标有源无 (虚构) |
| openEdit | 编辑 | 源无 | 目标有源无 (虚构) |
| remove | 删除 | 源无 | 目标有源无 (虚构) |
| — | 查看详情 | 源核心操作 | 源有目标无=需补 |

结论：目标把源唯一的真实操作(查看详情)删掉，换成了源不存在的增/删/改。操作语义完全错位。目标且无任何权限集成(无 `usePagePerms`/`can()`)。

---

## 6. 子组件 / 子页面 (Sub-components / Sub-pages)

| 源 | 说明 | 目标 | 结论 |
|---|---|---|---|
| `detail.vue` | 卸货申请单详情(页内切换显示,含签收子表+问题件照片 dialog) | 无 | 源有目标无=需补(核心) |
| `searchMore.vue` | 高级筛选组件(源模板未挂载,遗留) | 无 | 可选补齐 |
| 远程数据源: `getUnloadList`/`getUnloadById`/`getWHList`(仓库)/`getCountryByCustSerice`(国家) | 列表/详情/仓库/国家联动 | 目标用通用 `unloadApi` + mock | 数据模型需按真实字段扩充 |

---

## 权限建议 (Recommended can() actions)

目标使用 `usePagePerms()` → `can(action)` (`hasBtn` 检查 `${route.path}:${action}`)。基于源真实按钮：

- `can('view')` —— 对应源 `warehouseUnloadView`「查看详情」，核心操作，必须补。
- `can('query')` / 列表查询 —— 对应源 `warehouseConfigQuery`「查询」(可并入页面级读取权限)。

源无增删改，因此若遵循真实业务：**不应有** `can('add')` / `can('edit')` / `can('del')`。目标当前的新增/编辑/删除均为虚构。若产品决定在 Vue3 侧保留 CRUD 作为演示(demoAction 路由),建议至少将「查看详情」`can('view')` 补为主操作，并对新增/编辑/删除标注为演示能力，避免与真实卸货作业单据语义冲突。

最小推荐集：`can('view')`(查看详情)、`can('query')`(查询)。业务无 audit/scan/receive 独立按钮 —— 卸货审核流体现在 `unloadStatus` 状态字段(待卸货/卸货中/已完成/已取消)与详情签收子表数据上,而非前端操作按钮。

---

## 关键缺口小结 (Top gaps)

1. **无详情页**：源核心是查看详情(16个字段)+ 内嵌"订单签收单"子表(原单号/收货件数/问题件箱数/问题件照片查看 dialog),目标全部缺失。
2. **卸货类型维度缺失**：`unloadType`(整车/整柜/快递)驱动多个条件字段(快递公司 vs 司机姓名/电话),目标无此概念。
3. **状态被降维**：源4态(待卸货/卸货中/已完成/已取消,数字值)→目标2态(待卸货/已卸货,中文值)。
4. **筛选几乎全丢**：卸货类型、国家/仓库联动、申请时间范围、车牌/柜号组合搜索、9项高级筛选全缺。
5. **表格列大量缺失**：操作人/申请人/卸货类型/车牌柜快递号/司机信息/预计+实际卸货时间/卸货口/仓库对接人 全缺。
6. **操作语义错位**：源只有"查看详情",目标改成虚构的新增/编辑/删除。
7. **无权限集成**：目标未接 `usePagePerms`/`can()`;源有 `warehouseConfigQuery`、`warehouseUnloadView`。
