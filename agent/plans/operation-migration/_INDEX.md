# 运营管理 24 页保真重建 — 差异清单总览与施工顺序

> 基准：agent/workProject2-jht/src/views/operation-management/（旧 Vue2 类组件）
> 目标：src/views/operation/*.vue（新 Vue3 <script setup>，当前为模板批量生成的通用 CRUD 骨架，字段大量虚构）
> 决策：完全保真重建（对齐筛选/列/表单/详情/组件/按钮/跳转，含树/批量/穿梭框/子表）；权限用现有 menuPerms + btnPerms（usePagePerms().can()），不重开 custType。

## 核心发现
目标 24 页并非"简化"，而是模板批量生成的**虚构字段**，与源真实业务模型系统性错配（如国际航线目标"航班号/起飞港"←源"航线类型+关联多国家"；汇率记录目标单表←源"货币对主表+汇率子表"；岗位设置目标"编码/部门"←源"企业类型多选→服务大类多选联动→岗位类别"）。目标普遍多出源没有的"状态开关+搜索栏"。故每页需：重写 mock 数据模型 + 重写页面 + 接 v-permission。

## 施工批次（按工作量，轻→重）

### 第一批 · 轻/中（单文件，无树/子表，先立范式）
| 页 | 文件 | 工作量 | 关键点 |
|---|---|---|---|
| 任务单证 | TaskDocument.vue | 中 | 仅编辑无增删；time(分钟 precision2)+关联服务大类；权限 ttskQuery/ttskUpdate |
| 禁忌词语 | TabooManagement.vue | 中 | words(textarea)/禁忌程度 radio/关联国家穿梭；addTaboo/editTaboo/deleteTaboo/tabooCountry |
| 报表定义 | ReportDefinition.vue | 中 | name/tag/ip(textarea)；reportsAdd/reportsQuery/reportsUpdate；关联代理商 transfer 源已休眠 |
| 货币管理 | CurrencyManagement.vue | 大 | alias/通用国家穿梭；编码3位纯字母编辑禁用；addCurrency/editCurrency/deleteCurrency |
| 国际航线 | InternationalFlight.vue | 大 | 航线类型(0/1/2/4)+关联多国家穿梭+备注；addRoute/editRoute/deleteRoute |
| 岗位设置 | JobSetup.vue | 大 | 企业类型多选→服务大类多选联动→岗位类别；postsettingAdd/Query/Update；无删除 |

### 第二批 · 大/极大（含穿梭/单位字典/级联/子弹窗）
| 页 | 文件 | 工作量 | 关键点 |
|---|---|---|---|
| 机场港口 | PortManagement.vue | 极大 | 地区四级联动+关键字类型切换+海关下拉；addPort/queryPort/editPort/deletePort |
| 车型选择 | VehicleManagement.vue | 极大 | 国家穿梭+单位字典三类+长度联动体积+尺寸字段；addVehicleType/... |
| 货柜管理 | ContainerManagement.vue | 极大 | 单位字典+尺寸；权限键注意 queryCurrency；addContainer/editContainer/deleteContainer |
| 航空板 | AviationPlate.vue | 极大 | 单位字典(无体积控件)+$fomat过滤器+model.searchKey；aviationBoardAdd/Query/Update/Del |
| 验货配置 | ExamineConfig.vue | 极大 | 子组件 addEditForm 15+项+*Arr↔逗号串映射；lnspectionConfig*(注意拼写 l) |
| 报关要素 | CustomsFactor.vue | 极大 | 双行 header cn/en 成对+海关编码动态 sections 弹窗；customsFactorAdd/Search/Edit/Copy/Status |
| FBA仓库管理 | FbaContainerManagement.vue | 极大 | 四级联动+type 条件字段(18字段)+switch确认；addFbastore/queryFbastore/editFbastore/deleteFbastore/fbastoreChangeStatus |
| 汇率记录 | Rate.vue | 极大 | 货币对主表+汇率历史子表 records.vue；exchangerateAdd/Update/Del/Statistics |
| 下单配置 | OrderType.vue | 极大 | 三按钮列关联维护+服务名称弹窗(7接口)+两关联子组件；ploQuery/ploServiceName/ploServiceProject/ploAdditionalItems |
| 文件配置 | FileConfig.vue | 大 | 模块→类别级联+国家检索+addModel 子组件；fileConfigAdd/Query/Update/Del |

### 第三批 · 极大（树/多tab/发货派送含向导子表）
| 页 | 文件 | 工作量 | 关键点 |
|---|---|---|---|
| 国家省州 | AreaManagement.vue | 极大 | 行政区域懒加载树+侧滑+批量新增弹窗；countryStateAdd/Update/Del |
| 区域配置 | DomesticArea.vue | 极大 | 4-tab(国内/城市/国家/仓库分区)+自定义 ZjTransfer；12 权限键 |
| 服务机构 | ServiceAgency.vue | 极大 | 四级联动+服务国家穿梭+logo上传；addServiceOrg/queryServiceOrg/editServiceOrg/deleteServiceOrg/serviceOrgCountry |
| 服务大类 | ServiceGenara.vue | 大 | 公司类型多选+√/--三列+服务类型子弹窗(计费区间动态行);categoryAdd/Query/Update/Statistics |
| 整柜发货 | ContainerShipment.vue | 中 | 双视图整页表单(原单号查询→只读→发货计划→拖车供应商);fclShipmentAdd/Search/View/Edit |
| 订单派送 | OrderDelivery.vue | 大 | 6+级联筛选+2步向导(firstStep 11字段);orderDeliveryAdd/Query/Details/Edit |
| 外协发货 | OutsourcShipment.vue | 大 | 3视图+2步向导+资料补充tab+补单出库大弹窗;outsourc* 9 键 |
| 分单发货 | SingleShipment.vue | 极大 | 最重(9205行);27列+更多筛选drawer+两步向导+装柜确认+4弹窗;separateDelivery* ~20 键 |

## 复用范式
- 穿梭框：仿 src/components/Common/RelateStaffDialog.vue（el-transfer）
- 树：仿 src/views/organizers/Department.vue（el-tree）
- 权限：usePagePerms().can(action)；MENU_TREE 已含运营 24 页 path
- 数据层：defineMock(key,seedFn,searchKeys)，res 暴露 raw/list/get/bulkAdd/bulkRemove/setStatus

## 权限键动作映射（btnPerms → can(action)）
源 v-permission 多为 xxxAdd/xxxQuery/xxxUpdate/xxxDel/xxxStatus 等具名键。新项目按 `${path}:${action}` 模型，action 归一：
- 新增/批量新增/导入 → add
- 查询/查看/更多/关联维护 → view（查询按钮源常带 xxxQuery，归 view）
- 编辑/状态切换/审核/关联保存 → edit
- 删除 → del
- 导出 → export（如需要）
