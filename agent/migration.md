# 聚货通(workProject2-jht) → cross-border-logistics-admin 迁移对比文档

> 依据 `harness.md` 执行。本文件记录迁移的整体对比、范围、方案与进度，供审核追溯。
> 最近更新：2026-07-03

---

## 一、整体配置对比（技术栈迁移映射）

| 维度 | 源项目 workProject2-jht（旧） | 目标项目 cross-border-logistics-admin（新） | 迁移动作 |
|---|---|---|---|
| 构建 | Vue CLI / webpack 4 | Vite 5 | 已就绪 |
| 框架 | Vue 2.6 + TS + 类组件装饰器 | Vue 3 `<script setup>`（JS） | 每页重写，非拷贝 |
| UI | Element UI 2.x | Element Plus 2.7（按需自动引入） | 组件名/API 逐个替换 |
| 状态 | Vuex + vuex-persist | Pinia + localStorage | 重写 store |
| 路由 | vue-router 3，history 模式，11 个模块拆分文件 | vue-router 4，hash 模式，单一 index.js | 合并进单文件 |
| 样式 | scss + element-variables | scss 全局变量 vars.scss（强制引用） | 禁硬编码 |
| 请求 | axios 0.19，`src/api/*.ts` 直连后端 | axios 1.7，`src/api/modules/*.js` + 本地 mock | 无后端，全部本地 mock + 持久化 |
| 重型依赖 | echarts / vxe-table / tinymce / xlsx / v-charts 等 | 仅 vue 全家桶 + element-plus | 按需用最新包替代，多数不迁 |

**结论：逐页重写，非代码搬运。** 旧 TS 类组件无法直接复用。

---

## 二、主页面对比（Dashboard + Layout）

- **Layout 骨架**：新项目已有完整 `components/Layout/`（Sidebar 自动读路由 + Navbar + Breadcrumb + AppMain），符合 harness.md，直接沿用。
- **Dashboard 首页**：旧项目 `views/dashboard/index.vue` 是"开发进度"演示页（任务清单 + 日历 + 机构树 demo），生产分支仅显示 "Welcome back"，**并非真实看板**。新项目现有 Dashboard（统计卡片 + 订单状态分布 + 近期订单）更完整。
  - **决策：保留新项目 Dashboard，不迁移旧演示页。**

---

## 三、迁移范围：旧项目菜单树（11 模块 / ~90 页）

| # | 模块(路由) | 中文名 | 页面数 |
|---|---|---|---|
| 1 | organizers | 机构管理 | 6 |
| 2 | operation | 运营管理 | 24 |
| 3 | system | 系统管理 | 18 |
| 4 | financial | 财务管理 | 11 |
| 5 | warehouse | 仓库管理 | 11 |
| 6 | orderlist | 订单管理 | 11 |
| 7 | price | 价格管理 | 11 |
| 8 | sales | 销售管理 | 7 |
| 9 | service | 服务配置 | 7 |
| 10 | business | 业务配置 | 1 |
| 11 | operating-cost | 运营成本 | 2 |

（各叶子页明细见 `agent/migration-menu.md`，由路由模块提取。）

---

## 四、已确认的迁移决策（用户审核）

1. **现有 MVP 模块 order/logistics/user**：删除，完全对齐聚货通（旧项目无这些名字，订单在 /orderlist 下）。
2. **推进方式**：先做全量菜单骨架（11 模块占位路由 + 侧边栏）+ 完整迁移 1 个示范模块（机构管理 organizers）供审核；通过后再逐模块推进。
3. **保真度**：功能对齐 + 合理简化（保留核心字段/列/搜索/增删改查/弹窗，去冗余；本地 mock + localStorage 持久化）。

---

## 五、本轮交付内容（骨架 + 示范模块）

### 基础设施
- `src/api/persist.js`：localStorage 持久化资源工厂（列表/分页/增删改查，刷新不丢）。
- `src/router/index.js`：Dashboard + 11 模块**扁平路由**（业务页均为 Layout 直接子路由，直接在 AppMain 动态组件中渲染），模块层级由 `meta.group` 表达；未迁移页统一指向占位页。
- `src/components/Layout/AppMain.vue`：动态组件外包 **keep-alive**（`:max=20`），页面实例缓存、切换不反复销毁重建，避免重复加载。
- `src/components/Layout/Sidebar.vue`：按 `meta.group` 还原**两级菜单**（模块 → 子页，el-sub-menu）。
- `src/components/Layout/Breadcrumb.vue`：读取 `meta.groupTitle + title` 生成面包屑。
- `src/components/Common/Placeholder.vue`：未迁移页统一占位（标注"待迁移"）。

> 路由说明：初版曾用 `Passthrough` 二级路由包裹组件，会导致 keep-alive 只缓存透传壳、缓存失效。已改为扁平路由 + AppMain keep-alive，子页直接走 AppMain 动态组件。

---

## 七、页面缓存策略（keep-alive 白名单 + 激活刷新）

### 问题
1. 早期用 `Passthrough` 二级路由承载子页，AppMain 的 keep-alive 只能缓存透传壳组件，真实页面未被缓存 —— 缓存形同虚设。
2. keep-alive 全量缓存会带来两个副作用：① 占位页等无需缓存的页面也常驻内存；② 被缓存的列表页 `onMounted` 不再重跑，跨模块改动后回到列表看到的是**旧数据**。

### 解决方案（两段式）
**A. 缓存白名单（谁被缓存）**
- 路由 `meta.keepAlive: true` 标记需缓存的页面（当前：机构管理 6 页）。
- `AppMain.vue` 用 `<keep-alive :include="cachedViews" :max="20">`，`cachedViews` 由所有 `meta.keepAlive` 路由的组件 name 计算得出。
- 命中前提：页面用 `defineOptions({ name })` 声明的组件名 **必须与路由 name 一致**（如 `OrgRole`）。未标记的页面（占位页等）不缓存，每次进入自动刷新。

