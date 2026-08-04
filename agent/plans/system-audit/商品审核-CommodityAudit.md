# 商品审核 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/commodity-audit/` (index 574 + auditForm 838 + filesForm 454 + priceForm 170 + customers 210 行)
- 目标: `src/views/system/CommodityAudit.vue` (61 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (目标为模板生成的通用增删改, 与源真实"审核流程"业务几乎完全错配)

源是一个只读审核台账 + 4 个业务弹窗(审核/定价/认证文件/查看客户), 没有普通的"新增/编辑/删除"CRUD。目标却是标准 name/status 增删改弹窗, 业务本质错了。

---

## 1. 筛选项

| 源 | 目标 | 结论 |
|---|---|---|
| 目的国 `countryId` (远程 el-select, `${name}-${alias}`, focus 加载) | 无 | 需补 |
| 审核状态 `status` (待审核0/审核通过1/审核拒绝2) | `audit` 下拉但用 AUDIT_STATUS 通用字符串 | 字段差异: 源是 status 数值 0/1/2 三态 |
| 价格定义 `ifPrice` (未配置0/已配置1) | 无 | 需补 |
| 关键词联合搜索 `keyword` + `selectType` 前置下拉(海关编码1/中文名称2/英文名称3) | 商品名称 `name` 单输入框 | 需补: 联合搜索三选一 + 前置 select 插槽 |
| — | 状态 `status` 启用/禁用 (通用) | 目标有源无(源没有启禁用筛选) |
| 查询按钮 `v-permission=['queryCheck']` | 无(仅 search 事件) | 需补权限键 |

## 2. 表格列 (源真实字段, 目标全错)

源列: 起运国 `startCountryName` / 目的国 `countryName` / 审核状态(0/1/2模板) / 海关编码 `code` / **商品名称双行(中文 `cnName` + 英文 `enName`)** / 品牌 `brand` / 规格 `size` / **材质双行(`cnMaterial`+`enMaterial`)** / **用途双行(`cnPurpose`+`enPurpose`)** / 计量单位 `unitName` / 商品类别 `title` / 添加时间 `createTime` / 操作(280宽)

目标列: name / hsCode / audit / customer / status / createTime — 只有 hsCode 勉强对应, 其余 (customer/status) 是虚构, 缺 起运国/目的国/双语商品名/品牌/规格/双语材质/双语用途/计量单位/商品类别。

结论: 需整表重写。列头用 slot 双行 (中/英文名, 中/英材质, 中/英用途) 是源的关键渲染特征。

## 3. 操作按钮 (源核心业务, 目标完全缺)

源操作列 (含 ifPrice 红/绿点指示价格是否配置):
- 定义价格 `goPrice` → 弹窗 priceForm, `v-permission=['priceCheck']`
- 审核 `goAudit` → 弹窗 auditForm(audit模式), 条件 `status !== 1 && $checkPermission(['execCheck'])`
- 查看 `goView` → 弹窗 auditForm(view模式), 条件 `status === 1`
- 认证文件 `goFiles` → 弹窗 filesForm (无权限键)
- 查看客户 `goCustomers` → 弹窗 customers (无权限键)

目标操作: 编辑 / 删除 (通用, 与源全不符)。

结论: 删掉编辑/删除, 补 5 个业务按钮 + ifPrice 指示点; 跳转已知改弹窗, 无数据的列表走 demoAction 占位。

## 4. 子弹窗字段 (目标全无, 均需补为占位弹窗)

- **priceForm 定义报价**: 报价单价 `declarePrice` / 申报单价 `offerPrice` / 币种 `currency`(远程) — 均必填
- **auditForm 商品审核** (1000px, 最复杂): 只读展示图片/中英名/品牌/规格/中英材质/中英用途/计量单位/目的国; 可编辑 商品分类 `categoryId`(弹层树选择, 必填) + 备注 `remarks`; 下半部 申报要素查询(海关编码/中英名)+ 单选表格(申报要素/商品类别) + 税率展示 taxList; 保存按钮
- **filesForm 认证文件** (800px): 通关认证/运输认证双 checkbox+多选; 文件表格(文件状态/审核状态/文件名/拒绝原因/操作); 操作含 删除/下载/查看/审核/审核通过/审核拒绝(popover填拒绝原因) — 完整审核流
- **customers 查看客户** (1200px): 申请时间筛选 + 表格(原单号/客户名称/双语商品名/品牌/规格/双语材质/双语用途/审单时间)

## 5. 建议 can 动作 (权限键逐字对齐源)

| 动作 | 源权限键 | 说明 |
|---|---|---|
| 查询 | `queryCheck` | 查询按钮 |
| 定义价格 | `priceCheck` | |
| 执行审核 | `execCheck` | 审核按钮 (status!==1) |
| 认证文件 | (源无键) | 建议新增 can, 如 `fileCheck` |
| 查看客户 | (源无键) | 建议新增 can |

查看(view)源无独立权限键(靠 status===1 显示)。
