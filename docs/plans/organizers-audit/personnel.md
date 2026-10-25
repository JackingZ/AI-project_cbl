# 人员管理 personnel 一致性核对

- 源：`agent/workProject2-jht/src/views/organizers-management/personnel/index.vue` + `personnel/components/edit-user.vue`
- 目标：`src/views/organizers/Personnel.vue`
- 一致性评分：**小差异**（含刻意简化）

## 筛选项
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 公司类型 tag | 有（typeList 按 custType 动态：SYSTEM/代理商/供应商等）| 有 custType select(CUST_TYPES) | 【刻意简化】源多层级动态，目标静态 |
| 分公司 comId（tag==='4'）| 有 | 无 | 【刻意简化】单公司(SYSTEM总部)模型 |
| 所属公司 custId select | 有（动态加载）| 有 custName select（静态 custNameOptions）| 命名差异 custId→custName；一致 |
| 所属部门 deptId el-tree-select | 有（树选择）| 有 dept select（扁平 deptOptions）| 组件差异：tree-select → 普通 select |
| 状态 select（启用中/已禁用）| 有 | 有（STATUS_OPTIONS）| 一致 |
| 关键字 key + keyType（姓名/手机/账号）| 有（input + prepend select 分类型）| 有 keyword input（占位「姓名/手机/账号」合一）| 【差异】源分类型检索，目标合并为单关键字 |
| 查询按钮 | `查询` v-permission=['queryUser'] | SearchBar 内建 search | 一致（查询按钮权限键刻意省略）|

## 顶部操作按钮
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 新增人员 | `新增` `v-permission=['addUser']` | `新增人员`(can add) | 一致（键刻意简化）|

## 表格列
| 列 | 源 prop | 目标 prop | 结论 |
|----|----|----|----|
| 姓名 | realName | realName | 一致 |
| 登录名 | username | username | 一致 |
| 手机号 | phone | phone | 一致 |
| 公司类型 | 无 | custType | 【目标多余】源表格无此列 |
| 所属公司 | custName | custName | 一致 |
| 所属部门 | deptName | deptName | 一致 |
| 所属岗位 | 无 | postName | 【目标多余】源表格无岗位列（但源表单有 postId）|
| 用户权限 | roles（数组，rolesFormatter join）| roleName（单值）| 【刻意简化】多角色→单角色 |
| 添加时间 | createTime | createTime | 一致 |
| 状态 | status(switch 1/0，admin/本人显示文本)| status(switch 启用/禁用)| 一致；值编码差异，缺少 admin/本人禁用 switch 保护 |

## 操作列
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 重置密码 | `resetPassword` `$checkPermission(['userPassword'])`，admin/本人隐藏 | `重置密码`(can edit) | 一致（键简化；缺 admin/本人保护）|
| 编辑 | `editUser` `v-permission=['editUser']`，admin/本人隐藏 | `编辑`(can edit) | 一致 |
| 删除 | `deleteUser` `$checkPermission(['deleteUser'])`，admin/本人隐藏 | `删除`(can del) | 一致 |
| 状态切换权限 | `$checkPermission(['userChangeStatus'])` | can edit（switch disabled）| 一致 |

## 新增/编辑表单（edit-user.vue → 目标 FormDrawer）
| 字段 | 源 | 目标 | 结论 |
|----|----|----|----|
| 公司类型 tag | 有(!isEdit)| 无 | 【刻意简化】|
| 分公司 comId | 有(tag==='4')| 无 | 【刻意简化】|
| 所属公司 custId/custName | 有（新增 select 动态/编辑 disabled input）| 有 disabled input「SYSTEM总部」写死 | 【刻意简化】单公司 |
| 所属部门 deptId | 有 el-tree-select | 有 deptName select（普通）| 组件差异；命名 deptId→deptName |
| 所属岗位 postId | 有 select(动态 positionList，非必填)| 有 postName select(POST_OPTIONS，必填 rules)| 命名差异；目标改为必填【差异】|
| 用户姓名 realName | 有(maxlength20)| 有 | 一致 |
| 手机号码 phone | 有(校验不能中文)| 有(phoneRule)| 一致，校验规则不同 |
| 登录账号 un/username | 有(un，校验字母开头/≥4位，编辑禁用)| 有 username(编辑禁用，仅 required)| 命名差异 un→username；缺格式校验 |
| 设置密码 pw/password | 有(pw，防自动填充逻辑，校验6-20位，编辑仍显示)| 有 password(仅 !isEdit 显示，仅 required)| 【差异】目标编辑态不含密码；缺复杂校验 |
| 强制修改密码 ifUpdatePassword | 有(!isEdit，radio 否0/是1)| 有 forceReset(!isEdit，radio 是/否 bool)| 一致；值编码差异 |
| 用户权限 roles | 有(多选 multiple，value-key=id)| 有 roleName(单选 select)| 【刻意简化】多角色→单角色 |
| 状态 status | 无（表单内无，列表 switch 控制）| 有 radio(STATUS_OPTIONS)| 【目标多余】表单新增状态字段 |

## 汇总
- 真实差异：目标表格多「公司类型/所属岗位」列；关键字检索从「分类型(姓名/手机/账号)」合并为单框；岗位由非必填改必填；密码编辑态不可改+校验弱化；表单新增「状态」字段。
- 缺失保护：源对 admin 及当前登录本人隐藏 重置/编辑/删除/状态 switch，目标未见等价保护（仅 can 权限控制）。建议确认是否需补。
- 刻意简化：公司类型/分公司/多角色/动态公司-部门联动/tree-select、大量 v-permission 键统一为 can(add/edit/del)。
