# 拖托任务 (Trailer Task) 一致性审计报告

- 源 (Vue2, 真实业务):
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/trailer-task/index.vue`
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/trailer-task/detail.vue`
- 目标 (Vue3): `D:/AICode/Vibe-Coding/cross-border-logistics-admin/src/views/warehouse/TrailerTask.vue`

## 结论 (Verdict)：大缺漏 (Major Mismatch)

评分：**2 / 10**

核心问题不是"字段少了几个"，而是**业务模型完全错位**：

1. **源是"只读工作流视图 + 打印"页面，根本没有增删改。** 源页面唯一的写操作是"打印托标"(生成条码 PDF)。目标却虚构了 `新增 / 编辑 / 删除` 一整套 CRUD——这三种操作在源业务里不存在。
2. **目标字段全是虚构的。** 目标的 `containerNo 柜号`、`driver 司机` 在源里根本没有任何对应字段。源的真实业务维度是"任务类型(入库/出库/移库/计量拖托)"、"拖托人"、"要求完成时间"，全部缺失。
3. **整块"打印托标"功能缺失**（含仓库选择、数量校验、JsBarcode + pdfMake 条码标签生成）。
4. **详情页 + 托盘明细子表完全缺失**（目标用 modal 替代跳转是已知简化，但详情里的托盘明细业务数据整块没了）。
5. **零权限集成**（源有 3 个 v-permission key）。

这是一个"通用 CRUD 骨架"套在一个"仓库拖托任务只读工作流页"上，几乎所有真实业务语义都没保真。

---

## 1. 筛选项 (Filters)

| 源字段 | 源标签 | 类型/选项 | 目标 | 分类 |
|---|---|---|---|---|
| `towageNo` | 任务单号 | input | `taskNo` 任务号 (input) | 字段差异 (命名不符, 语义近似) |
| `pickerId` | 拖托人 | input | 无 | 【源有目标无=需补】 |
| `towageMethod` | 任务类型 | select: 入库(1)/出库(2)/移库(3)/计量拖托(4) | 无 | 【源有目标无=需补】(核心业务维度) |
| `status` | 状态 | select: 待执行(1)/执行中(2)/已完成(3) | `taskStatus` 状态 select: 待处理/已完成 | 字段差异 (源3态, 目标2态且文案错误) |
| `createTime` | 创建时间 | daterange (默认近30天) | 无 | 【源有目标无=需补】 |

注：源状态是 **待执行/执行中/已完成** 三态；目标写成 **待处理/已完成** 两态，文案和枚举都错。

## 2. 表格列 (Table Columns)

| 源 prop | 源标签 | 目标 prop | 目标标签 | 分类 |
|---|---|---|---|---|
| `towageNo` | 拖托任务单号 | `taskNo` | 任务号 | 字段差异 (命名不符) |
| `status` | 状态 (待执行/执行中/已完成) | `taskStatus` | 状态 (待处理/已完成) | 字段差异 (枚举错) |
| `towageMethod` | 任务类型 (入库/出库/移库/计量拖托) | 无 | — | 【源有目标无=需补】 |
| `createTime` | 创建时间 | `createTime` | 创建时间 | 一致 |
| `expectedFinishTime` | 要求完成时间 | 无 | — | 【源有目标无=需补】 |
| — | — | `containerNo` | 柜号 | 【目标有源无】(虚构) |
| — | — | `driver` | 司机 | 【目标有源无】(虚构) |

## 3. 表单字段 (Form Fields)

源**没有新增/编辑表单**。源唯一的表单是"打印托标"弹窗：

| 源 prop | 源标签 | 说明 |
|---|---|---|
| `wh` | 仓库 | select, 必填, 来自 getWHList |
| `icount` | 数量 | input, 必填, 数字, ≤100, ≠0, 校验 validateIcount |

目标表单 (`taskNo / containerNo / driver / taskStatus`) 属于虚构的 CRUD 表单，**与源无任何对应关系**。

分类：整块【源有目标无=需补】(打印托标表单) + 整块【目标有源无】(新增/编辑表单)。

## 4. 详情字段 (from detail.vue)

目标**无详情页/无托盘明细**，整块缺失。

详情头部字段：

| 源 prop | 源标签 | 枚举 |
|---|---|---|
| `towageNo` | 拖托任务单号 | — |
| `towageMethod` | 任务类型 | 入库(1)/出库(2)/移库(3)/计量拖托(4) |
| `status` | 状态 | 待执行(1)/执行中(2)/已完成(3) |
| `createTime` | 创建时间 | — |
| `expectedFinishTime` | 要求完成时间 | — |

