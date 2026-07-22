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

### 订单管理 orderlist（9 页 + 录单，第二轮迁移）
- 数据层：`api/modules/orderlist.js` —— 统一一份订单数据集（5 业务类型：快递/订舱/卡派/拖车/报关 + 全生命周期字段），按业务类型/阶段派生 9 个视图；persist.js 持久化。
- 页面（均 keepAlive）：
  - 全程订单 WholeOrder（超集列 + 审核通过/拒绝 + 取消）
  - 仓库订单 WarehouseOrder（在库/部分出库 + 删除）
  - 订单签收 OrderSign（签收动作）
  - 代客下单 SalesmanOrder（列表）+ 录单表单 SalesmanAdd（基础信息 + 可编辑商品明细表，hidden 路由，合计自动汇总）
  - 报关订单 CustomsOrder（进出口筛选 + 指派供应商）
  - 卡派订单 CarOrder（派车）
  - 快递订单 ExpressOrder（快递公司筛选 + 指派供应商）
  - 订舱订单 BookingOrder（审核 + 指派供应商 + 删除）
  - 拖车订单 TrailerOrder（派车 + 指派供应商）
- 复用抽象：
  - `utils/hooks.js` 增 `useListQuery(fetchFn, initialQuery)` —— 统一 query/list/total/loading + 查询/重置/加载 + keepAlive 刷新，消除各列表页样板。
  - `utils/index.js` 增 `confirmThen` —— 通用二次确认（取消静默返回）。
  - 全局弹窗：`components/Common/OrderDetailDialog.vue`（详情，按业务类型展示专属字段）、`AssignSupplierDialog.vue`（指派供应商，customs/express/booking/trailer 复用）、`AssignVehicleDialog.vue`（派车，car/trailer 复用）。

---

## 六、迁移进度追踪

| 模块 | 状态 | 说明 |
|---|---|---|
| Dashboard | ✅ 保留 | 沿用新版看板 |
| 机构管理 organizers | ✅ 完成 | 6 页（含关联人员/开通服务/批量导入） |
| 订单管理 orderlist | ✅ 完成 | 9 订单视图 + 代客下单录单 |
| 运营管理 operation | ✅ 完成 | 24 页基础配置 CRUD |
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