**B. 激活刷新 hook（缓存页如何保持数据新鲜）**
- `src/utils/hooks.js` 封装 `useActivatedRefresh(loader)`：
  - `onMounted` 首次加载一次；
  - `onActivated` 在被缓存页面**再次激活**时刷新（跳过与首次挂载重叠的那次）。
- 机构管理 6 页用 `useActivatedRefresh(loadData)` 替代 `onMounted(loadData)`：
  - 组件实例被缓存 → 保留筛选条件、滚动位置、分页等 UI 状态；
  - 数据每次进入自动刷新 → 不会看到旧数据。
- 兼顾"避免重复加载"（DOM/状态不重建）与"数据实时"（只重拉数据）。

### 已知坑：快速切换缓存页出现空白
- 现象：连续多次点击机构管理子页，页面内容突然空白。
- 原因：`<transition mode="out-in">` 包裹 `<keep-alive>` 时，快速切换会打断"离场→入场"时序，离场回调把旧节点移除后新节点未重新插入 → 空白。
- 解决（`AppMain.vue`）：
  1. 去掉 `mode="out-in"`，动画改为**仅入场**（移除 `*-leave-active/*-leave-to`），无离场阶段可被打断；
  2. `<component :is>` 加 `:key="route.path"`，稳定每个路由的 vnode 标识，避免 keep-alive 复用错乱。

### 约定（后续迁移沿用）
- 需要缓存的列表页：路由加 `meta.keepAlive: true` + 页面 `defineOptions({ name: '与路由name一致' })` + `useActivatedRefresh(loadData)`。
- 纯详情/新增等一次性页面：不加 `keepAlive`，走默认自动刷新即可。

### 示范模块：机构管理 organizers（6 页，完整功能）
- 权限设置 role / 人员管理 personnel / 部门管理 department / 客户管理 customer / 代理商管理 agent / 供应商管理 supplier
- 每页：搜索筛选 + 分页表格 + 新增/编辑弹窗 + 删除确认，全部复用全局组件（SearchBar / ProTable / Modal / PageCard），数据经 persist.js 持久化。
- 次要弹窗（已补齐，抽为全局复用组件）：
  - `components/Common/RelateStaffDialog.vue` 关联人员（财务/客服穿梭框）—— 客户/代理商/供应商复用
  - `components/Common/EnableServiceDialog.vue` 开通服务（服务大类 + 覆盖国家）—— 代理商/供应商复用
  - `components/Common/ImportDialog.vue` 批量导入（CSV 模板下载 + 前端解析入库）—— 客户使用
- `src/api/modules/organizers.js`：6 个子资源的 mock CRUD + `getStaffOptions` / `bulkImportCustomer`；persist.js 增 `bulkAdd`。

### 清理
- 删除 `views/order`、`views/logistics`、`views/user` 及对应 `api/modules/{order,logistics,user}.js`。
- Dashboard 近期订单链接重定向至 orderlist 模块。

### 订单管理 orderlist（10 页 + 录单，第二轮迁移 + 逐页对齐参考）
- 数据层：`api/modules/orderlist.js` —— 统一一份订单数据集（5 业务类型：快递/订舱/卡派/拖车/报关 + 全生命周期字段），按业务类型/阶段派生视图；persist.js 持久化（订单集 version=2，含派生列字段）。另建 `schedule-tasks` 资源派生调度任务单。
- 菜单顺序对齐参考：仓库订单 → 全程订单 → 订单签收 → 代客下单 → 报关订单 → 卡派订单 → 调度任务单 → 快递订单 → 订舱订单 → 拖车订单。
- 逐页严格对齐参考 workProject2-jht 的**表格列/筛选项/操作按钮**（不多不少），跳转统一改弹窗（录单/调度任务除外，仍走路由）：
  - 全程订单 WholeOrder（超集列 + 更多筛选抽屉 + 查看/订单审核/更多▾ 16 项深操作演示桩）
  - 仓库订单 WarehouseOrder（原单号起列 + 查看/删除/账单/流转/生成拆柜/更多▾）
  - 订单签收 OrderSign（签收视角列 + 查看/签收）
  - 代客下单 SalesmanOrder（录单状态起列 + 查看/录单跳转）+ 录单表单 SalesmanAdd（hidden 路由）
  - 报关订单 CustomsOrder（报关单号起列 + 查看/指定供应商/流转报关单/取消）
  - 卡派订单 CarOrder（原单号起列 + 调度任务跳转 + 查看/分配车辆/司机信息）
  - **调度任务单 AllocationCat（新增页，任务单号/车队/司机/车牌/状态/订单数 + 新建/查看）**
  - 快递订单 ExpressOrder（快递单号起列 + 查看/重新提交/撤单/换单/更多▾）
  - 订舱订单 BookingOrder（原单号起列 + 查看/审核/订单进度/指定供应商/账单/取消/删除）
  - 拖车订单 TrailerOrder（起运港起列 + 查看/指定供应商/分配车辆/账单/取消）
- 复用抽象：
  - `utils/hooks.js` 的 `useListQuery`、`utils/index.js` 的 `confirmThen`；新增 `demoAction(name)` —— 打印/下载/导出等深操作统一提示"演示功能，暂不支持"。
  - 全局弹窗：`OrderDetailDialog`、`AssignSupplierDialog`、`AssignVehicleDialog`（既有）+ 新增 `AuditDialog`（审核通过/拒绝）、`BillDialog`（账单信息）、`ProgressDialog`（订单进度步骤）、`DriverDialog`（司机信息）、`SwapDialog`（换单）。
  - 依赖不存在数据的筛选项（订单类型/公司类型/所属公司/FBA仓库/服务/服务条款/放货条款/服务商/一级代理商等）做成静态选项占位，保证筛选项集合与参考一致（baseMatch 仅按关键字/业务类型/状态/审核过滤，其余占位不参与真实过滤）。