托盘明细子表 (tableData)：

| 源 prop | 源标签 | 枚举 |
|---|---|---|
| `towageNo` | 拖托任务单号 | — |
| `equipment` | 托盘/中转箱 | 托盘(1)/中转箱(2) |
| `palletNo` | 托盘ID/中转箱ID | — |
| `status` | 托盘状态 | 待执行(1)/执行中(2)/已完成(3) |
| `startingArea` | 起始区域 | — |
| `storageLocation` | 目的区域 | — |
| `finishTime` | 完成时间 | — |

分类：全部【源有目标无=需补】。

## 5. 操作按钮 (Actions) — 文案 / 权限 key VERBATIM / 条件 / 弹窗or跳转

源操作：

| 文案 | v-permission (VERBATIM) | 位置 | 条件 | 行为 |
|---|---|---|---|---|
| 打印托标 | `['printSupportingLabel']` | 页面左上 | 无 | 打开"打印托标"弹窗 → 选仓库+数量 → JsBarcode+pdfMake 生成条码 PDF (`onPrint`) |
| 查询 | `['warehouseMeasureQuery']` | 筛选区 | 无 | `handleSearch(1)` |
| 查看详情 | `['warehouseTowageView']` | 行操作 | 无 | 跳转/切换到 detail (`handleDetail`, `detailShow=true`) |

目标操作：

| 文案 | 权限 | 分类 |
|---|---|---|
| 新增 | 无 | 【目标有源无】(源无新增) |
| 编辑 | 无 | 【目标有源无】(源无编辑) |
| 删除 | 无 | 【目标有源无】(源无删除) |

分类：
- 打印托标 / 查看详情 【源有目标无=需补】
- 查询按钮权限缺失（目标由 SearchBar 触发, 无权限保护）
- 新增/编辑/删除 均为【目标有源无】虚构操作

**全部 v-permission key（逐字）：**
- `printSupportingLabel`
- `warehouseMeasureQuery`
- `warehouseTowageView`

## 6. 子组件 / 子页面 (Sub-components)

| 源 | 目标 | 分类 |
|---|---|---|
| `head-info` (title="拖托任务单") | 无 | 【源有目标无】(次要) |
| `detail.vue` (内嵌详情, `detailShow` 切换) | 无 (仅 CRUD modal) | 【源有目标无=需补】 |
| 打印托标 `el-dialog` (含隐藏 svg 条码模板) | 无 | 【源有目标无=需补】 |
| 依赖 `JsBarcode` / `pdfMake` / `getWHList` | 无 | 【源有目标无=需补】 |

---

## 推荐的 can() 动作 (Permission Actions)

目标权限模型为 `usePagePerms()` → `can(action)`，`hasBtn` 校验 `${route.path}:${action}`。

基于**源真实业务**（只读 + 打印，无 CRUD），本页应有的 can() 动作：

| can(action) | 对应源权限 | 用途 |
|---|---|---|
| `can('query')` 或 `can('list')` | `warehouseMeasureQuery` | 查询按钮 |
| `can('view')` | `warehouseTowageView` | 查看详情 |
| `can('print')` | `printSupportingLabel` | 打印托标 |

说明：**不建议**引入 `add / edit / del`——源业务本身没有对拖托任务的增删改，目标当前的新增/编辑/删除是虚构的。若为演示保留 CRUD，应明确标注为脱离源业务的占位，真实保真方向是"只读工作流 + 打印 + 详情(含托盘明细)"。

---

## 需补清单 (Top Gaps, 按优先级)

1. **移除虚构 CRUD**（新增/编辑/删除）或明确标注为占位——源无写操作。
2. **补真实筛选**：任务类型(入库/出库/移库/计量拖托)、拖托人、创建时间 daterange；状态改为 待执行/执行中/已完成 三态。
3. **补真实表格列**：任务类型、要求完成时间；移除虚构的 柜号/司机；`taskNo→towageNo` 语义对齐。
4. **补详情页 + 托盘明细子表**（7 列：托盘/中转箱、托盘ID、托盘状态、起始/目的区域、完成时间）。
5. **补打印托标功能**（仓库选择 + 数量≤100 校验 + 条码 PDF 生成）。
6. **接入权限**：`can('query')` / `can('view')` / `can('print')`。
