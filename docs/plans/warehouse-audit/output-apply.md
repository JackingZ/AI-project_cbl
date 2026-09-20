# 出库申请单 一致性审计报告

- 源 (Vue2, 真实业务):
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/output-apply/index.vue`
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/output-apply/detail.vue`
- 目标 (Vue3, 疑似通用 CRUD 骨架):
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/src/views/warehouse/OutputApply.vue`

## 结论 (Verdict)

**大缺漏 (Major Gap)** — 评分约 **15/100**。

目标页面是一个通用 CRUD 骨架 (5列表格 + 4字段新增/编辑弹窗 + 删除)，与源页面的真实业务几乎无关。源页面是一个**出库申请单审核流管理页**：多维度筛选、订单买卖双向 (orderType) 视角、审核 (通过/拒绝)、重新提交、完成出库、导出、流转订单、以及包含体积/重量单位换算的明细详情页。核心业务缺失项：**审核流 (audit workflow)**、**出库类型/服务类型分类**、**体积重量单位换算**、**详情页与明细子表**、**导出**、**完成出库**。此外目标页面存在源中不存在的伪造字段（新增/编辑/删除出库单本身在源业务里并不存在——出库单由订单流转生成，用户只能审核/完成/导出，不能手工增删改）。

---

## 1. 筛选项

| 维度 | 源 (index.vue) | 目标 | 分类 |
|---|---|---|---|
| 订单类型 orderType | `el-select` 销售订单(0)/采购订单(1)，仅 custType 0/2 可见 | 无 | 源有目标无=需补(简化：单角色可忽略买卖切换，但类型概念丢失) |
| 申请公司 custId | `el-select` filterable，按 custType 动态加载 | 无 | 源有目标无=需补(单角色简化，可略) |
| 原单号 code | `el-input` 原单号 | `applyNo` 出库单号 input | 字段差异 (源为 code/原单号，目标为 applyNo) |
| 仓库 warehouseId | `el-select` 远程加载仓库列表 | 无 (仅表单里有仓库 input) | 源有目标无=需补 |
| 审核状态 audit | `el-select` 待审核(0)/审核通过(1)/审核拒绝(2) | 无 | 源有目标无=需补 (核心) |
| 订单状态 status | `el-select` 动态字典 WS_OUT | `taskStatus` select 待出库/已出库 | 字段差异 (目标状态值虚构) |
| 出库类型 type | `el-select` 发货出库(0)/调拨出库(1)/退件出库(2) | 无 | 源有目标无=需补 (核心) |
| 服务类型 sourceType | `el-select` 一件代发(0)/仓储(1)/散收拼货(2)/拆柜打托(3) | 无 | 源有目标无=需补 (核心) |
| 申请时间 applyTime | `el-date-picker` daterange，默认近30天 | 无 | 源有目标无=需补 |
| 查询按钮 | `v-permission="['warehouseInspectionQuery']"` | SearchBar 内置 handleSearch | 权限差异 |

## 2. 表格列

| 列 | 源 prop | 目标 prop | 分类 |
|---|---|---|---|
| 出库申请单/订单号 | `id` (fixed left) | `applyNo` 出库单号 + `orderNo` 订单号 (拆成两列) | 字段差异 |
| 审核状态 | `audit` (fixed left, 0/1/2 映射) | 无 | 源有目标无=需补 (核心) |
| 订单状态 | `status` (formatDict) | `taskStatus` (值虚构) | 字段差异 |
| 出库类型 | `type` (0/1/2 映射) | 无 | 源有目标无=需补 |
| 服务类型 | `sourceType` (0/1/2/3 映射) | 无 | 源有目标无=需补 |
| 总箱数 | `packages` | 无 | 源有目标无=需补 |
| 总体积 | `volumes` (maxVolWeiFormat CBM) | 无 | 源有目标无=需补 |
| 总重量 | `weights` (maxVolWeiFormat KGS) | 无 | 源有目标无=需补 |
| 车/柜型 | `deliveryDesc` | 无 | 源有目标无=需补 |
| 操作人 | `executorName` | 无 | 源有目标无=需补 |
| 申请人 | `applicationName` | 无 | 源有目标无=需补 |
| 装载时间 | `loadTime` | 无 | 源有目标无=需补 |
| 创建时间 | `createTime` | `createTime` | 一致 |
| 仓库 | (源列表无独立仓库列) | `warehouse` | 目标有源无 |

## 3. 表单字段 (新增/编辑弹窗)

**源无新增/编辑表单** — 出库单由订单流转产生，用户不手工创建。目标弹窗的所有字段均为骨架虚构：

| 目标表单字段 | 源对应 | 分类 |
|---|---|---|
| applyNo 出库单号 | 无 (源为只读 id) | 目标有源无 (伪造，出库单不可手工建) |
| orderNo 订单号 | 无 | 目标有源无 |
| warehouse 仓库 | 无 | 目标有源无 |
| taskStatus 状态 (待出库/已出库) | 无 | 目标有源无 (状态值虚构) |

源真正的"表单"是**审核弹窗** (dialogAudit)，目标完全缺失：

| 审核弹窗字段 | 源 | 目标 | 分类 |
|---|---|---|---|
| 审核结果 audit | `el-radio-group` 通过(1)/拒绝(2)，required | 无 | 源有目标无=需补 (核心) |
| 拒绝原因 reason | `el-input textarea` maxlength=100，audit==2 时显示 | 无 | 源有目标无=需补 |

## 4. 详情字段 (detail.vue)

目标**无详情页**（已知简化：跳转改弹窗，但弹窗内并无这些字段）。源详情页字段全部缺失：

**表单区 (header):**
| 字段 | 源绑定 |
|---|---|
| 出库申请单/订单号 | `form.id` |
| 总箱数 | `form.packages` |
| 总体积 | `maxVolWeiFormat(form,'CBM')` + CBM |
| 总重量 | `maxVolWeiFormat(form,'KGS')` + KGS |
| 车/柜型 | `form.deliveryDesc` |
| 车牌号/柜号 | `form.supplement.modeNo` (deliveryType 1=车牌号 else 柜号) |
| 司机姓名 | `form.supplement.driver` |
| 身份证 | `form.supplement.certNo` |
| 司机电话 | `form.supplement.phone` |
| 仓库 | `form.warehouse.name` |
| 出库类型 | `form.type` 发货/调拨/退件出库 |
| 服务类型 | `form.sourceType` 一件代发/仓储/散收拼货/拆柜打托 |
| 审核状态 | `form.audit` 待审核/审核通过/审核拒绝 |
| 装载时间 | `form.loadTime` |
| 拒绝原因 | `form.reason` (audit==2 显示) |

**明细子表 (list / dtls):**
| 列 | 源 prop |
|---|---|
| 排序 | `$index+1` |
| 原单号 | `code` |
| 单箱最大尺寸 | `volume` (maxVolWeiFormat 'M') + M |
| 单箱最大重量 | `weight` (maxVolWeiFormat 'KG') + KGS |
| 总箱数 | `packages` |
| 总体积 | `volumes` (CBM) |
| 总重量 | `weights` (KGS) |
| 服务 | `type` (按 sourceType 映射) |

分类：**全部 源有目标无=需补**。

## 5. 操作按钮 (VERBATIM 权限)

| 操作 | 源文案 | 权限指令 (VERBATIM) | 条件 | 弹窗/跳转 | 目标 |
|---|---|---|---|---|---|
| 查询 | 查询 | `v-permission="['warehouseInspectionQuery']"` | 无 | 触发 handleSearch | 无(内置) |
| 查看 | 查看 | `v-permission="['warehouseOutOrderView']"` | 无 | 跳转 detail | 无 (需补) |
| 审核 | 审核 | `$checkPermission(['warehouseOutOrderAudit'])` | `audit==='0' && orderType==='0'` | 弹窗 dialogAudit | 无 (需补, 核心) |
| 重新提交 | 重新提交 | `$checkPermission(['warehouseOutOrderReset'])` | `audit==='2' && orderType==='1'` | 直接调用 setOutputAudit | 无 (需补) |
| 流转订单 | 流转订单 | `$checkPermission(['warehouseOutOrderUpLevel'])` | (已注释) `audit==='1' && orderType==='0' && custType!=='3' && !transfered` | confirm 后 setOutputOrder | 无 (源已注释, 可略) |
| 完成出库 | 完成出库 | `$checkPermission(['warehouseOutOrderComplete'])` | `status!=='2' && status!=='9' && custType==='3'` | confirm 后 changeOutputStatus | 无 (需补) |
| 导出(调拨) | 导出 | (已注释, 无权限) | `audit==='1' && type==='1'` | allocationExport | 无 (源已注释) |
| 导出 | 导出 | (无权限指令) | `['0','3'].includes(custType)` | allocationOutport 下载 xls | 无 (需补) |
| 新增 | — | — | — | — | **目标有源无** (伪造) |
| 编辑 | — | — | — | — | **目标有源无** (伪造) |
| 删除 | — | — | — | — | **目标有源无** (伪造) |

提取到的全部权限 key (VERBATIM):
- `warehouseInspectionQuery`
- `warehouseOutOrderView`
- `warehouseOutOrderAudit`
- `warehouseOutOrderReset`
- `warehouseOutOrderUpLevel` (注释中)
- `warehouseOutOrderComplete`

注：源用两种机制 — `v-permission="[...]"` (指令，用于查询/查看) 与 `$checkPermission([...])` (方法，用于操作列条件按钮)。目标页面无任何权限集成。

## 6. 子组件 / 子页面

| 项 | 源 | 目标 | 分类 |
|---|---|---|---|
| detail.vue 详情子页 | 有 (v-show 切换，含明细子表) | 无 | 源有目标无=需补 |
| head-info 标题组件 | 有 (title="出库申请单") | 无 (PageCard) | 差异 |
| 审核弹窗 dialogAudit | 有 | 无 | 源有目标无=需补 |
| maxVolWeiFormat 单位换算 | 有 ($volumeConversion / $getVolumeUnitByLengthUnit) | 无 | 源有目标无=需补 |
| 导出下载 (Blob→xls) | 有 (downXsl) | 无 | 源有目标无=需补 |

---

## 目标权限模型建议 (usePagePerms → can(action))

目标权限模型: `usePagePerms()` → `can(action)`，`hasBtn` 检查 `${route.path}:${action}`。据源真实业务，本页应支持的 `can()` actions：

| can(action) | 对应源权限 | 用途 |
|---|---|---|
| `can('query')` | warehouseInspectionQuery | 查询按钮 |
| `can('view')` | warehouseOutOrderView | 查看详情 |
| `can('audit')` | warehouseOutOrderAudit | 审核 (通过/拒绝弹窗) |
| `can('reset')` | warehouseOutOrderReset | 重新提交 |
| `can('complete')` | warehouseOutOrderComplete | 完成出库 |
| `can('export')` | (源无 key, allocationOutport) | 导出申请单 |
| `can('upLevel')` | warehouseOutOrderUpLevel | 流转订单 (源已注释, 可选) |

**不建议** 保留 `can('add')` / `can('edit')` / `can('del')` — 源业务中出库单不可手工增删改，这三个操作及其表单为骨架虚构，应移除或替换为上述业务动作。

---

## 修复建议摘要

1. 移除伪造的 新增/编辑/删除 及其弹窗表单 (出库单不可手工创建)。
2. 重建筛选项：原单号、仓库、审核状态、订单状态(WS_OUT 字典)、出库类型、服务类型、申请时间(近30天)。
3. 重建表格列 (13列)：id、审核状态、订单状态、出库类型、服务类型、总箱数、总体积(CBM)、总重量(KGS)、车/柜型、操作人、申请人、装载时间、创建时间。
4. 补齐操作列：查看(→详情)、审核(→弹窗)、重新提交、完成出库、导出，及各自权限条件。
5. 新建详情页/弹窗：header 15字段 + 明细子表 8列，含体积/重量单位换算。
6. 接入 usePagePerms，用 can('query'/'view'/'audit'/'reset'/'complete'/'export')。