---

## 六、迁移进度追踪

| 模块 | 状态 | 说明 |
|---|---|---|
| Dashboard | ✅ 保留 | 沿用新版看板 |
| 机构管理 organizers | ✅ 完成 | 6 页（含关联人员/开通服务/批量导入） |
| 订单管理 orderlist | ✅ 完成 | 10 订单视图（含调度任务单）+ 代客下单录单，逐页对齐参考 |
| 运营管理 operation | ✅ 完成 | 24 页**保真重建**（详见第十三节） |
| 系统管理 system | ✅ 完成 | 18 页 |
| 财务管理 financial | ✅ 完成 | 11 页（发票/收付款/信用/风控） |
| 仓库管理 warehouse | ✅ 完成 | 11 页作业/任务 |
| 价格管理 price | ✅ 完成 | 11 页 |
| 销售管理 sales | ✅ 完成 | 7 页 |
| 服务配置 service | ✅ 完成 | 7 页 |
| 业务配置 business | ✅ 完成 | 1 页 |
| 运营成本 operating-cost | ✅ 完成 | 2 页 |

**全部 11 个模块已迁移完成，`npm run build` 通过。**

图例：✅ 完成 / 🟡 进行中 / ⬜ 未开始（占位）

---

## 八、第三轮：剩余 9 模块（配置类）迁移方式

- **数据层**：`src/api/mockCrud.js` 的 `defineMock(key, seedFn, searchKeys)` 工厂（persist 持久化 + 字段过滤，`~` 后缀表示模糊匹配）；各模块 `src/api/modules/{operation,system,financial,warehouse,price,sales,service,business,operatingCost}.js` 用它声明实体。
- **逻辑复用**：`src/utils/hooks.js` 新增 `useListQuery`（查询/分页/keepAlive 刷新）与 `useCrudForm`（新增/编辑弹窗 + 状态切换 + 删除）——仅逻辑复用，各页面仍为独立 `.vue` 显式编写模板/列/表单（非自动渲染）。
- **页面**：每个子页一个真实 `.vue`（`defineOptions` 命名 + keepAlive 白名单），复用全局 SearchBar/ProTable/PageCard/Modal。
- 曾尝试的「配置注册表 + 单一 CrudPage 自动渲染」方案已按要求废弃。

### 菜单切换卡顿优化
- 现象：点击/切换左侧菜单，内容区出现明显迟钝。
- 原因：① mock 接口固定 300ms 延迟（每次进入列表都等 300ms loading，缓存页 onActivated 也重拉）；② 页面过渡用 `transition: all 0.2s` + `translateY`，`all` 与位移会触发额外重排/合成。
- 优化：① `api/mock.js` 默认延迟 300ms → 80ms；② `AppMain.vue` 过渡改为仅 `opacity 0.12s`（去掉 all 与 transform）。切换更跟手，数据几乎即时呈现。

### 侧边栏滚动条与展开动画
- 现象：菜单展开后 `el-aside` 出现滚动条；二级菜单展开偏慢。
- 优化（`Sidebar.vue` / `Layout/index.vue`）：
  - 菜单区改为独立滚动容器 `.menu-scroll`（内部滚动），并隐藏滚动条（`scrollbar-width:none` + `::-webkit-scrollbar{width:0}`）；`.layout-aside` 设 `overflow:hidden`，避免 aside 级滚动条。
  - 二级菜单展开/收起动画由 Element Plus 默认 0.3s 降到 0.18s（`:deep(.collapse-transition/.el-menu--inline){ transition-duration:.18s !important }`）。

## 九、角色菜单权限（按登录用户过滤菜单/页面）

参考 `workProject2-jht` 的 `meta.roles` 思路，但改为**可配置 + 本地持久化 + 按登录用户匹配**的角色-菜单映射模型（更贴合"每个角色可见菜单不同、后台可配"的需求）。

### 数据模型
- 角色记录（`jht_db_org_role`）新增 `menuPerms` 字段：该角色可见页面的完整 path 数组；`['*']` 表示全部菜单。
- 登录用户经人员台账（`org_personnel` 的 `roleName`）匹配到角色，再取该角色的 `menuPerms`。
- 权限额外持久化到 `localStorage.jht_menu_perms`，刷新后守卫无需等异步拉取即可判定，避免竞态。

### 关键改动
- `store/permission.js`（新增）：持有 `menuPerms`，提供 `loadByRole(roleName)` / `hasPerm(path)` / `setPerms` / `reset`。`hasPerm`：`/dashboard` 恒放行；未加载不拦截；`['*']` 全放行；否则白名单命中。旧缓存缺 `menuPerms` 时回退 `['*']`，避免升级后丢菜单。
- `api/modules/organizers.js`：新增 `MENU_TREE`（模块→叶子页面 path，与路由一致）供角色配置；新增 `getPersonnelByUsername`；角色种子补 `menuPerms`（超管 `['*']`，其余按业务给白名单）。
- `api/modules/auth.js`：登录按 username 查人员台账得 `roleName`（admin 固定超管，未登记默认客服专员）。
- `store/user.js`：登录后 `loadByRole`；新增 `ensurePerms`（刷新补载）；登出 `reset` 权限。
- `router/index.js`：守卫改 async，`ensurePerms` 后校验 `to.meta.activeMenu || to.path`；无权限回首页并提示。隐藏子页（如录单）按 `activeMenu` 归属其列表页判权限。
- `Sidebar.vue`：`menuList` 按 `permStore.hasPerm` 过滤，模块无可见子项则整块隐藏。
- `views/organizers/Role.vue`：权限树由按钮树改为 `MENU_TREE` 菜单树；超管显示"默认全部"提示不可编辑；保存写 `menuPerms`（仅叶子 path）；若改的是当前登录用户的角色，`setPerms` 即时刷新侧边栏；新增全选/清空。

