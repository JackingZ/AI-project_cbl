# 产品库 一致性审计

- 源: `agent/workProject2-jht/src/views/system-management/product-library/` (index 695 + addEditProduct 735 + declarationInfo 756 行)
- 目标: `src/views/system/ProductLibrary.vue` (58 行, 通用 CRUD 骨架)

## 评分: 大缺漏 (目标 name/sku/brand/price 骨架, 缺产品库真实的多字段表单 + 报关信息子流程)

---

## 1. 筛选项

| 源 | 目标 | 结论 |
|---|---|---|
| 国家/地区 `countryId` (远程 focus 加载, `${name}-${alias}`) | 无 | 需补 |
| 商品状态 `state` (待审核0/审核通过1/审核拒绝2) | 状态 `status` 启用/禁用(通用) | 字段差异: 源是 state 三态审核, 非启禁用 |
| 关键词联合搜索 `keyword`+`selectType`(SKU编码1/中文名称2/英文名称3) | 产品名称 `name` 单框 | 需补: 联合搜索 + 前置 select |
| 新增产品 `v-permission=['addGoods']` | 新增(无权限键) | 需补权限键 |
| 查询 `v-permission=['queryGoods']` | 无 | 需补 |

## 2. 表格列 (目标严重错配)

源列: 审核状态(state 0/1/2) / SKU编码 `skuCode` / **商品名称双行(`cnName`+`enName`)** / 品牌 `brand` / 规格 `size` / **材质双行(`cnMaterial`+`enMaterial`)** / **用途双行(`cnPurpose`+`enPurpose`)** / 计量单位 `unitName` / 商品类别 `title` / **报关信息(按钮 onDeclaration)** / 添加时间 `createTime` / **状态(el-switch 启用0/禁用1, `v-permission enableGoods`)** / 操作

目标列: name / sku / brand / price / status / createTime。`price` 是虚构(源无单价列); 缺 审核状态/双语名/双语材质/双语用途/计量单位/商品类别/报关信息入口。

结论: 需整表重写。注意源 status 开关值 `active-value=0 / inactive-value=1` (反常, 0=启用)。

## 3. 表单字段 (addEditProduct, 目标缺绝大部分)

源新增/编辑表单 (1000px, `formPrama()` 完整字段):
- 商品属性 `categorieIds` 多选(普货/纯电/带电/带磁/危险, 必填)
- 商品图片 `url` 上传(必填)
- 中文名称 `cnName` / 英文名称 `enName`(禁中文校验) / SKU编码 `skuCode` / 品牌 `brand` / 规格 `size` (均必填)
- 中文材质 `cnMaterial` / 英文材质 `enMaterial`(禁中文) / 中文用途 `cnPurpose` / 英文用途 `enPurpose`(禁中文) (均必填)
- 计量单位 `unit`(远程) / 功率 `power` / 采购链接 `purchaseUrl`
- 一件代发 `issued`(是0/否1) / 公共库产品 `onPublic`(custType===0 才显示, 单角色可省) / 备注 `remark`
- **条件区块 (issued===0 时显示)**: 包装类型 `packing` / 仓储条件 `storage` / 重量单位 `weight` / 长度单位 `length` / 长度 `lengthen` / 宽度 `wide` / 高度 `high` / 毛重 `gross` / 净重 `net`

目标表单: name/sku/brand/price/status — 仅 sku/brand 对得上, price/name/status 虚构。缺 ~25 个真实字段。

结论: 整表单重写。onPublic 依赖多租户可省(背景已知)。

## 4. 报关信息子弹窗 (declarationInfo, 目标完全无)

入口: 表格"报关信息"列按钮 → 二级 CRUD 弹窗(1200px):
- 新增报关信息 `v-permission=['goodsDeclarationInfoAdd']`
- 表格列: 状态(0/1/2) / 起运国 `startCountryName` / 目的国 `countryName` / 海关编码 `code` / 单价 `price` / 单位 `unitName` / 通关要求 `isClearance`(需要0/不需要1) / 认证文件(上传按钮 `v-permission goodsDeclarationInfoUploadFile`) / 税率 `rate` / 证书 / 操作(编辑/删除)
- 编辑弹窗字段: 起运国 `startCountry` / 目的国 `countryId` / 销售单价 `price` / 销售单位 `unit` / 销售链接 `url` / 备注 `remark`
- 上传文件二级弹窗: 文件表格(文件状态/审核状态/文件名/拒绝原因/上传/下载)

结论: 需补为占位弹窗 (深操作走 demoAction)。

## 5. 操作按钮

源: 编辑 `v-permission=['editGoods']` / 删除 `v-permission=['deleteGoods']` / 状态开关 `enableGoods` / 报关信息(无键) / 新增 `addGoods` / 查询 `queryGoods`。
目标: 编辑/删除(无权限键)。

## 6. 建议 can 动作 (逐字对齐)

| 动作 | 源权限键 |
|---|---|
| 查询 | `queryGoods` |
| 新增 | `addGoods` |
| 编辑 | `editGoods` |
| 删除 | `deleteGoods` |
| 启用/禁用 | `enableGoods` |
| 报关信息-新增 | `goodsDeclarationInfoAdd` |
| 报关信息-编辑 | `goodsDeclarationInfoEdit` |
| 报关信息-删除 | `goodsDeclarationInfoDel` |
| 报关信息-上传文件 | `goodsDeclarationInfoUploadFile` |
