# 盘点 InventoryApply.vue 一致性审计

- 源：`agent/workProject2-jht/src/views/warehose-management/inventory-apply/`（index.vue 11688B + detail.vue 12907B + option-detail.vue 26082B + select-modal.vue 16581B，共 4 文件）
- 目标：`src/views/warehouse/InventoryApply.vue`（58 行，通用 CRUD 骨架）
- 结论：**系统性错配**。目标是「新增/编辑/删除」通用增删改骨架；源是「盘点申请单」业务系统，含新增流程（选订单/选库位/生成盘点）、详情双表（盘点内容/实盘结果）、盘点任务分配子流程。目标无一处对应真实业务。

## 筛选项

| 源 | 目标 | 判定 |
|---|---|---|
| 状态(下拉 待盘点/盘点中/已完成/已取消) | 状态(下拉 盘点中/已完成) | 字段差异：源4值目标2值，缺「待盘点」「已取消」 |
| 盘点方式(下拉 按订单/按库位) | 盘点类型(下拉 全盘/抽盘) | **字段差异（虚构）**：源为「按订单/按库位」，目标虚构「全盘/抽盘」 |
| 仓库名称(下拉 远程 getWarehouseList) | — | 源有目标无=需补（目标仅表单里有「仓库」输入框，非筛选） |
| 申请时间(daterange，默认近30天) | — | 源有目标无=需补 |
| 原单号(input) | 盘点单号(input) | 字段差异：源筛选「原单号」，目标筛选「盘点单号(applyNo)」 |

## 表格列

| 源列 | 目标列 | 判定 |
|---|---|---|
| 盘点申请单 inventoryCode(fixed left) | 盘点单号 applyNo | 字段差异：命名 inventoryCode→applyNo |
| 状态(map statusList) | 状态 taskStatus | 字段差异 |
| 盘点方式(map typeList) | 盘点类型 type | 字段差异 |
| 仓库名称 warehouseName | 仓库 warehouse | 字段差异 |
| 理论票数 totalNumber | — | 源有目标无=需补 |
| 理论件数 totalPackages | — | 源有目标无=需补 |
| 理论托数 totalTowage | — | 源有目标无=需补 |
| 实盘票数 actualTotalNumber | — | 源有目标无=需补 |
| 实盘件数 actualTotalPackages | — | 源有目标无=需补 |
| 实盘托数 actualTotalTowage | — | 源有目标无=需补 |
| 申请时间 applicantTime | 创建时间 createTime | 字段差异 |
| 完成时间 completeTime | — | 源有目标无=需补 |
| 库存锁 ifStock(已锁/未锁) | — | 源有目标无=需补 |

## 操作按钮

| 源 | 权限键(v-permission / $checkPermission) | 条件 | 目标 | 判定 |
|---|---|---|---|---|
| 新增盘点 | `inventoryApplyAdd` | — | 新增(openAdd 弹窗) | 文案差异+权限0接入。目标为弹窗，源为整页 detail(showPage='d') |
| 查看 | `inventoryApplyView` | — | — | 源有目标无=需补（源跳 option-detail 整页，背景允许改弹窗） |
| 编辑 | `inventoryApplyEdit` | `![1,2,3].includes(status)` | 编辑(openEdit) | 权限0接入+条件缺失（源仅待盘点可编辑） |
| 删除 | — | — | 删除(remove) | **目标有源无**：源列表无删除，目标虚构删除 |

### 详情页深层操作（源 option-detail / detail，目标全缺）

| 源操作 | 权限键 | 条件 |
|---|---|---|
| 完成申请单 | `inventoryApplyComplete` | `![2,3].includes(status)` |
| 取消申请单 | `inventoryApplyCancel` | `[0,1].includes(status)` |
| 分配盘点任务(弹窗选账号) | `inventoryApplyDistribution` | `![2,3].includes(status)` |
| 取消分配(任务单/内容) | `inventoryApplyCancelTask` | `[1,2].includes(status)` |
| 释放库存锁 release | （代码保留，模板注释） | — |

## 子组件/子页面（源有，目标全无）

- `detail.vue`：新增盘点流程（盘点方式 radio 按订单/按库位/按仓库、盘点仓库、选订单/选库位、生成盘点、总票/件/托数）
- `option-detail.vue`：盘点详情。含 盘点内容表 / 实盘结果表(radio 切换) + 盘点任务表 + 分配账号弹窗 + 任务单详情弹窗；库位类型 binTypeList(库区/巷道/货架/层/格子)
- `select-modal.vue`：选订单/库位弹窗（16581B）

## 评分：2/10

目标为通用 CRUD 骨架，与源盘点业务（理论/实盘票件托、库存锁、盘点任务分配、完成/取消流程）几乎零重叠。虚构了「全盘/抽盘」「删除」。真实核心（实盘对比、任务分配）完全缺失。

## 建议 can 动作

`usePagePerms()` → `can('add')` 新增盘点、`can('view')` 查看详情、`can('edit')` 编辑（限待盘点）、`can('complete')` 完成申请单、`can('cancel')` 取消申请单、`can('distribute')` 分配盘点任务、`can('cancelTask')` 取消分配、`can('release')` 释放库存锁。（源无列表删除，不建议 `del`。）