### 演示账号（任意密码）
- `admin` 超级管理员（全部）｜`user05` 运营主管｜`user02` 客服专员｜`user03` 财务专员｜`user04` 代理商管理员。
- 注：升级后若浏览器仍存旧 `jht_db_org_role`（无 `menuPerms`），该角色会回退为全放行；如需体验分角色差异，可在角色页重新配置并保存，或清掉该 localStorage 键让种子重建。

## 十、机构管理页面与原项目一致性对齐

对照参考项目 `workProject2-jht/src/views/organizers-management/` 逐页对齐「数据(列/字段)」与「跳转方式」。

### 10.1 跳转方式对齐
- 新增共享组件 `components/Common/FormDrawer.vue`：右侧抽屉，API 与 `Modal.vue` 一致（drop-in 可替换），对齐原项目 `app-drawer` 交互。
- `Personnel.vue`、`Department.vue`：新增/编辑由居中弹窗 `Modal` 改为右侧抽屉 `FormDrawer`。
- 客户/代理商/供应商：原项目本就是 `el-dialog` 弹窗，与现状一致，保持不变。

### 10.2 权限设置重建为权限矩阵（替代第九节的菜单树方案）
- `Role.vue` 右栏由「`MENU_TREE` 菜单树」改为原项目的「三级权限矩阵」：模块(一级) → 页面(二级，分「菜单页面 / 操作权限」两栏) → 按钮(三级：查看/新增/编辑/删除/导出)，含级联勾选、全选/清空。
- 数据模型新增 `PERM_MATRIX` / `ALL_MENU_PATHS` / `ALL_PERM_IDS`（由 `MENU_TREE` 派生）。
- 关键：页面勾选写入 `menuPerms`（**登录菜单过滤逻辑不变**，第九节的 user02 限权仍有效），按钮勾选写入 `perms`；超管仍免配置、恒定 `['*']`。

### 10.3 数据完整对齐（organizers.js + 三页面）
- 地区扩展为**四级**：国家/州省/城市/**区县**（对齐原项目 countryId/stateId/cityId/countyId），`REGIONS` 加第四层，`regionAt` 产出 county。
- 客户：表格加「签署合同、关联人员、添加时间」列；表单补齐英文名称、客户编码、合作期限、添加来源、客户来源、公司规模、注册资金、销售类型、平台类型/平台、店铺链接、品牌、驰名商标等。
- 代理商/供应商：「关联人员、开通服务」改为**表格列**（显示数量，点击打开对应弹窗）；表单补齐合作期限/金额、是否请款/提货、人工审核、独立财务、域名前缀、公司类型等。
- mock 种子同步扩充全部新字段，并填充 `financeStaff/serviceStaff/services`，令数量列真实可见。

### 10.4 人员跨公司数据 + 缓存版本机制
- 问题：原 mock 人员全部 `custName:'聚货通总部'`，超管看不到其他公司人员。
- 修复：人员扩到 30 条并新增 `custType`，跨聚货通/客户/代理商/供应商分布；`Personnel.vue` 加「公司类型 / 所属公司」筛选与「公司类型」列；`getPersonnelList` 支持 custType/custName 过滤，新增 `getCustNameOptions`。
- `persist.js` 的 `createResource` 新增 `version` 参数：种子版本升级后旧 localStorage 缓存自动作废重建；personnel/customer/agent/supplier 四资源版本升至 `2`。

### 10.5 刻意保留（未完全照搬原项目）
- **人员单角色**：原项目多角色，但改多角色会破坏已验证的单角色登录/菜单过滤，故保持单角色，仅补齐所属岗位、设置密码、强制改密字段。
- **权限矩阵不含「权限点 CRUD/请求接口/请求方式」**：原项目那套是后端权限节点管理，纯前端 mock 下无意义，只保留菜单+按钮勾选。

---

## 十一、机构管理操作列纠偏 + “更多”附加信息子页面

对照原项目发现两处不一致，并补齐缺失的“更多”功能。

### 11.1 操作列纠偏（关联人员 / 开通服务）
- 问题：客户/供应商/代理商三页把「关联人员」「开通服务」既做成了表格列，又在**操作列**里重复放了同名按钮。原项目里它们**只是独立表格列**（可点击），操作列不含这两项。
- 修复：三页操作列移除「关联人员」「开通服务」按钮（表格列保持不变，点击数量仍打开对应弹窗）。
  - 客户操作列：查看 / 编辑 / **修改归属** / **审核** / 删除 / **更多**。
  - 供应商、代理商操作列：编辑 / 删除 / **更多**。

### 11.3 客户「修改归属 / 审核」（对齐原项目 editCompany / checkForm）
- 「修改归属」：小弹窗展示当前所属上级 + 下拉选新公司，`updateCustomer(id, { parentName })` 保存。上级选项 = 聚货通总部 + 全部代理商（新增 `getParentCompanyOptions`）。
- 「审核」：弹窗只读展示公司名称/国家/主体类型/营业执照，可编辑 公司类型/合作期限/**总分标识**/审核结果(待审核/已通过/已拒绝)/备注，`updateCustomer` 写回；`audit==='已通过'` 时隐藏审核按钮。
- **证件照片**：三个固定槽位（身份证正面/反面 + 营业执照），`el-upload` 本地选图（不自动上传），`FileReader` 读为 base64 存入客户记录 `certDocs.{front,back,license}`（随 localStorage 持久化），槽位缩略图展示、可删除重传、点击弹框预览；单张 ≤ 1MB。

