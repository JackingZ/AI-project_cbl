# 计划订阅 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/subscribe-plan/index.vue` (1065 行, 单文件)
- 目标: `src/views/system/SubscribePlan.vue` (58 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (目标 name/cycle/receiver 骨架, 源是"订阅人 + 航线/仓库订阅"业务, 无 cycle/周期概念)

源核心是订阅人管理 + 通过穿梭框(el-transfer)批量关联航线/仓库。目标的"周期 cycle"字段是虚构。

---

## 1. 筛选项

| 源 | 目标 | 结论 |
|---|---|---|
| 所属公司 `custId`(custId===0 显示, 多租户可省) | 无 | 背景已知可省 |
| 选择航线 `bsId`(远程 focus) | 无 | 需补 |
| 选择仓库 `fbastoreId`(远程 focus, 用 `code`) | 无 | 需补 |
| 关键词 `keyword` + 前置 `selectType`(订阅人姓名1/手机号2) | 无 | 需补: 联合搜索 |
| — | 周期 `cycle`(CYCLES 每日等) | 目标有源无(虚构字段) |
| — | 状态 `status` 启用/禁用 | 目标有源无(源无启禁用) |
| 查询 `v-permission=['querySubscribe']` | 无 | 需补 |

顶部按钮(源, 目标全缺):
- 新增订阅人 `v-permission=['addSubscribe']`
- 批量订阅航线 `v-permission=['batchSubscribe']`
- 批量订阅仓库 `v-permission=['batchSubscribe']`

## 2. 表格列 (目标错配)

源列: 订阅人姓名 `name` / 所属公司 `custName`(多租户可省) / 手机号 `phone` / 微信号 `wechat` / 电子邮箱 `email` / 手机通知 `bySms`(√/--) / 微信通知 `byWechat` / 邮件通知 `byEmail` / 计划信息 `plan` / 装载信息 `loaded` / 实时成本 `cost` / **订阅航线(按钮)** / **订阅仓库(按钮)** / 操作(编辑/删除); 含 selection 多选列。

目标列: name / cycle / receiver / status / createTime — 只有 name 对得上; cycle/receiver/status 虚构; 缺 手机/微信/邮箱/三种通知开关/三种订阅内容/航线/仓库入口。

结论: 整表重写。formatValue 渲染 √/-- 是关键特征。

## 3. 表单字段 (新增/编辑订阅人弹窗, 目标缺)

源: 所属公司 `custId`(多租户可省) / 订阅人姓名 `name`(编辑禁用, 必填) / 手机号 `phone`(禁中文校验, 必填) / 微信号 `wechat`(仅数字字母, 必填) / 电子邮箱 `email`(格式校验, 必填) / 订阅内容 `bookArr`(多选: 计划信息/装载信息/实时成本, 必填) / 通知方式 `infoArr`(多选: 手机/微信/邮件, 必填)。

目标: name / cycle / receiver / status — 仅 name 对得上, 其余虚构。

## 4. 关联弹窗 (穿梭框, 目标完全无)

- **订阅航线**: el-transfer(选择航线↔已订阅航线), 保存 `saveFlightBatch`; 行按钮 `:disabled="!$checkPermission(['batchSubscribe'])"`
- **订阅仓库**: el-transfer(选择仓库↔已订阅仓库, `code+address`), 保存 `saveFBABatch`; 同上权限

结论: 需补为占位弹窗 (穿梭框深交互走 demoAction)。

## 5. 操作按钮

源: 编辑 `v-permission=['updateSubscribe']` / 删除 `v-permission=['delSubscribe']` / 订阅航线·订阅仓库(disabled by batchSubscribe)。
目标: 编辑/删除(无键)。

## 6. 建议 can 动作 (逐字对齐)

| 动作 | 源权限键 |
|---|---|
| 查询 | `querySubscribe` |
| 新增订阅人 | `addSubscribe` |
| 批量订阅航线/仓库 | `batchSubscribe` |
| 编辑 | `updateSubscribe` |
| 删除 | `delSubscribe` |
