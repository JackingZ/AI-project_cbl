# 部门管理 department 一致性核对

- 源：`agent/workProject2-jht/src/views/organizers-management/department-management/index.vue` + `components/edit-department.vue`
- 目标：`src/views/organizers/Department.vue`
- 一致性评分：**小差异**

## 筛选项
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 部门名称过滤 | 无（源无搜索栏，直接树表）| 有 keyword input(前端过滤)| 【目标多余】新增过滤 |

## 顶部操作按钮
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 新增 | `新增` `v-permission=['addDept']` | `新增部门`(can add) | 一致（键简化）|

## 表格列
| 列 | 源 prop | 目标 prop | 结论 |
|----|----|----|----|
| 部门名称 | name（树表 row-key，default-expand-all）| name（buildTree 树，含 OfficeBuilding 图标）| 一致 |
| 英文名称 | 无（表格列无，表单有 alias）| alias | 【目标多余】源表格无此列 |
| 部门主管 | 无（表格列无，表单有 managers）| manager | 【目标多余】源表格无此列 |
| 添加时间 | createTime | createTime | 一致 |
| 状态 | 注释掉（源代码注释了 status switch）| 无 | 一致（均无）|

## 操作列
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 新增下级 | 无（源仅顶部新增，靠上级部门选择归属）| `新增下级`(can add) | 【目标多余】新增便捷入口 |
| 编辑 | `editDept` `v-permission=['editDept']`，deptId===本部门时隐藏 | `编辑`(can edit) | 一致（缺本部门隐藏保护）|
| 删除 | `deleteDept` `v-permission=['deleteDept']`，deptId===本部门时隐藏 | `删除`(can del) | 一致（缺本部门隐藏保护）|

## 新增/编辑表单（edit-department.vue → 目标 FormDrawer）
| 字段 | 源 | 目标 | 结论 |
|----|----|----|----|
| 所属公司 custName | 有（disabled input，取 UserModule.custName）| 有（disabled input 写死「SYSTEM总部」）| 一致（刻意简化单公司）|
| 上级部门 parentId | 有 el-tree-select（不能选自己，isEdit===2 禁用）| 有 el-tree-select(parentOptions 带「顶级部门」根，必填)| 一致；目标必填 |
| 部门名称 name | 有(maxlength50，必填)| 有(必填)| 一致 |
| 英文名称 alias | 有(maxlength50，校验不能中文)| 有(无中文校验)| 一致；缺中文校验 |
| 部门主管 managers | 有 select **多选**(collapse-tags，动态 getUserList 人员列表)| 有 manager **input** 纯文本 | 【差异】源为多选人员下拉，目标退化为文本框，且命名 managers→manager |
| 备注信息 remark | 有(maxlength100)| 有 textarea | 一致 |

## 汇总
- 真实差异：
  1. 部门主管 managers：源是「多选人员下拉」(绑定用户列表)，目标改为「纯文本 input」manager，语义退化。
  2. 目标表格多「英文名称/部门主管」两列（源仅名称+时间）。
  3. 目标新增「部门名称过滤」搜索、「新增下级」按钮。
- 缺失保护：源对当前用户所属部门(deptId===row.id)隐藏编辑/删除，目标未见等价保护。
- 刻意简化：单公司(SYSTEM总部)、v-permission 键统一为 can(add/edit/del)。
- 无源核心操作遗漏（增/删/改齐全）。