### 11.4 机构管理按钮权限接入（perms 从"配置"到"生效"）
- 此前 10.2 的按钮 `perms` 仅可勾选保存、未在页面拦截；本次接入到机构管理 6 页。
- `store/permission.js`：`state` 增 `btnPerms`；`setPerms/loadByRole` 同步加载角色 `perms`（超管 `['*']`）；持久化 `jht_menu_perms` 增 `btns` 字段；新增 `hasBtn(id)`（未加载/`['*']` 放行，否则命中 `${path}:${action}`）。
- `utils/hooks.js`：新增 `usePagePerms(basePath?)` → 返回 `can(action)`，按当前路由 path 拼 `${path}:${action}` 调 `hasBtn`。
- `Role.vue`/`Personnel.vue`/`Department.vue`/`Customer.vue`/`Agent.vue`/`Supplier.vue`：新增/编辑/删除/查看/更多/状态开关/重置密码/修改归属/审核 等按钮加 `:disabled="!can('xxx')"`。动作映射：新增·批量导入→add，查看·更多→view，编辑·状态·修改归属·审核·重置密码→edit，删除→del。
- 展现策略：**未授权置灰禁用**（非隐藏，对齐原项目 `$checkPermission`）；超管全放行；其余角色默认拒绝，需在权限矩阵勾选保存后生效（`Role.vue` 保存本人角色时 `setPerms` 带上 perms，即时生效）。
- 其余业务模块（订单/财务等）暂未接入，后续同法用 `usePagePerms` 即可。
- 客户操作列因增至 6 项，`action-width` 由 260 调至 330。

### 11.2 “更多”附加信息子页面（对齐原项目 attachInfo.vue）
- 新增 `api/modules/organizerMore.js`：六类子记录（联系/地址/我的设置/收款/开票/文件）统一存于 `org_more` 资源，用 `ownerType(customer|supplier|agent)+ownerId+tab` 归属；含 `getMoreList/addMore/updateMore/deleteMore/setDefaultAddress`，种子为 owner 1、2 各造示例数据。
- 新增共享组件 `components/Common/MoreInfoPanel.vue`：**配置化** 6 标签页面板（`ALL_TABS` 定义每页的列与表单字段），点击「更多」在页内切换显示（列表隐藏 + 顶部「返回列表」），每标签页支持新增/编辑/删除，地址页支持「设为默认」。
- 客户隐藏「收款信息 / 开票信息」两页（`ownerOnly` 标记 + `ownerType==='customer'` 过滤），与原项目一致；供应商/代理商显示全部 6 页。
- 三页面接入：`openMore(row)` 置当前主体并展开面板；`SearchBar`/`PageCard` 加 `v-show="!moreVisible"`，面板 `@back` 收起。

---

## 十二、订单管理筛选项一致性对齐（el-input 前置下拉 + 业务联动）

对照原项目发现订单 10 页筛选区迁移时有系统性丢失，逐项纠偏。

### 12.1 el-input 前置下拉（搜索字段选择器）还原
- 问题：原项目 6 个页面（订舱/全程/订单签收/快递/报关/代客）关键字框是 `el-input` + `slot="prepend"` 内嵌"搜索字段下拉"（如订舱：原单号/SO号/柜号/提单号/航空单号），迁移时全部退化成裸 `el-input`，前置下拉丢失。
- 修复：各页恢复 Element Plus `#prepend` 插槽下拉，`query.keyField` 绑定所选字段，选项对齐原项目：
  - 订舱 BookingOrder：原单号 code / SO号 soCode / 柜号 containerNo / 提单号 billNo / 航空单号 airNo
  - 全程 WholeOrder：原单号 code / 客户名称 customerName / 快递单号 expressNo（**额外**恢复 `#append` 精准匹配开关图标 `query.exact`）
  - 订单签收 OrderSign：原单号 code / 客户名称 customerName / 柜号 containerNo
  - 快递 ExpressOrder：原单号 code / 快递单号 expressNo
  - 报关 CustomsOrder：订舱单(SO) soCode / 柜号 containerNo / 原单号 code
  - 代客 SalesmanOrder：原单号 code（原项目单项，业务编码/备注被注释，照搬单项）
- car/trailer 原页本就是纯 input（trailer 是 SO号纯框、car 无关键字下拉），保持不变。

### 12.2 关键字真实按所选字段过滤（用户确认）
- `api/modules/orderlist.js`：`kw` 单字段模糊 → 新增 `matchKeyword(o, p)`：`p.keyField` 指定则按该字段查、否则默认查 orderNo/code；`p.exact` 为真时精准相等（全程订单精准匹配开关），否则模糊包含。`baseMatch` 改用 `matchKeyword`。
- 各页 `useListQuery` 初值补 `keyField`（默认对齐原页首选项）；全程额外补 `exact: false`。

### 12.3 条件展示：只对齐业务联动，角色条件不迁（用户确认）
- 原项目大量 `v-if="custType==='0'"` 等**角色驱动**显隐（总部/代理/供应商/客户），新项目是单角色 + `menuPerms` 模型，无 `custType` 上下文 —— 按第五节"依赖不存在数据做占位"原则，**不照搬**这类角色显隐，筛选项本身保留为常显静态占位。
- **业务字段联动**（如订单状态 `:disabled="!businessType"`、prepend 选项随海运/空运变化）在新项目 mock 缺运输方式细分字段（订舱页固定大类"订舱"），亦按占位处理静态全列。
- 筛选项顺序对齐原页从左到右，关键字框置于主筛选区末尾；保留新项目 `showMore` 折叠设计承载次要筛选项。

### 12.4 补充：WarehouseOrder 关键字前置下拉 + 所属公司统一改下拉
- **WarehouseOrder 关键字**：原页 prepend 为下拉（订单号/柜号），迁移时漏做（裸 input）。已恢复前置下拉（原单号 code / 柜号 containerNo），`keyField` 真实过滤。至此 7 个订单页（订舱/全程/订单签收/快递/报关/代客/仓库）关键字前置下拉全部对齐。
- **所属公司 el-input → el-select**：原各页所属公司为纯文本输入框，与"公司类型"（下拉）不一致。数据层新增 `COMPANY_NAMES` 静态选项（占位对齐，不参与真实过滤）；Booking/Whole/Customs/Express/Trailer/Car/Warehouse 七页所属公司改为 `el-select`（clearable+filterable）。
- **OrderSign 补所属公司**：原页筛选区缺"所属公司"，按一致性要求补齐下拉（置于公司类型之后）。
- SalesmanOrder 对应项为"所属客户"（原页即如此），非公司类型/所属公司，保持不变。

