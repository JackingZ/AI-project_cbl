# 计量申请单 (MeasureApply) 保真审计报告

- **SOURCE (Vue2, 真实业务)**:
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/measure-apply/index.vue` (695 行, 列表页)
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/measure-apply/detail.vue` (1158 行, 详情/计量作业页)
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/measure-apply/searchMore.vue` (191 行, 高级筛选)
- **TARGET (Vue3, 待审计)**: `D:/AICode/Vibe-Coding/cross-border-logistics-admin/src/views/warehouse/MeasureApply.vue` (55 行)

## 结论 (Verdict): 大缺漏 (Major Gap)

**评分: 约 15/100**

Target 是一个通用 CRUD 骨架 (新增/编辑/删除 一张扁平表)。Source 是一个真实的**仓库计量作业单据系统**：列表 + 详情作业页 + 逐箱/批量/打托扫码称重录入 + 计量明细子表 + 完成计量 + 计量复核审核流 + Excel 导入/导出 + 复测创建。Target 缺失了核心业务模型的绝大部分：

1. **实体建模完全错误**：计量单是"作业单据"，不是可随意新增/编辑/删除的实体。Source 没有通用"新增计量单/删除计量单"，而是"创建复测"、"查看详情后进入计量作业"。Target 的 新增/编辑/删除 三个通用按钮在业务上都不成立。
2. **缺失详情页整层**：Source detail.vue 承载了全部核心业务（计量明细子表、扫码称重、完成计量、复核）。Target 无详情页（已知简化用 modal 替代，但当前 modal 只编辑 5 个扁平字段，未承载任何明细/称重业务）。
3. **缺失计量明细子表 (measure detail items)**：箱号/托盘、逐箱长宽高重量录入、体积重/重量体积计算——整块业务缺失。
4. **缺失审核/工作流**：完成计量、计量复核提交、复核审核结果——全部缺失。
5. **无权限集成**：Source 有 5 个 v-permission key，Target 完全没有 can() 集成。

---

## 1. 筛选项对比

| 字段 | 源(index/searchMore) | 目标 | 分类 |
|---|---|---|---|
| originalNo 原单号 | ✅ input (index) + searchMore | ❌ | 【源有目标无=需补】 |
| measureId 计量申请单ID | ✅ input (index) + searchMore | ❌ | 【源有目标无=需补】 |
| measureMethod 计量方式 (逐箱1/批量2/打托3) | ✅ select | ❌ | 【源有目标无=需补】 |
| measureStatus 计量状态 (待计量/计量中/已计量/已取消) | ✅ select | 部分 (taskStatus 仅 待计量/已计量) | 【字段差异】源4态、目标2态且缺"计量中" |
| countryId 国家/地区 | ✅ select (远程 filterable) | ❌ | 【源有目标无=需补】(已知单角色可简化) |
| warehouseId 仓库 | ✅ select (远程, 联动国家) | ❌ | 【源有目标无=需补】 |
| applyTime 申请时间区间 | ✅ daterange (默认近30天) | ❌ | 【源有目标无=需补】 |
| applyNo 计量单号 | ❌ (源无此名) | ✅ input | 【目标有源无】(等价于 measureId/originalNo, 命名不一致) |
| warehouseName 仓库名称 | ✅ searchMore input | ❌ | 【源有目标无】 |
| custName 客户名称 | ✅ searchMore input | ❌ | 【源有目标无】(单角色可简化) |
| secondaryMesaure 是否二次计量 | ✅ searchMore select | ❌ | 【源有目标无】 |
| requireTime 要求完成时间 | ✅ searchMore datetime | ❌ | 【源有目标无】 |
| actualMeasureTime 实际完成时间 | ✅ searchMore datetime | ❌ | 【源有目标无】 |
| applicant 申请人 | ✅ searchMore input | ❌ | 【源有目标无】 |

## 2. 表格列对比

Source 列表 15 列，Target 6 列。

| 列 (prop / label) | 源 | 目标 | 分类 |
|---|---|---|---|
| measureId 计量申请单ID | ✅ (fixed left) | applyNo 计量单号 | 【字段差异】命名不同 |
| measureStatus 计量状态 (含 delFlag=1→已取消) | ✅ (fixed left) | taskStatus 状态 | 【字段差异】源含取消态映射 |
| originalNo 原单号 | ✅ (fixed left) | ❌ (目标有 orderNo 订单号) | 【字段差异】orderNo vs originalNo |
| warehouseName 仓库名称 | ✅ | ❌ | 【源有目标无=需补】 |
| custName 客户名称 | ✅ | ❌ | 【源有目标无】(单角色可简化) |
| measureMethod 计量方式 | ✅ (逐箱/批量/打托) | ❌ | 【源有目标无=需补】 |
| expectedMeasureTime 要求完成时间 | ✅ | ❌ | 【源有目标无=需补】 |
| actualMeasureTime 实际完成时间 | ✅ | ❌ | 【源有目标无=需补】 |
| executorName 操作人 | ✅ | ❌ | 【源有目标无=需补】 |
| applicant 申请人 | ✅ | ❌ | 【源有目标无=需补】 |
| createTime 申请时间 | ✅ | ✅ 创建时间 | 【一致】 |
| secondaryMesaure 是否需二次计量 | ✅ (是/否) | ❌ | 【源有目标无=需补】 |
| measureReviewAuditor 计量复核审核人 | ✅ | ❌ | 【源有目标无=需补】 |
| measureReviewTime 计量复核审核时间 | ✅ | ❌ | 【源有目标无=需补】 |
| measureReviewResults 计量复核审核结果 | ✅ | ❌ | 【源有目标无=需补】 |
| relatedMeasuerId 关联计量申请单号 | ✅ | ❌ | 【源有目标无=需补】 |
| weight 重量(kg) | ❌ | ✅ | 【目标有源无】(列表无此列, 实际重量在明细汇总) |
| volume 体积(m³) | ❌ | ✅ | 【目标有源无】(同上) |
| 操作列 | ✅ 查看详情 / 导出Excel | ✅ 编辑 / 删除 | 【字段差异】操作语义完全不同 |

## 3. 表单字段对比 (弹窗)

Source 的列表页弹窗仅一个「复测」弹窗（单字段 code 原单号）；真正的表单在 detail.vue 的计量录入弹窗里。Target 弹窗是通用增改表单。

| 弹窗 | 源 | 目标 |
|---|---|---|
| 复测创建 | ✅ 「复测」弹窗: code 原单号 (校验 8-20位字母数字下划线中划线) | ❌ |
| 通用增改 (applyNo/orderNo/weight/volume/taskStatus) | ❌ 源无此形态 | ✅ 但业务不成立 |
| 计量录入(逐箱扫码) 见 §4 | ✅ | ❌ |

**结论**：Target 表单字段与 Source 无对应关系。Source 没有"手动新增一条计量单/编辑重量体积"的业务；重量体积由明细逐箱录入后汇总得出。

## 4. 详情字段对比 (detail.vue — 核心缺漏)

Target **无详情页**。Source detail.vue 是整个功能的核心，Target 完全缺失以下全部内容：

### 4.1 详情表单字段 (只读展示)
measureId 计量申请单ID、originalNo 原单号、warehouseName 仓库名称、enterTime 入仓时间、measureMethod 计量方式、secondaryMesaure 是否二次计量、measureStatus 计量状态、expectedMeasureTime 要求完成时间、actualMeasureTime 实际完成时间、executorName 操作人、applicant 申请人、createTime 申请时间、measureReviewResults 计量复核审核结果、measureReviewAuditor 计量复核审核人、measureReviewTime 计量复核审核时间、relatedMeasuerId 关联计量申请单号。

### 4.2 汇总统计块
- 理论: totalNumber 理论总件数、totalVolume 理论总体积(m³, 经 $volumeConversion CBCM→CBM)、totalWeight 理论总重量(kg)
- 实际: actualNumber 总件数、actualVolume 总体积(m³)、actualWeight 总重量(kg)、volumeWeight.wv 总重量体积、volumeWeight.volumeWeight 总体积重

### 4.3 计量明细子表 (measure detail items) — 【重大缺漏】
列: 选择框、measureType 类型(逐箱/批量/打托)、boxCode 箱号/托盘ID、weight 重量(kg 行内可编辑)、length 长(cm)、wigth 宽(cm)、height 高(cm)、girth 围长、weightVolume 体积重(条件显示)、wv 重量体积(条件显示)、empName 计量人、createTime 计量时间、操作(编辑/保存/删除)。带分页。

### 4.4 计量录入弹窗 (2 个)
- **机器/扫码逐箱弹窗 (machineForm)**: boxCode 箱号、weight 重量、length 长度、wigth 宽度、height 高度；回车逐字段聚焦(枪扫流)，连续录入模式。
- **手动新增/编辑弹窗 (dialogForm)**: boxCode(校验无中文特殊字符)、weight/length/wigth/height(均必填)。
- **卸货申请单号弹窗 (disChargeNo)**: 扫描/填入卸货申请单号。

## 5. 操作按钮对比 (含 v-permission VERBATIM)

### Source 全部 v-permission key (逐字提取)
| 位置 | 文案 | v-permission key | 条件 | 行为 |
|---|---|---|---|---|
| index 搜索区 | 查询 | `warehouseDischargeQuery` | 无 | handleSearch(1) |
| index 搜索区 | 导出 | `exportMeasureList` | 无 | exportData (整表导出xlsx) |
| index 操作列 | 查看详情 | `warehouseMeasureView` | 无 | handleDetail→进入详情页 |
| index 操作列 | 导出Excel | `warehouseMeasureExport` | 无 | handleExport (单行导出xls) |
| index 顶部 | 创建复测 | (无 v-permission) | 无 | handleTest→复测弹窗 |
| detail 头部 | 完成计量 | (无) | `form.measureStatus !== 3` | handleComplate (校验件数一致后 updateStatus) |
| detail 明细区 | 开始计量 | (无) | 无 | handleRowBegin (扫码逐箱弹窗) |
| detail 明细区 | 新增 | (无) | 无 | handleRowAdd (手动新增明细) |
| detail 明细区 | 批量删除 | (无) | 无 | handleBatchDelete |
| detail 明细区 | 批量导入 | (无) | `custType === '3'` | uploadFile (Excel导入) |
| detail 明细行 | 编辑/保存/删除 | (无) | isEdit 切换 | 行内编辑明细 |

> 注: source 全项目仅使用 `v-permission` 指令 (Vue2)，共 **4 个 key**: `warehouseDischargeQuery`、`exportMeasureList`、`warehouseMeasureView`、`warehouseMeasureExport`。detail.vue 内的作业按钮无权限指令。另有未接线的空方法: handlePrint 打印、handleRefuse 拒绝、handlePass 通过、handleSubmit 提交结果、handleRecheck 计量复核(有确认弹窗文案"确定需要进行计量复核吗？…")。

### Target 按钮
| 文案 | 权限 | 分类 |
|---|---|---|
| 新增 | 无 can() | 【目标有源无】业务不成立 |
| 编辑 | 无 can() | 【目标有源无】业务不成立(源为查看详情) |
| 删除 | 无 can() | 【目标有源无】业务不成立 |

**结论**: 操作按钮语义完全错配。Source 是"查看/导出/复测/计量作业/复核"，Target 是"增/删/改"。

## 6. 子组件/子页面对比

| 组件 | 源 | 目标 |
|---|---|---|
| detail.vue 详情作业页 | ✅ (1158 行, 核心) | ❌ 完全缺失 |
| searchMore.vue 高级筛选 | ✅ (14 项高级筛选) | ❌ 缺失(部分基础筛选可覆盖) |
| head-info 页头 | ✅ | ❌ |
| 复测弹窗 | ✅ | ❌ |
| 明细录入弹窗×2 (扫码/手动) | ✅ | ❌ |
| 卸货单号弹窗 | ✅ | ❌ |

---

## 权限建议 (Target 权限模型 usePagePerms → can(action))

Target 页面 `route.path` 下 hasBtn 检查 `${route.path}:${action}`。按 Source 业务语义，建议本页需要以下 can() action:

| can(action) | 对应源按钮 / 业务 | 用途 |
|---|---|---|
| `can('view')` | 查看详情 (`warehouseMeasureView`) | 进入计量作业详情 |
| `can('export')` | 导出 / 导出Excel (`exportMeasureList` / `warehouseMeasureExport`) | 列表导出 + 单行导出 |
| `can('measure')` | 开始计量 / 新增明细 / 完成计量 | 计量作业录入(逐箱/批量/打托)与完成 |
| `can('recheck')` 或 `can('audit')` | 计量复核 / 完成计量审核 | 复核提交/审核结果 |
| `can('repeat')` 或 `can('add')` | 创建复测 (handleTest) | 创建复测单 |
| `can('import')` | 批量导入 (custType==='3') | Excel 批量导入明细 |
| `can('del')` | 明细批量删除 / 行删除 | 删除计量明细行(非删单据) |

> 注意: Source 无"删除整张计量单"操作，Target 当前的 `del`(删单据) 语义不成立；如保留应改为删除计量明细行。当前 Target 完全无 can() 集成，需按 CarManagement.vue 模式补 `const { can } = usePagePerms()` 并在各按钮加 `:disabled="!can('...')"`。

## 修复建议摘要
1. 重建为「列表 + 详情作业」双层结构，详情页承载计量明细子表 + 扫码称重录入 + 完成计量 + 复核。
2. 列表列补齐至 Source 15 列(计量方式/操作人/申请人/复核审核三字段/关联单号/是否二次计量等)。
3. 筛选补齐 measureMethod、warehouseId、applyTime 区间(默认近30天)、measureStatus 4态。
4. 操作按钮改为「查看详情 / 导出 / 创建复测」，去掉通用增删改。
5. 集成 usePagePerms，接线上述 can() actions。
