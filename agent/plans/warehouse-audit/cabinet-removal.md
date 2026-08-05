# 拆柜任务 (Cabinet Removal / Devanning) 一致性审计

- **SOURCE (Vue2 真实业务)**:
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/cabinet-removal/index.vue` (列表页, 261 行)
  - `D:/AICode/Vibe-Coding/cross-border-logistics-admin/agent/workProject2-jht/src/views/warehose-management/cabinet-removal/detail.vue` (详情页, 616 行)
- **TARGET (Vue3)**: `D:/AICode/Vibe-Coding/cross-border-logistics-admin/src/views/warehouse/CabinetRemoval.vue` (通用 CRUD 骨架, 53 行)

## 结论 (Verdict): 大缺漏 (Major Gaps)

**理由**: 源页面本质是「只读列表 + 明细审核流」业务模型，核心价值在 detail.vue 的**拆柜明细列表 + 编辑(实拆件数/托盘数) + 审核工作流(通过/拒绝)**。目标页面把它做成了泛化的「新增/编辑/删除」CRUD 骨架，**完全没有明细、没有审核流、没有详情页、没有权限集成**。业务性质被整体替换，而非字段级差异。评分约 **20/100**。

---

## 1. 筛选项 (Filters)

| 字段 | 源 (index.vue) | 目标 | 分类 |
|---|---|---|---|
| 柜号 | `searchForm.cabinetNo` input, placeholder「柜号」 | 无 (目标用 `taskNo` 任务号) | 字段差异 (源无 taskNo；柜号才是主检索键) |
| 状态 | `searchForm.status` select，**3 态**: 待拆柜(0)/拆柜中(1)/已完成(2) | select **2 态**: 待拆柜/已拆柜 | 字段差异 (枚举值/数量不符) |
| 申请时间 | `searchForm.applyTime` daterange，**默认近 30 天**，转 start/end | 无 | **源有目标无=需补** |
| 任务号 | 无 | `query.taskNo` input | 目标有源无 |

## 2. 表格列 (Table Columns)

| 列 | 源 prop/label | 目标 | 分类 |
|---|---|---|---|
| 拆柜任务单ID | `id` /「拆柜任务单ID」 | 无 (目标 taskNo) | 字段差异 |
| 状态 | `status` (映射 待拆柜/拆柜中/已完成) | `taskStatus` (待拆柜/已拆柜) | 字段差异 (枚举不符) |
| 柜号 | `cabinetNo` /「柜号」 | `containerNo` /「柜号」 | 字段差异 (命名 cabinetNo vs containerNo) |
| 仓库名称 | `warehouse.name` /「仓库名称」(嵌套对象) | `warehouse` /「仓库」(纯字符串) | 字段差异 |
| 下单客户 | `buyer.name` /「下单客户」 | 无 | **源有目标无=需补** |
| 客户名称 | `buyer.name` /「客户名称」 | 无 | **源有目标无=需补** (注: 源两列同取 buyer.name) |
| 创建时间 | `createTime` | `createTime` | 一致 |
| 操作 | 「查看详情」→ 跳详情 | 「编辑」「删除」 | 字段差异 (源无编辑/删除, 目标无查看详情) |

## 3. 表单字段 (List-level Form)

**源在列表页无新增/编辑/删除表单** — 目标的整套「新增/编辑弹窗 (taskNo/containerNo/warehouse/taskStatus)」在源中**无对应业务**。

| 字段 | 源 | 目标 | 分类 |
|---|---|---|---|
| 新增/编辑弹窗 | 无 (列表只读) | taskNo/containerNo/warehouse/taskStatus | **目标有源无** (虚构 CRUD) |

真正的表单编辑在 **detail.vue 的明细行编辑弹窗** (见第 5 节)。

## 4. 详情字段 (detail.vue) — 目标完全缺失

### 4a. 详情头部表单 (form)
| 字段 | 源 |
|---|---|
| 拆柜任务单ID | `form.id` |
| 柜号 | `form.cabinetNo` |
| 仓库名称 | `form.warehouse.name` |
| 下单客户 | `form.buyer.name` |
| 客户名称 | `form.buyer.name` |
| 创建时间 | `form.createTime` |
| 完成时间 | `form.actualTime` |

### 4b. 拆柜明细列表 (tableList) — 业务核心，目标 100% 缺失
| 列 | prop / 取值 |
|---|---|
| 原单号 | `code` (fixed left) |
| 状态 | `status`: 待审核(0)/审核中(1)/审核通过(2)/审核拒绝(3)；status===3 显示红点 tooltip 提示 `reason` |
| 目的地 | `deliverAddress.addressCode || deliverAddress.address` |
| 省份 | `deliverAddress.stateName` |
| 总体积 | `singleVolume` m³ |
| 总重量 | `singleWeight` + `$fomatWeight(um.umWeight)` |
| 总货值 | `singleValue` + `um.currencyId` |
| 总件数 | `single` |
| 实际件数 | `realPiece` |
| 预计托数 | `estimatePallet` |
| 实际托数 | `realPallet` |
| 备注 | `remarks` |
| 操作 | 编辑 / 审核 (见第 5 节) |

**分类: 源有目标无=需补 (整块)**。这是拆柜业务的实际价值所在。

## 5. 操作按钮 (逐字文案 / 权限 key / 条件 / 弹窗)

| 位置 | 文案 | 权限 (VERBATIM) | 条件 | 行为 |
|---|---|---|---|---|
| 列表-操作列 | 查看详情 | 无 | 无 | `handleDetail` → `detailShow=true` 内联切换详情 (非路由跳转) |
| 详情-明细行 | 编辑 | `$checkPermission(['RemovalEdit'])` | 无 | 弹「编辑」dialog |
| 详情-明细行 | 审核 | `$checkPermission(['RemovalAudit'])` | `[0, 1, 3].includes(scope.row.status)` | 弹「审核」dialog |
| 编辑弹窗-footer | 取 消 | — | — | `cancel` |
| 编辑弹窗-footer | 仅保存 | — | — | `save(1)` → saveTaskDetails, flag=false |
| 编辑弹窗-footer | 提交审核 | — | — | `save(2)` → saveTaskDetails, flag=true |
| 审核弹窗-footer | 取 消 | — | — | `cancel` |
| 审核弹窗-footer | 确 认 | — | — | `audit(true)` → auditRemoval |

**编辑弹窗字段**: 实拆件数 `num` (必填 input-number), 托盘数量 `realPallet` (必填 input-number), 备注 `remarks` (textarea)。
**审核弹窗字段**: 审核结果 radio `通过(2)/拒绝(3)`; 拒绝原因 `remarks` (仅 realPallet==='3' 时显示, 必填校验)。

**提取的全部权限指令 (VERBATIM)**:
- `$checkPermission(['RemovalEdit'])`
- `$checkPermission(['RemovalAudit'])`

目标页面 **无任何权限集成** (新增/编辑/删除按钮全裸露)。

## 6. 子组件 / 子页面

| 项 | 源 | 目标 | 分类 |
|---|---|---|---|
| detail.vue 子页面 | 有 (内联 v-show 切换, 含明细/编辑/审核) | 无 | **源有目标无=需补** (已知简化: 详情改弹窗, 但明细+审核流仍需承载) |
| head-info | 有 (标题「拆柜任务单」) | 无 | 目标有源无差异 (非关键) |

---

## 推荐 can() actions

目标权限模型 `usePagePerms()` → `can(action)` (`${route.path}:${action}`)。基于源真实业务，本页应支持：

| can(action) | 对应源权限/操作 | 用途 |
|---|---|---|
| `can('view')` | 列表「查看详情」 | 进入拆柜明细 |
| `can('edit')` | `RemovalEdit` (明细行「编辑」) | 编辑实拆件数/托盘数/备注 → 仅保存 / 提交审核 |
| `can('audit')` | `RemovalAudit` (明细行「审核」) | 审核通过/拒绝 (条件 status∈[0,1,3]) |

> 说明: 源列表页无 add/edit/del 权限点，目标现有的 `add/edit/del` 通用 CRUD **无源业务依据**。若保留 skeleton，可保留 `add/edit/del`；但要保真对齐，核心应补 `view/edit/audit`，并把「编辑=明细行编辑弹窗」「审核=审核弹窗」落到详情/明细层。

## 补齐优先级
1. **[P0]** 拆柜明细列表 (13 列) + 明细「编辑」弹窗 (实拆件数/托盘数/备注, 仅保存/提交审核) + 「审核」弹窗 (通过/拒绝/拒绝原因) — 业务核心。
2. **[P1]** 状态枚举改 3 态 (待拆柜/拆柜中/已完成); 明细状态 4 态 (待审核/审核中/审核通过/审核拒绝, 拒绝红点 tooltip)。
3. **[P1]** 筛选补 柜号(cabinetNo) + 申请时间 daterange(默认近30天); 列补 下单客户/客户名称。
4. **[P2]** 权限集成 `can('view'/'edit'/'audit')`。