---

## 十三、运营管理 24 页保真重建（对齐 workProject2-jht 源页）

### 背景
原运营 24 页为模板批量生成的通用 CRUD 骨架，字段大量虚构（如国际航线"航班号/起飞港"、汇率单表、岗位"编码/部门"），与源页真实业务模型系统性错配，且无 v-permission。用户要求**完全保真重建**（逐字段一字不差：字段集合/必填/校验文案/控件类型/操作/跳转全对齐），权限用现有 menuPerms+btnPerms（不重开 custType）。每页先出"源 vs 重建"对照表供审核。

### 数据层（api/modules/operation.js）
- 每页 mock 按源真实字段重写；`defineMock` 增 `version` 参数，种子版本升级作废旧缓存。
- 地区联动辅助 `getCountryOpts/getStateOpts/getCityOpts`（基于机构管理 REGIONS 四级树）供多页级联下拉复用。
- 单位字典 `LENGTH_UNITS/VOLUME_UNITS/WEIGHT_UNITS` + `LENGTH_TO_VOLUME`（长度联动体积）。
- 校验工具 `utils/validate.js` 增 `noChineseRule`（禁中文）、`letterRule`（纯字母+长度）。

### 分批完成（24 页，每页 npm run build 通过）
1. **轻量配置(6)**：任务单证/禁忌词语/报表定义/货币管理/国际航线/岗位设置。
2. **单位字典(4)**：机场港口(地区四级联动+详细地址/邮编)/车型(国家穿梭+尺寸+单位)/货柜/航空板。
3. **复杂配置(6)**：FBA(18字段+type条件显隐+收货公司禁用联动+状态switch确认)/报关要素(双行cn-en列+海关编码动态sections弹窗+启用状态deleted)/汇率(货币对主表+汇率历史子弹窗两级)/下单配置(服务名称弹窗+服务项目/附加服务两关联子弹窗)/文件配置(模块→类别级联+文件名称带出描述)/验货配置(16项子表单+验货比例条件显示)。
4. **树/多tab/穿梭(4)**：服务大类(公司类型多选+√--三列+服务类型子弹窗含计费区间动态行三段校验)/服务机构(四级联动+服务国家穿梭+logo base64上传+网址列)/国家省州(行政区域树+批量新增弹窗)/区域配置(4-tab 国内/城市/国家/仓库分区+穿梭)。
5. **发货向导(4)**：整柜发货(列表↔表单多视图:原单号查询→订单只读→发货计划→拖车供应商)/订单派送(两步向导 el-steps:选订单可勾选+确认)/外协发货(两步向导+补充快递/计量子弹窗+更多下拉)/分单发货(27列宽表+复合关键字prepend+更多筛选drawer 8项+两步向导+导出9项/更多9项深操作演示桩)。

### 记录的合理偏离（均因新项目机制，UI/字段/校验对齐源）
- 货币编码用 `ccode`（persist 主键 id 须数字自增）。
- 地区用名称直存（新项目无独立地区 id 体系）。
- 报关要素/报关双行表头→单行斜杠 label（ProTable 不支持 header 插槽），单元格仍双行。
- 验货配置数组字段直存（不做源逗号串转换，存储层简化）。
- 航空板 umVolume 界面无控件（源遗留必填规则）故不设该校验，字段由长度单位联动赋值。
- logo 用 FileReader base64（原型无 OSS）。
- 发货向导订单表格用占位派生订单数据（可勾选/汇总），深操作（装柜确认/报关/拖车/卡车/打托/导出/补单出库）走 demoAction 演示桩（与订单管理既定模式一致）。
- 角色驱动显隐（custType）不迁；v-permission 权限键待统一接入 usePagePerms。

### 待续
- 24 页按钮权限统一接入 `usePagePerms().can()`（未授权置灰），对齐机构管理做法。
- 逐页差异清单存于 `agent/plans/operation-migration/*.md`。

---

## 十四、机构管理 6 页一致性复审与补齐（对齐 workProject2-jht）

按"逐字段一字不差"标准重新审计示范模块机构管理，差异清单存 `agent/plans/organizers-audit/*.md`。区分【真实缺漏】(补)与【刻意简化】(多租户/custType多角色/权限键改can/tree-select→select 保持现状)。

### 审计结论(评分)
- role 小差异 / personnel 小差异 / department 小差异 / supplier 78 / agent 72 / 更多信息 72 / customer 68。

### 已补真实缺漏
- **数据层 organizers.js**：客户补 abbr/branch/certType/certNumber/licenseAddress；代理商补 certNumber/licenseAddress/domain/markPrefix/printServer/storeLink/brand/trademark；供应商补 certNumber/licenseAddress。三资源 version→3 触发旧缓存重建。
- **organizerMore.js**：4 处枚举对齐源——地址类型(办公室/客服部/提货仓库/到货仓库)、设置类型(发货人/收货人/通知人/进口商/海外代理/订舱代理/报关抬头)、收款方式(银行卡/微信/支付宝/PayPal/其它)、文件类型(身份证正反/营业执照/WCA/ITAT/NVOCC/合同/其他)；种子同步 + version→2。
- **Customer.vue**：主表单补 公司简称abbr(必填)/证件号码/证照地址/总分标识branch；删除按钮加 audit!=='已通过' 守卫；签署合同列改可点击弹窗改状态(仅已通过可点)；审核弹窗补"添加来源"可编辑。
- **Role.vue**：移除虚构的 公司类型custType/备注remark 表单项(源建角色只填 name)；角色列表 custType 标签展示保留。
- **Personnel.vue**：补 admin/本人行级保护(重置/编辑/删除/状态开关)；岗位改非必填。
- **Department.vue**：部门主管 manager 由纯文本改 el-select 多选(取人员列表)。
- **Agent.vue/Supplier.vue**：补上述新字段进表单+回填+提交；补上级公司只读展示；状态开关加二次确认。
- **MoreInfoPanel.vue**：联系信息补 英文名/传真/备注；我的设置补 证件类型/证件号码/服务国家/邮编/是否公开；收款补 账户名称/银行名/英文名/银行代码/分行代码/银行地址。

