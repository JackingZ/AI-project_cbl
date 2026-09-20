# 航空号段 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/air-them-roughly/` (index 258 + allotModal 358 + importModal 332 + operationLog 104 + recoveryModal 140 + rowDetails 464 行)
- 目标: `src/views/system/AirThemRoughly.vue` (59 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (目标 name/prefix/airline 骨架, 源是"号段分配/回收/导入"库存管理, 无 CRUD 新增编辑)

源按航空公司聚合统计号段库存, 通过 分配/回收/导入 管理, 配 操作日志 与 明细钻取页。目标做成了号段名称/前缀的增删改, 业务错配。

---

## 1. 筛选项 / 顶部操作

| 源 | 目标 | 结论 |
|---|---|---|
| 分配 `showAllotModal` `v-permission=['airlineNumberAllot']` | 无 | 需补 |
| 导入 `showImportModal`(custType===0 显示, `airlineNumberImport`) | 无 | 需补(多租户条件可省) |
| 航空公司下拉 `airlinesId`(远程, change 即查) | 航空公司 `airline`(AIRLINES 通用) | 字段差异: 源远程列表 |
| 查询 `v-permission=['airlineNumberQuery']` | 无 | 需补 |
| — | 号段名称 `name`(输入) | 目标有源无(源无此筛选) |
| — | 状态 `status` 启用/禁用 | 目标有源无 |
| — | 新增 `openAdd` | 目标有源无(源无新增) |

## 2. 表格列 (目标全错配)

源列(按航空公司聚合的库存统计): 航空公司 `airlineCompany` / 总数量 `total` / 剩余数量 `surplus` / 已分配 `allocated` / 已打单 `printedOrder` / 已发运 `shipped` / 操作(操作日志/查看)。

目标列: name / prefix / airline / status / createTime — 全部虚构; 缺库存统计 5 列。

结论: 整表重写。分页仅 `total, prev, pager, next` 布局。

## 3. 操作按钮

源操作列: 操作日志 `showLog`(无键) / 查看 `showRowDetails`(无键, 切到明细页)。
目标: 编辑 / 删除(无键) — 源无编辑删除。

结论: 删掉编辑/删除, 补 操作日志/查看。

## 4. 子弹窗/子页面 (目标完全无)

- **allotModal 分配** (358 行): 分配客户 `customerId`(远程) / 预警值 `warning`(0-99%) / 动态行 航空公司 `sectionId` + 分配号段数 `num`(max=剩余) 可增删; 提交 `distribution`
- **importModal 导入** (332 行): 航空公司 `id` + Excel 文件(xlsx/xls/csv)前端解析校验(长度/中文/重复) → 导入完成内层弹窗(总数/成功/失败/失败原因) → 确认导入 `importFile`
- **operationLog 操作日志** (104 行): 表格(操作人 `operationName` / 操作描述 `describeA` / 操作时间 `operationTime`) + 分页
- **rowDetails 明细页** (464 行): 客户下拉 + 状态单选(全部99/已分配1/已打单2/已发运3) + 单号搜索; 统计条(总数/剩余/已分配/已打单/已发运) + **回收按钮 `v-permission=['airlineNumberRecovery']`**; 号段卡片网格(code + 状态点); 分页
- **recoveryModal 回收** (140 行): 回收数量 `num`(max=剩余) → `recovery`

结论: 均需补为占位弹窗/页面; 深操作(分配/导入/回收)走 demoAction; 明细页跳转已知改弹窗。

## 5. 建议 can 动作 (逐字对齐)

| 动作 | 源权限键 |
|---|---|
| 查询 | `airlineNumberQuery` |
| 分配 | `airlineNumberAllot` |
| 导入 | `airlineNumberImport` |
| 回收 | `airlineNumberRecovery` |
| 操作日志 / 查看明细 | (源无键) |
