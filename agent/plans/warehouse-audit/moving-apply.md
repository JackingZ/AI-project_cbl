# 调拨申请（MovingApply）源/目标一致性审计

- 源（Vue2，真实业务）:
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/moving-apply/index.vue`
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/moving-apply/detail.vue`（1218 行）
- 目标（Vue3，疑似通用 CRUD 骨架）:
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/src/views/warehouse/MovingApply.vue`（53 行）

## 结论（Verdict）

**大缺漏（Major Gaps）** — 一致性评分约 **15/100**。

目标页是一个标准的「单表 + 新增/编辑/删除弹窗」通用 CRUD 骨架，虚构了 `applyNo/fromWh/toWh/taskStatus/createTime` 五个字段。源页是一个真实的仓储**调拨申请（stock transfer/moving）** 业务：包含**审核流（待审核/审核中/审核通过/审核拒绝/已签收 五态）**、**取消、导出**、以及一个近千行的**明细挑单器**（按业务类型/仓库/服务组/时间查订单，勾选调拨订单并逐单设置目的仓计量/验货/转单标志）。目标页几乎没有还原任何真实字段与工作流，只保留了「有个列表能增删改」的形态。

以下已知的有意简化按任务要求**不计入缺漏**：单角色故无 `custType`、跳转详情改为弹窗、占位筛选、深层操作用 demoAction。但即便扣除这些，目标页仍缺失核心业务字段、审核状态机、明细挑单三大块。

---

## 1. 筛选项

| 维度 | 源（index.vue） | 目标 | 分类 |
|---|---|---|---|
| 状态 | `searchForm.audit` select，选项：待审核=0 / 审核通过=1 / 审核中=3 / 审核拒绝=2 / 已签收=4（5 态） | `taskStatus` select，选项：待调拨 / 已调拨（2 态，虚构） | 字段差异（状态语义与枚举完全不同，源为审核五态） |
| 申请时间 | `searchForm.applyTime` daterange（申请起始~截止，映射 startDate/endDate） | 无 | 源有目标无=需补 |
| 关键字组合搜索 | `searchForm.keyword` 输入 + prepend `keyType` select（原单号=1 / 申请单号=2） | `applyNo` 单一输入（虚构字段名） | 字段差异（源为「关键字类型+值」组合，可搜原单号或申请单号） |
| 单号字段名 | 申请单号即 `id`（keyType=2 时 model.id=keyword） | `applyNo`（虚构） | 字段差异 |

## 2. 表格列

| 源列（label / prop） | 目标列 | 分类 |
|---|---|---|
| 调拨申请单ID / `id` | 调拨单号 / `applyNo`（虚构名） | 字段差异 |
| 状态 / `audit`（五态文案渲染） | 状态 / `taskStatus`（两态） | 字段差异 |
| 调出仓库 / `out.name` | 调出仓 / `fromWh` | 字段差异（源为对象嵌套 out.name） |
| 目的仓库 / `win.name` | 调入仓 / `toWh` | 字段差异（源为对象嵌套 win.name，术语为「目的仓库」而非「调入仓」） |
| 总票数 / `total` | — | 源有目标无=需补 |
| 申请人 / `createUserName` | — | 源有目标无=需补 |
| 申请时间 / `createTime` | 创建时间 / `createTime` | 字段差异（label 应为「申请时间」） |
| 审核人 / `auditUserName` | — | 源有目标无=需补 |
| 审核时间 / `auditTime` | — | 源有目标无=需补 |
| 备注 / `remarks` | — | 源有目标无=需补 |
| （行样式）审核拒绝行标红 `rowClassName` frost-red | — | 源有目标无 |

## 3. 表单字段（新增/编辑）

源的新增/编辑不是简单弹窗表单，而是进入 `detail.vue` 全页表单 + 挑单器。目标用一个 4 字段弹窗（applyNo/fromWh/toWh/taskStatus）代替，语义完全不匹配。

| 源表单字段（detail.vue，isType!=='view'） | 目标弹窗字段 | 分类 |
|---|---|---|
| 目的仓库 `form.winId`（select，异步 getPurposeList，required） | 调入仓 `toWh`（纯文本输入，虚构） | 字段差异 |
| 备注 `form.remarks`（textarea，maxlength 200） | — | 源有目标无=需补 |
| 调出仓库（在挑单区 `searchForm.warehouseId` select，异步 getWarehouseList） | 调出仓 `fromWh`（纯文本输入，虚构） | 字段差异 |
| 调拨明细订单集合 `selectedData`（挑单器产出，见第 4/6 节） | — | 源有目标无=需补（核心缺失） |
| — | applyNo（虚构） | 目标有源无（源为系统生成 id，不手填） |
| — | taskStatus（虚构，源状态由审核流驱动，不手填） | 目标有源无 |

保存校验（`handleSave`）源有而目标无：目的仓必填、明细不能为空（「请选择调拨订单」）、同仓库禁止调拨（「同仓库无需调拨」）。

## 4. 详情字段（detail.vue，1218 行）

目标**无详情页**（已知简化：跳转改弹窗）。但源详情承载了本业务的绝大部分逻辑，弹窗未还原以下内容——全部为「源有目标无=需补」：

### 4.1 详情信息面板（view/edit 只读区）
调拨申请单ID `id`、目的仓库 `win.name`、调出仓库 `out.name`、总票数（`selectedData.length`）、状态（audit 五态）、申请人 `createUserName`、申请时间 `createTime`、审核人 `auditUserName`、审核时间 `auditTime`、签收人 `signName`、签收时间 `signTime`、备注 `remarks`；审核拒绝时顶部红框显示「拒绝原因：`form.reason`」。

### 4.2 明细挑单器筛选条（isType!=='view'）
- 视图切换 radio：全部 `all` / 已选择 `selected`
- 统计条：总订单数、总件数（filterPackages）、总体积 CBM（filterData）、总重量 KGS
- 业务类型 `searchForm.type`：仓储=1 / 散收拼货=2 / 拆柜打托=3
- 订单来源 `searchForm.from`（type=2 时）：客户端=web / 专线=line
- 调出仓库 `searchForm.warehouseId`（异步）
- 服务组 `searchForm.groupId`（type=2 时，异步 getGroupData → getLscServices）
- 下单时间 `searchForm.orderTime` daterange（默认近 30 天）
- 查询按钮 / 「手动添加订单」`orderVal` 输入 + 添加按钮（onAdd：按原单号补单，含「订单已存在」「暂无该订单信息」「该订单已发货」校验）

### 4.3 明细表（全部 tab / 已选 tab）
列：是否发货（ifLoading：未发货=0 / 已发货=1 / 部分发货=2）、原单号 `code`、服务 `service.value`、下单客户 `buyer.name`、客户名称 `orderCustomer.name`、总件数 `packages`、总体积（maxVolWeiFormat CBM）、总重量（KGS）；操作列三 checkbox：**目的仓计量 `ifMetering` / 目的仓验货 `ifInspection` / 目的仓转单 `ifTransfer`**（未发货 ifLoading===0 才可编辑）。已选 tab 额外列：入库签收时间 `signTime`、删除按钮。

### 4.4 业务规则
- 目的仓与调出仓**国家一致性**过滤（setWareToPurpose：purposeList 按 countryId 过滤）
- 体积/重量单位换算（$volumeConversion / $getVolumeUnitByLengthUnit）
- 已发货订单不可勾选（handleSelectable）

## 5. 操作按钮（文案 / 权限 / 条件 / 弹窗 or 跳转）— VERBATIM

源 index.vue 全文件仅有 **1 处** 权限指令，逐字如下：

```
v-permission="['movingApplySearch']"
```

绑定在「查询」按钮上。其余按钮**均无 v-permission / v-hasPermi**，改用 audit 状态 + ifCancel + custType 做条件显隐。

| 文案 | 权限指令（VERBATIM） | 显示条件 | 行为 |
|---|---|---|---|
| 新增 | 无 | 恒显 | 进入 detail 全页（handleAdd→detailShow） |
| 查询 | `v-permission="['movingApplySearch']"` | 恒显 | handleSearch(1) |
| 编辑 | 无 | `scope.row.audit === 0 \|\| scope.row.audit === 2` | 跳 detail（setData row,'edit'） |
| 删除 | 无 | `scope.row.ifCancel === 1` | $confirm「请确认是否删除该条数据?」→ deleteMove |
| 查看 | 无 | 恒显 | 跳 detail（setData row,'view'） |
| 审核 | 无 | `scope.row.audit === 0 \|\| scope.row.audit === 3` | audit!==3→直接提交 audit=3（handleAudited）；audit===3→打开审核弹窗（handleAuditing） |
| 取消 | 无 | `scope.row.audit !== 1 && scope.row.audit !== 4 && scope.row.ifCancel === 0` | cancelMove（cancel=1） |
| 导出 | 无 | `(scope.row.audit === 1 \|\| scope.row.audit === 4) && ['0', '3'].includes(custType)` | allocationExport → 下载 xls |
| 保存（detail 内） | 无 | `isType !== 'view'` | handleSave → saveMove |
| 返回（detail 内） | 无 | 恒显 | goBack |

目标按钮：新增（恒显，弹窗）、编辑（恒显，弹窗）、删除（恒显）。**缺失：查询按钮权限、查看、审核、取消、导出、保存/返回**，且编辑/删除无任何状态条件（源受 audit/ifCancel 严格约束）。

分类小结：
- 源有目标无=需补：查看、审核（含审核弹窗）、取消、导出，以及编辑/删除的状态条件。
- 目标有源无：编辑/删除无条件恒显（源必须按状态机限制）。

## 6. 子组件 / 子页面

| 源 | 目标 | 分类 |
|---|---|---|
| `detail.vue`（1218 行：调拨申请单表单 + 明细挑单器 + 统计 + 单位换算），index 内 `detailShow` 切换 | 无（用 Modal 简易表单代替） | 源有目标无=需补（核心） |
| `head-info` 组件（标题「调拨申请单」） | PageCard/SearchBar 骨架 | 字段差异 |
| 审核弹窗 `dialogAudit`（审核状态 radio：审核通过=1/审核拒绝=2；拒绝原因 reason，audit=2 时必填） | 无 | 源有目标无=需补 |
| 涉及 API：getMoveList / auditMove / deleteMove / cancelMove / allocationExport / saveMove / getPalletOrderList / getOrderList / getWHList / getLscGroupList / getLscGroupItems / getMoveViewDetail | 仅 `movingApi.list/add/edit/del`（通用） | 源有目标无=需补 |

## 审核状态机（源核心，目标完全缺失）

`audit` 取值：0=待审核、3=审核中、1=审核通过、2=审核拒绝、4=已签收。`ifCancel` 控制删除/取消可用性。审核动作 `handleAudit` 二段式：非审核中先提交转「审核中(3)」，审核中再弹窗做通过/拒绝。此状态机驱动列表按钮显隐、行标红、导出可用性，是本页真正的业务骨架。

---

## 目标权限模型建议（usePagePerms → can(action)，hasBtn = `${route.path}:${action}`）

源仅显式声明了查询权限键 `movingApplySearch`；其余按钮靠状态位控制。迁移到 `can()` 模型时，建议为本页声明以下 action（状态条件仍应保留在模板/逻辑中，与权限正交）：

- `can('view')` — 查看详情（源「查看」恒显，对应查询/详情权限，可复用源 `movingApplySearch` 语义）
- `can('add')` — 新增调拨申请
- `can('edit')` — 编辑（仍需叠加 audit∈{0,2} 条件）
- `can('del')` — 删除（仍需叠加 ifCancel===1 条件）
- `can('audit')` — 审核（业务动作，叠加 audit∈{0,3} 条件）
- `can('cancel')` — 取消（叠加 audit∉{1,4} && ifCancel===0）
- `can('export')` — 导出调拨申请单（叠加 audit∈{1,4}）
- `can('save')` — 详情内保存明细（可并入 add/edit）

最小集：`add / edit / del / view` + 业务动作 `audit / cancel / export`。