### 未改(记录待议)
- 合作期限控件语义(源 daterange vs 目标 select)、公司规模(数字 vs 档位下拉)本轮保持现状(改动影响已验证交互，风险高)。
- 上传控件(证照/文件)因原型无 OSS，沿用 base64/占位。
- 权限键未逐字复刻(既定 can() 体系)。

npm run build 通过。

---

## 十五、订单管理 10 页一致性复审与补齐（对齐 workProject2-jht）

按"逐字段"标准复审订单管理，差异清单存 `agent/plans/orderlist-audit/*.md`。commodity-audit(商品审核)源路由已注释、归属系统管理，不计订单缺漏。

### 审计结论
报关订单(大缺漏) / 全程·签收·代客·仓库(小差异) / 卡派85·快递88·订舱80·拖车82 / 调度任务单(刻意重设计)。

### 已补真实缺漏（4 类）
1. **业务类型/状态枚举语义对齐**(数据层新增各页专属常量)：TRANSPORT_TYPES(空运/海运/铁路/卡航→全程·签收)、SALESMAN_TRANSPORT(含快递→代客+录单)、WH_BIZ_TYPES(仓储/散收拼货/拆柜打托)+WH_SOURCES(客户端/专线→仓库)、CUSTOMS_ORDER_STATUS/CUSTOMS_CATEGORIES/CUSTOMS_DECLARE_TYPES(报关)。此前误用通用 BUSINESS_TYPES/ORDER_STATUS/IO_TYPES 已改。
2. **按钮权限全页接入**：11 页(含调度)接 usePagePerms().can()，动作 view/audit/sign/entry/del/cancel/bill/assign/vehicle/resubmit/revoke/swap/export/add，未授权置灰；查询/向导流程按钮不控。
3. **清理多余按钮**：代客顶部"已出"、拖车操作列"取消"(源无)移除。
4. **补缺失筛选/列/结构**：
   - 报关订单：补"按订单/按柜"radio 双模式(按柜筛选 供应商/起运国/目的国/进出口/报关状态/报检状态/柜号提单号 + 按柜表格)；getCustomsCabinets 派生；订单类别/报关类型枚举对齐。
   - 订舱：补"服务"筛选 + 5 柜态统计列(起运港提柜/已装柜/已还柜/目的港已提柜/已还柜)。
   - 拖车：补"创建时间"范围筛选。
   - 全程/签收：更多筛选补 searchMore 状态类占位下拉(入库/计量/验货/报关状态/是否发货/派送方式/报关方式)。
   - 订单签收：签收由纯确认框改为弹窗(签收时间 + 签收单上传 base64)。
   - 代客：录单按钮加"未录单才显示"条件。
5. mock 报关记录补 category、declareType 改专属枚举值，orderResource version→3 重建。

### 记录待议(未改)
- 详情弹窗统一 OrderDetailDialog，各业务专属字段(发货人/收货人/费用/多状态)缩减——弹窗简化策略。
- 快递"重新提交"降级为 demoAction(源为完整表单页)。
- 调度任务单为卡派调度视图的重设计(任务单资源)，非源逐字保真，已在页内标注。
- 深操作(打印/导出/16项更多)走 demoAction 演示桩。

npm run build 通过。

---

## 十六、系统管理 18 页一致性复审与分批补齐（对齐 workProject2-jht）

18 页审计差异清单存 `agent/plans/system-audit/*.md`。**结论:全 18 页为模板通用 CRUD 骨架,字段虚构、与源真实业务系统性错配、0 权限接入**(同运营模块初始态)。评分普遍严重错配/大缺漏(多页 12-32/100)。多页为独特业务形态(计算器/APK版本管理/权限矩阵/审核台账/号段库存/6-tab设置台)。

### 分批策略(用户定:先中小页+权限,重页后续)
- **本轮**:① 中小"列表+表单"页重建到源模型:客户评级(rating额度)、司机管理(证件/邮箱/地区/驾照/照片)、车辆管理(车牌/车型/车况/保险/尾板GPS)、岗位提成(计量方式/单位/区间阶梯/版本)、反馈(受理台只读+处理);② 全 18 页接 usePagePerms 按钮权限。
- **数据层**:system.js 对应 mock 按源字段重写(driver/car/commission/feedback/level),version 升级重建。
- **后续轮次(千行重页,整页重建+子弹窗)**:发货计划(3718行,多态页+联动筛选+生成Booking)、商品审核(审核台账+定价/认证文件/审核弹窗+双语列)、产品库(多字段+报关信息子CRUD)、航空号段(号段库存分配/回收/导入)、收费重量(计算器工具页)、计划订阅(订阅人+航线/仓库穿梭);特殊形态页(通知配置树/通知中心收件箱/通知管理关联服务/着陆页配置台/PDA APK管理/状态权限矩阵/设置6-tab台)。

### 权限键(逐字对齐源,已在各审计清单标注)
如司机 addDriver/editDriver/deleteDriver/driverChangeStatus、商品审核 queryCheck/priceCheck/execCheck、发货计划 addPlan/queryPlan/editPlan/deletePlan 等,统一映射 can(add/edit/del/view/enable/audit/handle...)。

