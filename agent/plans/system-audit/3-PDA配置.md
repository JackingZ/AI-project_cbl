# PDA配置 PdaConfig 一致性核对

- 源：`agent/workProject2-jht/src/views/system-management/pda-config/index.vue`（Vue2，页标题实为「PDA版本管理」）
- 目标：`src/views/system/PdaConfig.vue`（Vue3 通用 CRUD 骨架）
- 源权限键：`addStock`(新增) / `queryStock`(查询) / `PDALoadAPK`(下载apk) / `stockChangeStatus`(上下线) / `deleteStock`(删除)；路由 role `versionManagement`
- 一致性评分：**严重错配**（源是 APK 版本管理，目标是通用键值配置列表）

## 结论速览
源标题虽叫「PDA配置」，实为 **PDA App 版本管理**：新增版本（版本号 + Markdown 更新日志 + 上传 apk + 是否强制更新）、按发布时间查询、下载/复制 apk 链接、上线/下线开关（唯一线上版）、查看更新日志、删除。目标做成了「配置项 键/值」通用 CRUD，**业务实体（版本/apk/日志）全部丢失**。需整页重写。

## 筛选项
| 项 | 源 | 目标 | 结论 |
|----|----|----|----|
| 发布时间 daterange | 有（默认近30天，不可清空）+ 查询按钮 `queryStock` | 无 | 【源有目标无=需补】|
| 配置项 name 输入 | 无 | 有 | 【目标虚构】|
| 状态 select | 无 | 有 | 【目标虚构】|

## 表格列
| 列 | 源 prop | 目标 | 结论 |
|----|----|----|----|
| 版本号 | `versions` | 无（有 name/ckey/cvalue）| 【源有目标无=需补】|
| 发布时间 | `createTime` | 无 | 【需补】|
| 下载 apk | 按钮「下载apk」(`PDALoadAPK`) + 「复制下载链接」(v-copy apkUrl) | 无 | 【需补】含两操作 |
| 状态 | `status` el-switch 上线/下线（`stockChangeStatus`，仅允许一个线上版）| 有（switch 启用/禁用，通用 toggle）| 语义差异：源=上线/下线且互斥 |
| 是否强制更新 | `uploaded`（强制/不强制更新）| 无 | 【需补】|
| 配置项/键/值/创建时间 | 无 | 有 | 【目标虚构】|

## 表单字段（新增/编辑版本弹窗）
| 字段 | 源 | 目标 | 结论 |
|----|----|----|----|
| 版本号 versions | 有 required maxlength 20 | 无（有 name）| 【需补】|
| 更新日志 content | 有 required，**markdown-editor** 组件（转 HTML 存 logs）| 无 | 【源有目标无=需补】含富文本子组件 |
| 上传 apk path | 有 required，el-upload 仅 .apk，重命名上传 | 无 | 【需补】|
| 是否强制更新 uploaded | 有 required radio（是/否）| 无 | 【需补】|
| 配置项/键/值/状态 | 无 | 有 | 【目标虚构】|

## 详情/弹窗
| 弹窗 | 源 | 目标 | 结论 |
|----|----|----|----|
| 新增/编辑版本 | 有 | 有（改为键值表单）| 表单内容错配 |
| 更新日志查看 | 有（title `版本号+更新日志`，v-html 渲染 logs）| 无 | 【源有目标无=需补】|

## 操作按钮
| 按钮 | 源文案/权限/交互 | 目标 | 结论 |
|----|----|----|----|
| 新增版本 | `新增版本` `v-permission=['addStock']` 弹窗 | `新增` 弹窗 | can **add**（addStock）|
| 查询 | `查询` `v-permission=['queryStock']` | 无（骨架自动 loadData）| can **query**（queryStock）|
| 下载apk | `下载apk` `$checkPermission(['PDALoadAPK'])` window.open | 无 | can **loadApk**（PDALoadAPK）|
| 复制下载链接 | `复制下载链接` v-copy 指令（无独立权限）| 无 | 【需补】|
| 状态上/下线 | el-switch `$checkPermission(['stockChangeStatus'])` 二次确认 + 唯一线上校验 | switch toggle（无权限键、无互斥）| can **changeStatus**（stockChangeStatus）|
| 删除 | `删除` `v-permission=['deleteStock']`，线上版禁止删除 | `删除` 通用确认 | can **del**（deleteStock）；缺「线上不可删」拦截 |
| 更新日志 | `更新日志` 打开 v-html 弹窗 | 无 | 【需补】can view log（无独立权限键）|
| 编辑（行）| 无（源无行内编辑，仅新增/删除/日志）| 有「编辑」 | 【目标多余】|

## 子组件
- 源：`MarkdownEditor`（`@/components/MarkdownEditor/index.vue`）用于更新日志。目标无。【需补/或以 textarea 简化】
- 全局：`v-copy` 指令、`$checkPermission`、`$upload`。

## 建议 can 动作
- can add（addStock）
- can query（queryStock）
- can loadApk（PDALoadAPK）
- can changeStatus（stockChangeStatus，上线/下线，互斥单线上版）
- can del（deleteStock，线上版拦截）
- 复制链接 / 查看更新日志：源无独立权限键，随页面可用即可

## 需补要点（真实业务缺漏）
整页重写为「版本管理」：
1. 列：版本号 / 发布时间 / 下载apk(+复制链接) / 上线-下线开关(互斥) / 是否强制更新。
2. 发布时间 daterange 筛选（默认近30天）+ 查询。
3. 新增版本表单：版本号 + Markdown 更新日志 + apk 上传(.apk) + 强制更新 radio。
4. 更新日志查看弹窗（v-html）。
5. 业务规则：仅一个线上版本、线上版本禁止删除。
6. 移除虚构的 键/值配置项、行内编辑。
