# 验货 ExamineApply.vue 一致性审计

- 源：`agent/workProject2-jht/src/views/warehose-management/examine-apply/`（index.vue 15462B + detail.vue 17715B + searchMore.vue 2162B）
- 目标：`src/views/warehouse/ExamineApply.vue`（58 行，通用 CRUD 骨架）
- 结论：**系统性错配**。源是「验货申请单」查看/审核系统（列表只读 + 查看详情，含多角色审核列）；目标是新增/编辑/删除骨架。源列表**无新增无编辑无删除**，只有查询和查看详情。

## 筛选项

| 源 | 目标 | 判定 |
|---|---|---|
| 原单号 originalNo(input) | — | 源有目标无=需补 |
| 验货申请单号 examiningNo(input) | 验货单号 applyNo(input) | 字段差异：命名 examiningNo→applyNo |
| 状态(下拉 待验货/验货中/已完成/已取消) | 状态(下拉 待验货/已验货) | 字段差异：源4值目标2值，缺「验货中」「已完成」「已取消」，虚构「已验货」 |
| 验货结果 validated(不通过/通过) | 验货结果 result(合格/不合格) | 字段差异：源 通过/不通过(0/1)，目标 合格/不合格 |
| 验货环节 section(退货入库/入库检验) | — | 源有目标无=需补 |
| 国家/地区 countryId(远程 filterable) | — | 源有目标无=需补 |
| 仓库 warehouseId(远程 filterable) | — | 源有目标无=需补 |
| 申请时间 daterange(默认近30天) | — | 源有目标无=需补 |

## 表格列

| 源列 | 目标列 | 判定 |
|---|---|---|
| 验货申请单ID examiningNo(fixed) | 验货单号 applyNo | 字段差异 |
| 状态(delFlag=1→已取消 else statusList) | 状态 taskStatus | 字段差异 |
| 原单号 originalNo(fixed) | 订单号 orderNo | 字段差异：命名不同 |
| 仓库名称 warehouseName | — | 源有目标无=需补 |
| 验货结果 result.validated | 验货结果 result | 字段差异（值域不同） |
| 验货环节 section(入库检验/退货入库) | — | 源有目标无=需补 |
| 验货要求 noted | — | 源有目标无=需补 |
| 操作人 operatorName | — | 源有目标无=需补 |
| 申请人 applicantName | — | 源有目标无=需补 |
| 申请时间 createTime | 创建时间 createTime | 一致 |
| 审核人/审核时间/审核结果(custType 0/1) | — | 源有目标无。背景：新项目单角色无 custType→源按 custType 分 4 套审核列(0/1 直营, 2 代理商, 3 仓库)，新项目应简化为单套「审核人/审核时间/审核结果」 |
| 仓库审核人/时间/结果(custType 3) | — | 同上，custType 分支列，简化即可 |
| 代理商审核人/时间/结果(custType 2) | — | 同上 |

## 操作按钮

| 源 | 权限键 | 条件 | 目标 | 判定 |
|---|---|---|---|---|
| 查询 | `warehouseDragQuery` | — | (SearchBar 内置) | 权限0接入 |
| 查看详情 | `warehouseExamineView` | — | — | 源有目标无=需补（源 detailShow 切整页详情，背景允许改弹窗） |
| — | — | — | 新增 openAdd | **目标有源无**：源列表无新增 |
| — | — | — | 编辑 openEdit | **目标有源无**：源列表无编辑 |
| — | — | — | 删除 remove | **目标有源无**：源列表无删除 |

## 子组件/子页面

- `detail.vue`（17715B）：验货申请单详细信息（申请单ID/原单号/仓库/入仓时间/状态/操作人/申请人/申请时间/审核人/审核时间/审核结果 按 custType 分支/验货环节/验货要求）+ 验货结果(渠道确认/商品属性/验货描述/验货照片/问题件照片) + 商品列表卡片 + 图片放大弹窗。**目标全缺，仅有4字段增改弹窗**
- `searchMore.vue`：更多查询（源 index 中 drawer 已注释，实际未启用）

## 评分：2/10

目标虚构了整个「新增/编辑/删除」——而源验货单列表纯只读（查询+查看）。核心的验货结果、验货照片、商品列表、多角色审核流程全缺。

## 建议 can 动作

`usePagePerms()` → `can('query')` 查询、`can('view')` 查看详情。（源列表无增删改，**不应有 add/edit/del**——当前目标的三个 CRUD 按钮属虚构，应整页重写为只读列表+查看详情。若保留审核能力可加 `can('audit')`。）