### 第二批完成（重页 + 特殊形态页，18/18 全部重建）
- **业务重页**：收费重量(计算器工具页,算法保真移植:实重/最大值/平均值+分泡+多件累加比较)、航空号段(按航司库存统计+分配/导入/操作日志 demoAction)、产品库(审核状态+双语名/材质/用途+报关信息入口+图片上传+多字段表单)、商品审核(只读审核台账+双语列+定价/审核/认证文件 demoAction)、计划订阅(订阅人+三通知开关+三订阅内容+航线/仓库穿梭)、发货计划(订舱计划列表+派件方式/装载/状态+详情弹窗+生成订舱)。
- **特殊形态页**：通知配置(通知类型树+5通知方式复选+接收人配置)、通知中心(收件箱:类型分组+未读计数tab+批量已读+详情)、通知管理(通知项×四类客户+服务穿梭+模版)、着陆页(单表单配置台+ImgUploader图片上传+联系电话/工作时间)、PDA(APK版本管理:版本号/更新日志/apk上传/强制更新/上下线互斥/下载)、状态设置(状态-角色权限矩阵:5角色×查看/下载+排序描述)、设置(复用 MoreInfoPanel 渲染聚货通6-tab档案)。
- **共享组件**：新增 ImgUploader.vue(base64图片上传);MoreInfoPanel 增 showBack/can props(非破坏,组织管理三页不受影响);organizerMore.js 增 jht 档案 seed。
- mock 全部按源字段重写,version 升级重建。18 页全接 usePagePerms。npm run build 通过。

**系统管理 18 页全部完成逐字段对齐。** 深交互(报关子CRUD/权限矩阵保存/穿梭/APK上传/审核流)走 demoAction 演示桩(与订单管理既定模式一致)。

---

## 十七、仓库管理 11 页一致性复审与补齐（对齐 workProject2-jht）

11 页审计差异清单存 `agent/plans/warehouse-audit/*.md`(源目录名 warehose-management,拼写少一u)。结论:全 11 页模板通用CRUD骨架(~55行),与源真实仓库作业单据(卸货/计量/拖托/拆柜/调拨/出库,含扫码/明细子表/审核状态机/详情页)系统性错配,普遍大缺漏、0权限、虚构增删改。

### 本轮完成(分批:全页权限+中小页重建,4重页占位后续)
- **全 11 页接入 usePagePerms** 按钮权限。
- **7 中小页重建到源模型**(移除虚构增删改,改为源真实操作:查看详情+明细子表/审核/作业,深操作走demoAction):
  - 卸货 UnloadingApply(卸货类型/司机车牌/预计实际时间/卸货口/16字段详情+签收子表)
  - 拖托 TrailerTask(任务类型/拖托人/要求完成时间/托盘明细子表+打印托标)
  - 拆柜 CabinetRemoval(柜号/审核状态0/1/3/拆柜明细+审核弹窗)
  - 出库 OutputApply(审核状态机0-4/出库类型/服务类型/箱数体积重量/车柜型+审核/完成/导出)
  - 异常 AnomalyList(所属环节/异常类型/处理三分支 退件/增值/拒绝+批量通知)
  - 换单 TransferTask(原/新快递单号/扫码换单/文件下载)
  - 验货 ExamineApply(只读:验货结果/验货员/商品列表+照片)
- **数据层**:warehouse.js 对应 7 mock 按源字段重写(unload/trailer/removal/output/examine/anomaly/transfer),version→2 重建;新增 UNLOAD_TYPES/TOWAGE_METHODS/REMOVAL_STATUS/OUTPUT_STATUS/ANOMALY_* 等枚举。

### 后续轮次(4 千行重页,整页重建)
- 仓库配置 warehouse-config(9195行,超重配置页,多tab/子配置)、盘点 inventory-apply(2430)、计量 measure-apply(2042,含明细子表/称重/复核审核流)、调拨 moving-apply(1824,含挑单器/审核状态机)。本轮已接权限,整页业务重建待后续。

深交互(明细录入/扫码/称重/打印/导出/审核流)走 demoAction 演示桩。npm run build 通过。

---

## 十八、系统管理深交互桩补齐 + 仓库管理 4 重页重建

### 系统管理 6 页深交互(demoAction桩→真实功能)
- 发货计划:新增/编辑弹窗(落库)+生成订舱(改 ifBooking=1)。
- 产品库:报关信息二级CRUD(国家/HS编码/税率/申报品名动态行,落库 declarations,productApi version→4)。
- 商品审核:审核(通过state=1/拒绝state=2落库)+定义价格(ifPrice=1+price落库)+查看详情弹窗。
- 航空号段:分配号段(增 total/surplus落库)+查看明细弹窗。
- 保留占位(无对应mock数据/依赖文件系统):商品审核 认证文件/查看客户、航空号段 导入/操作日志。

### 仓库管理 4 千行重页重建(列表+审核状态机+详情子表做实,超深子流程占位)
- 计量 MeasureApply:审核状态机0-4 + 计量明细子表(箱号/长宽高/重量/体积) + 完成计量/复核;逐箱称重录入 demoAction。
- 盘点 InventoryApply:理论vs实盘对比(票/件/托) + 盘点明细子表(理论/实盘/差异/库位) + 完成/取消;任务分配/实盘录入 demoAction。
- 调拨 MovingApply:审核状态机(0待审/3审核中/1通过/2拒绝/4签收) + 调拨明细子表 + 新增/编辑/审核/取消/导出;明细挑单器 demoAction。
- 仓库配置 WarehouseConfig:主列表增删改+状态开关做实;8子配置tab/设置服务 demoAction 占位。
- 数据层 warehouse.js:measure/moving/inventory mock 按源字段重写(含审核状态机+明细子表),version 升级;新增 MEASURE_STATUS/MOVING_STATUS/INVENTORY_STATUS 枚举。

npm run build 通过。至此仓库管理 11 页全部重建到源模型;系统管理深交互补齐(除文件/日志类占位)。
