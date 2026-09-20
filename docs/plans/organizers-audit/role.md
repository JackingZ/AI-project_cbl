# 权限设置 role 一致性核对

- 源：`agent/workProject2-jht/src/views/organizers-management/role/index.vue` + `role/components/add.vue`
- 目标：`src/views/organizers/Role.vue`
- 一致性评分：**小差异**（含刻意简化）

## 布局对比
两侧结构一致：左侧角色列表 el-menu + 右侧权限矩阵。整体框架保真。

## 筛选项
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 公司类型 select（聚货通/客户/代理商/供应商）| 有（矩阵头部）| 无 | 【刻意简化】单角色模型，无 custType 多角色筛选 |
| 服务大类 select（custType!==0 时）| 有 | 无 | 【刻意简化】同上 |

## 左侧角色列表
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 角色名 | 有 | 有 | 一致 |
| custType 标签 | 无（仅名称+图标）| 有 `el-tag {{role.custType}}` | 【目标多余】新增展示项 |
| 新增角色按钮 | `新增` 内联输入(addPermit)，仅 custId==='0' 可见 | `新增角色` 按钮 → 打开 Modal(can add) | 交互方式差异，见下 |
| 编辑 | 悬浮下拉「编辑」内联改名 `v-permission=['editPermit']` | 行内「编辑」→ Modal(can edit) | 一致（键刻意简化为 can edit）|
| 删除 | 悬浮下拉「删除」`v-permission=['deletePermit']` | 行内「删除」(can del) | 一致 |

## 右侧权限区
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 权限矩阵层级 | 三级（一级菜单/二级菜单/按钮）checkbox 树，含 indeterminate | 两级展示（模块行 + 页面行含按钮 checkbox）| 【刻意简化】三级矩阵 → menuPerms/btnPerms 两级 |
| 全选/清空 | 无 | 有 | 【目标多余】新增便捷操作 |
| 保存按钮 | `更新` `v-permission=['updatePermit']` | `保存权限`(can edit) | 一致（updatePermit 键刻意简化为 edit）|
| 超管提示 | 无 | 有 `isSuperAdmin` alert | 【目标多余】|
| 右键 editRole 编辑权限节点 | 有（@contextmenu 调 add.vue edit）| 无 | 【需补/刻意简化】随 add.vue 一并删除 |

## 角色新增/编辑表单
| 字段 | 源 | 目标 Modal | 结论 |
|----|----|----|----|
| 角色名称 name | 有（仅收集 name，内联输入）| 有 | 一致 |
| 公司类型 custType | 无（由顶部筛选带入 custType/typeId）| 有 select(CUST_TYPES) | 【目标多余/虚构】源建角色只填名称 |
| 备注 remark | 无 | 有 textarea | 【目标多余/虚构】源无此字段 |

## 权限点管理 add.vue（源独有整块功能）
源 `add.vue` 是「新增权限」= 权限点定义 CRUD（管理员维护菜单/按钮权限项本身）：
- 字段：权限类型(一级菜单/二级菜单/按钮权限 radio)、一级菜单 select、二级菜单 select、权限名称 name、权限点 alias、请求接口 urls、请求方式 mode(GET/POST/DELETE/PUT/OPTION)。
- 校验：alias 不能有中文/特殊字符。
- 触发：顶部「新增权限」按钮(custId==='0') + 矩阵右键 editRole。

目标：**完全无对应功能**，改用静态 `PERM_MATRIX` 常量。
结论：【刻意简化】权限点定义随三级矩阵改为写死配置而移除。属已知设计取舍，但为源独有的真实功能块，标注在此。

## 汇总
- 真实差异：角色表单 target 虚构了「公司类型/备注」两字段（源建角色只填 name）；target 新增 custType 标签展示、全选/清空、超管提示。
- 刻意简化：公司类型/服务大类筛选、三级→两级矩阵、add.vue 权限点管理整块、多角色模型、权限键统一为 can(add/edit/del)。
- 无遗漏源的核心操作按钮（增/删/改/保存均在）。
