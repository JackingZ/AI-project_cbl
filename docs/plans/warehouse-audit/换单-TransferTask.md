# 换单 TransferTask.vue 一致性审计

- 源：`agent/workProject2-jht/src/views/warehose-management/transfer-task/`（index.vue 9462B + detail.vue 2382B）
- 目标：`src/views/warehouse/TransferTask.vue`（53 行，通用 CRUD 骨架）
- 结论：**系统性错配**。源是「快递换单」扫码作业系统（扫快递单号→语音播报换单结果 right/no change/not found；另有被注释的换单记录 tab）；目标是换单号/原单号/新单号的新增/编辑/删除骨架，与源作业模式完全不同。

## 筛选项

源当前启用态（tabs 已注释，仅保留扫码）：

| 源 | 目标 | 判定 |
|---|---|---|
| 快递单号扫描框 code(input + 回车/查询，自动聚焦) | 换单号 taskNo(input) | **字段差异（模式不同）**：源是扫码作业输入框，非列表筛选 |
| — | 状态(下拉 待换单/已换单) | **目标有源无（虚构）**：源无此状态筛选 |

源被注释的「换单记录」tab 筛选（参考，未启用）：是否打印 isPrint、内容 code（前置选择：原单号/箱号/快递单号）。

## 表格列

源当前启用态**无列表**（仅扫码框）。源「换单记录」tab（已注释）列 + detail.vue 列供参考：

| 源(换单记录 tab，已注释) | 目标列 | 判定 |
|---|---|---|
| 原单号 orderNo | 原单号 orderNo | 一致（但源该 tab 未启用） |
| 总件数 total | — | 源有目标无 |
| 已打印 print | — | 源有目标无 |
| 未打印 unprint | — | 源有目标无 |
| — | 换单号 taskNo | **目标有源无（虚构）** |
| — | 新单号 newNo | **目标有源无（虚构）** |
| — | 状态 taskStatus | **目标有源无（虚构）** |
| — | 创建时间 createTime | **目标有源无** |

detail.vue（换单明细）列：原单号 orderNo / 箱号 pkgNo / 快递单号 trackingNo1 / 新快递单号 trackingNo(可点击下载文件) / 是否打印 ifScan(是/否) / 打印时间 scanTime。**目标全缺**

## 操作按钮

| 源 | 权限键 | 条件 | 目标 | 判定 |
|---|---|---|---|---|
| 查询(扫码触发换单) | 无 | code 非空 | — | 源有目标无=需补（核心作业按钮） |
| 查看(换单记录行→detail，已注释) | 无 | — | — | 源该功能未启用 |
| 新快递单号下载文件(detail 行) | 无 | row.imagePath 存在 | — | 源有目标无 |
| — | — | — | 新增 openAdd | **目标有源无（虚构）** |
| — | — | — | 编辑 openEdit | **目标有源无（虚构）** |
| — | — | — | 删除 remove | **目标有源无（虚构）** |

> 注：源 transfer-task 全文无 v-permission，权限键需目标侧新建。

## 子组件/子页面

- `detail.vue`：换单明细表（原单号/箱号/快递单号/新快递单号可下载/是否打印/打印时间），通过 detailShow 切换显示——目标全缺
- 源特色：`play(text)` 语音播报（SpeechSynthesisUtterance）、扫码框自动聚焦（document click 重聚焦）——目标全缺

## 评分：2/10

源是扫码换单作业页（输入快递单号→后端返回文件/结果→语音播报），目标却做成 换单号/原单号/新单号 的静态 CRUD 表。作业模式、语音、文件下载、换单明细全缺；换单号/新单号/状态列均为虚构。

## 建议 can 动作

`usePagePerms()` → `can('swap')` 执行换单（扫码/查询）、`can('view')` 查看换单明细、`can('download')` 下载新快递面单、`can('record')` 查看换单记录。（源无增删改，不建议 add/edit/del；应重写为扫码作业页或换单记录列表。）
