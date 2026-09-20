# 收费重量计算 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/calc-weight/index.vue` (482 行, 单文件)
- 目标: `src/views/system/CalcWeight.vue` (58 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (业务本质完全错; 源是一个计算器工具页, 根本不是列表/CRUD)

源无表格、无分页、无增删改。它是一个"输入箱规 → 按算法算出收费重量"的即时计算器。目标却做成了 规则名称/计费方式/体积系数 的列表 CRUD, 方向性错误。

---

## 1. 源真实结构 (目标全无)

顶部说明 alert: 长度CM/重量KG, 批次箱数/单箱实重/长/宽/高。

左侧 配置表单 `ruleForm`:
- 结算重量算法 `a1`: 取实重(1) / 取实重或体积重的最大值(2) / 取实重或体积重的平均值(3)
- 分泡比率(%) `bubble` (a1===2 时显示)
- 单箱最低收费重 `boxLowestWeight`
- 单票最低收费重 `orderLowestWeight`
- 多件重量算法 `a2` (a1===2 时显示): 先累加后比较(1) / 先比较后累加(2)

右侧 批次动态行 `boxForm[]` (可增删): 每行 总箱数 `beachTotal` / 单箱实重 `weight` / 单箱长度 `length` / 单箱宽度 `width` / 单箱高度 `height`; 首行"+"增行, 其余"-"删行。

底部: 计算 / 重置 按钮; 结果区展示 是否分泡 `isBubble` / 分泡前 `beforeBubble` / 分泡后 `afterbubble` / 收费重量 `estimatedWeight` / 最终结算重量 `settlementWeight`。

核心算法(体积重 = 长×宽×高/1e6 ×167; 分泡; 累加/比较等)全在 script, created 时即算一次。

## 2. 目标现状 (全部虚构, 需推翻)

- 筛选: 规则名称 `name` / 计费方式 `type`(WEIGHT_TYPES) / 状态 `status` — 均虚构
- 表格: name / type / factor / status / createTime — 虚构
- 表单: 规则名称 / 计费方式 / 体积系数 factor / 状态 — 虚构
- 新增/编辑/删除/启禁用 — 源根本没有

结论: 整页推翻重建为计算器交互页, 而非列表页。SearchBar/ProTable/Modal 这套组件都不适用。

## 3. 建议 can 动作

源无任何 `v-permission` / `$checkPermission`。此页为工具页, 通常仅需菜单可见权限, 无按钮级 can。
- 若须接权限: 仅 计算(`calc`)/重置 之类, 但源无对应键 — 可不加按钮级 can, 仅保留 menuPerms。

## 备注

这是 6 页中唯一"业务类型"整体判错的页 (工具页被做成 CRUD)。重建优先级最高但工作量相对小(单文件、纯前端计算、无接口依赖)。
