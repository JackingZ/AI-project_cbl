# FBA仓库管理 fbacontainer-management/index.vue → src/views/operation/FbaContainerManagement.vue

## 源页结构
- head-info title=FBA仓库；单页列表 + 分页 + 单个新增/编辑弹窗(900px, dialogShow)。无 tab/侧滑。弹窗内表单字段随 form.type 条件显隐。

## 筛选项
- 新增FBA仓库：el-button type=text v-permission="['addFbastore']"。
- 仓库类型 el-select selectValue.type：亚马逊'0'/海外仓'1'(typeList) clearable width130。
- 所在国家 el-select countryId filterable @focus getCountryList @change onCountryChange(1)(重置 state/city/county)。
- 州/省 el-select stateId :disabled="!countryId" @focus getStateList(1) @change onStateChange(1) label=`${name}-${alias}`。
- 城市 el-select cityId :disabled="!stateId" @focus getCityList(1) @change onCityChange(1)。
- （区/县 countyId 注释）
- 启用状态 el-select status：启用'1'/禁用'0'(statusList)。
- 仓库编码 el-input code placeholder=请输入仓库编码 width150。
- 查询：v-permission="['queryFbastore']" @click getFbastoreList(1)。

## 表格列
- 仓库类型 width120 fixed left formatType(type)→亚马逊/海外仓
- 仓库编号 code width120 fixed left sortable="custom"(@sort-change→codeSort A/D)
- 国家/地区 countryName width160
- 州省市区 min180：stateName-stateNameEn + "> " cityName-cityNameEn(v-show 非空)
- 详细地址一 address min180
- 邮政编码 postal width180
- 收货公司 recipient min180
- 启用状态 status width130：el-switch active-value"1"/inactive"0"，:disabled="!$checkPermission(['fbastoreChangeStatus'])"，@input onStatus($confirm 确认)
- 操作 width180 fixed right

## 操作按钮
- 编辑：v-permission="['editFbastore']" @click handleEdit。
- 删除：v-permission="['deleteFbastore']" @click deleteFbastore(row.id)($confirm "此操作将删除FBA仓库，是否继续？")。
- 状态开关确认："此操作将${禁用/开启}FBA仓库，是否继续？"。

## 新增/编辑表单字段（900px, label-width110, el-form-item 50% 两列）
- type 仓库类型 select(typeList)；required change「请选择FBA仓库类型」
- ifHave 自有 radio(0否/1是) v-if="form.type==='1'"
- code FBA仓库编码 input maxlength10 show-word-limit；required blur「FBA仓库编码不能为空」
- countryId 国家/地区 select filterable @focus getCountryList @change onCountryChange(2)；required change
- stateId 州/省 select :disabled="!form.countryId"；required change
- cityId 城市 select :disabled="!form.stateId"；required change
- （countyId 区/县 注释）
- address 详细地址一 maxlength30；required「仓库地址不能为空」
- address1 详细地址二 maxlength30；address2 详细地址三 maxlength30(无校验)
- postal 邮政编码 maxlength10 show-word-limit；required blur + validator「邮政编码不能有中文」(/[一-龥]/)
- recipient 收货公司 :disabled="isRecipientDisabled"(type==0 时禁用,值自动=Amazon) maxlength50；required blur「收货公司不能为空」
- contact 联系人 maxlength50；required blur「联系人不能为空」
- email 联系邮箱 maxlength30；required blur + type:'email'「邮箱地址格式不正确」
- phone 联系电话 maxlength20；required blur + validator 电话不能有中文
- maxSize 最大尺寸 v-if type==='0' number append cm；type number + >=0
- maxWeight 最大重量 v-if type==='0' number append kg；type number + >=0
- isDirect 直送 radio(0是/1否) v-if type==='0'

## 目标页现状
- 通用 CRUD：筛选 name(仓库名称)/status；列 name/code/country/address/status/createTime；Modal name/code/country/address/status。无级联、无权限键、无 type 条件字段、switch 无确认。

## 差异
- 需补：仓库类型/国家/州省/城市四级联动筛选(focus 加载+联动重置+disabled 依赖)、编码输入、addFbastore/queryFbastore 权限键；表格 formatType 列、sortable code、州省市区拼接列、postal/recipient 列、switch 权限+确认、编辑/删除权限键与删除确认；完整表单 18 字段 + 全部校验(email 类型、两处中文正则、数字>=0、type 条件显隐、recipient 自动 Amazon)。
- 需删/映射：目标 name → 源无独立"仓库名称"(源用 code 检索)；目标 country(文本) → 源 countryId 级联。
- 工作量：极大。
