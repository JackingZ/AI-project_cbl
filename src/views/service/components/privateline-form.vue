<template>
  <div v-loading="formLoading" class="app-panel privateline-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit && !isCopy ? '编辑专线服务' : '新增专线服务' }}</div>
      <el-button type="primary" size="small" @click="handleBack">返 回</el-button>
      <el-button type="primary" size="small" @click="handleSave">保 存</el-button>
    </div>
    <div class="content">
      <el-form ref="selectFormRef" :model="selectForm" :rules="formRules" label-width="156px" class="detail-form" size="small">
        <div class="form-title"><span>基础信息</span></div>
        <el-form-item label="所属产品" prop="productId">
          <el-select v-model="selectForm.productId" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in productList" :key="item.id" :label="item.productName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="selectForm.name" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务简称" prop="abbr">
          <el-input v-model="selectForm.abbr" :maxlength="10" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务编码" prop="lsId">
          <el-input v-model="selectForm.lsId" style="width: 100%" size="small" placeholder="请输入" :maxlength="25" show-word-limit />
        </el-form-item>
        <!-- 源注释：关联服务编码 select（改为 input 直填）
        <el-form-item label="关联服务编码" prop="lsId">
          <el-select v-model="selectForm.lsId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @change="onLsid">
            <el-option v-for="item in codeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="selectForm.subtypeId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @change="onSubtype">
            <el-option v-for="item in subtypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.subtypeId === '1' || selectForm.subtypeId === '2'" label="业务类型" prop="containerType">
          <el-select v-model="selectForm.containerType" placeholder="请选择" size="small" clearable style="width: 100%">
            <el-option v-for="item in CONTAINER_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起运国" prop="countryId">
          <el-select v-model="selectForm.countryId" placeholder="起运国" filterable clearable style="width: 100%" size="small">
            <el-option v-for="item in countryOptions" :key="item.id" :label="item.label" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起运港" prop="departureId" class="is-required">
          <el-input :model-value="`已选择(${selectForm.departureId.length})`" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="handlePort('qi')" /></template>
          </el-input>
        </el-form-item>
        <el-form-item label="目的国" prop="countryToIds">
          <el-input :model-value="`已选择(${selectForm.countryToIds.length})`" size="small" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="handleStates" /></template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="selectForm.subtypeId !== '3'" label="目的港" prop="destinationId" class="is-required">
          <el-input :model-value="`已选择(${selectForm.destinationId.length})`" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="handlePort('mu')" /></template>
          </el-input>
        </el-form-item>
        <!-- 源注释：地区 region 默认隐藏
        <el-form-item label="地区" prop="region">
          <el-input v-model="selectForm.region" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        -->
        <!-- 源注释：交货区域 deliveryId 默认隐藏
        <el-form-item label="交货区域" prop="deliveryId">
          <el-select v-model="selectForm.deliveryId" placeholder="请选择" size="small" clearable filterable multiple collapse-tags style="width: 100%">
            <el-option v-for="item in addrList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item v-if="selectForm.subtypeId === '1' && selectForm.countryToIds.some(it => it === 'US')" prop="orgTag" label="服务机构">
          <el-select v-model="selectForm.orgTag" placeholder="请选择" style="width: 100%" filterable clearable>
            <el-option v-for="item in ORG_TAG_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的地类型" prop="purposeType">
          <el-select v-model="selectForm.purposeType" placeholder="请选择" style="width: 100%" filterable clearable @change="purposeTypeChange">
            <el-option label="FBA" :value="0" />
            <el-option label="私人" :value="1" />
            <el-option label="自有海外仓" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="配货属性" prop="outsourcing">
          <el-radio-group v-model="selectForm.outsourcing">
            <el-radio label="2">全部</el-radio>
            <el-radio label="0">自有</el-radio>
            <el-radio label="1">外协</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="服务用途" prop="usages">
          <el-select v-model="selectForm.usages" placeholder="请选择" size="small" clearable multiple collapse-tags style="width: 100%">
            <el-option label="服务渠道" value="0" />
            <el-option label="计费渠道" value="1" />
            <el-option label="发货渠道" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="selectForm.belong" placeholder="请选择" size="small" clearable style="width: 100%">
            <el-option label="同行&直客" value="0" />
            <el-option label="仅同行" value="1" />
            <el-option label="仅直客" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="货币单位" prop="currencyId">
          <el-select v-model="selectForm.currencyId" clearable filterable size="small" style="width: 100%" placeholder="请选择">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度单位" prop="umLength">
          <el-select v-model="selectForm.umLength" style="width: 100%" size="small" placeholder="请选择">
            <el-option label="M-米" value="M" />
            <el-option label="CM-厘米" value="CM" />
            <el-option label="FT-英尺" value="FT" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="selectForm.umWeight" style="width: 100%" size="small" placeholder="请选择">
            <el-option label="LB-磅" value="LBS" />
            <el-option label="KG-公斤" value="KGS" />
          </el-select>
        </el-form-item>
        <el-form-item label="体积单位" prop="umVolume">
          <el-select v-model="selectForm.umVolume" style="width: 100%" size="small" placeholder="请选择">
            <el-option label="CBM-立方米" value="CBM" />
            <el-option label="CUFT-立方英尺" value="CUFT" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报币种" prop="declaredCurrency">
          <el-select v-model="selectForm.declaredCurrency" style="width: 100%" size="small" placeholder="请选择">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="单箱最大重量" prop="weight">
          <el-input-number v-model="selectForm.weight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="单托最大重量" prop="singleMaxWeight">
          <el-input-number v-model="selectForm.singleMaxWeight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="支持最大体积" prop="cubed">
          <el-input-number v-model="selectForm.cubed" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="单箱最大申报金额" prop="maxAmount">
          <el-input-number v-model="selectForm.maxAmount" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="单票最大货值" prop="maxPrice">
          <el-input-number v-model="selectForm.maxPrice" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="服务条款" prop="clause">
          <el-select v-model="selectForm.clause" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in wordsList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认供应商" size="small" prop="custId">
          <el-select v-model="selectForm.custId" :loading="selectLoading" size="small" clearable filterable style="width: 100%" placeholder="请选择" @focus="getCustTypeList">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="selectForm.remark" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>

        <div class="form-title"><span>业务流程</span></div>
        <el-form-item label="派件方式" prop="dispatch">
          <el-select v-model="selectForm.dispatch" placeholder="请选择" size="small" clearable style="width: 100%" @change="onDispatch">
            <el-option v-for="(item, index) in dispatchList" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.dispatch === '1'" label="是否生成转单号" prop="isCreate">
          <el-radio-group v-model="selectForm.isCreate">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否包税" prop="includeTax">
          <el-radio-group v-model="selectForm.includeTax">
            <el-radio :label="false">不包税</el-radio>
            <el-radio :label="true">包税</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="selectForm.subtypeId === '1' || selectForm.subtypeId === '2'" label="支持锁舱" prop="coverTank">
          <el-radio-group v-model="selectForm.coverTank">
            <el-radio label="0">否</el-radio>
            <el-radio label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="商品属性" prop="categories">
          <el-select v-model="selectForm.categories" style="width: 100%" size="small" clearable multiple collapse-tags placeholder="请选择">
            <el-option label="普货" value="0" />
            <el-option label="带电" value="1" />
            <el-option label="纯电" value="2" />
            <el-option label="带磁" value="3" />
            <el-option label="危险" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费发票费用组" prop="chargeGroupId">
          <el-select v-model="selectForm.chargeGroupId" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in invoiceList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="免赔金额" prop="deductibles">
          <el-input-number v-model="selectForm.deductibles" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="运营成本" prop="">
          <div class="input-capacity">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.operatingCosts" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
            </div>
            <div class="input-unit"><span>元/kg</span></div>
          </div>
        </el-form-item>
        <el-form-item label="是否验货" prop="examine">
          <el-radio-group v-model="selectForm.examine" @change="selectForm.examineId = undefined">
            <el-radio :label="false">否</el-radio>
            <el-radio :label="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="selectForm.examine" label="验货配置" prop="examineId">
          <el-select v-model="selectForm.examineId" :loading="selectLoading" style="width: 100%" size="small" clearable filterable placeholder="请选择">
            <el-option v-for="item in examineList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="报关价比率(%)" prop="priceC">
          <el-input-number v-model="selectForm.priceC" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="关税预付比率(%)" prop="tax">
          <el-input-number v-model="selectForm.tax" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="100" :precision="2" />
        </el-form-item>
        <el-form-item label="保险费比率(%)" prop="insurance">
          <el-input-number v-model="selectForm.insurance" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="100" :precision="2" />
        </el-form-item>

        <div class="form-title"><span>参数&配置</span></div>
        <el-form-item label="计费方式" prop="priceType">
          <el-select v-model="selectForm.priceType" placeholder="请选择" size="small" style="width: 100%" @change="onChargeType">
            <el-option label="重量计费" value="2" />
            <el-option label="体积计费" value="3" />
            <el-option v-if="selectForm.subtypeId === '1' || selectForm.subtypeId === '2'" label="整柜计费" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.priceType !== '4' && selectForm.dispatch === '1'" label="打单快递服务" prop="escs" class="is-required">
          <el-input :model-value="`已选择(${selectForm.escs.length})`" style="width: 100%" disabled>
            <template #append><el-button :icon="Search" @click="handleExpress" /></template>
          </el-input>
        </el-form-item>
        <!-- 源注释：计费快递服务 escId 默认隐藏
        <el-form-item v-if="selectForm.priceType !== '4' && selectForm.dispatch === '1'" label="计费快递服务" prop="escId">
          <el-select v-model="selectForm.escId" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in expressList" :key="item.id" :label="item.name" :value="Number(item.id)" />
          </el-select>
        </el-form-item>
        -->
        <el-form-item label="起运港报关服务" prop="cscId">
          <el-select v-model="selectForm.cscId" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in customsList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.priceType !== '4'" label="起运港卡派服务" prop="kscId">
          <el-select v-model="selectForm.kscId" placeholder="请选择" size="small" clearable filterable style="width: 100%">
            <el-option v-for="item in cardList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.priceType === '2'" label="分单重量上限" prop="pWeight">
          <el-input-number v-model="selectForm.pWeight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item v-if="selectForm.priceType === '3'" label="分单体积上限" prop="pVolume">
          <el-input-number v-model="selectForm.pVolume" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item v-if="selectForm.priceType !== '4'" label="分单HSCODE数限制" prop="pHscode">
          <el-input-number v-model="selectForm.pHscode" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item v-if="selectForm.priceType !== '4'" label="是否计量提醒" prop="remind">
          <el-radio-group v-model="selectForm.remind">
            <el-radio :label="false">否</el-radio>
            <el-radio :label="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="form-title"><span>运输条款</span></div>
      <div>
        <!-- 源使用 toast-ui MarkdownEditor（目标未安装），降级为多行文本 -->
        <el-input v-model="terms" type="textarea" :rows="10" placeholder="请输入运输条款" />
      </div>
    </div>

    <!-- 关联快递服务 -->
    <Modal v-model="dialogExpress" title="关联快递服务" width="960px" :footer="false" @closed="cancelExpress">
      <div v-loading="dialogLoading">
        <el-transfer
          v-model="expressOption"
          filterable
          :filter-method="filterMethod"
          :titles="['选择快递服务', '已关联快递服务']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="expressList"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="cancelExpress">取 消</el-button>
          <el-button type="primary" size="small" @click="saveExpress">确 定</el-button>
        </div>
      </div>
    </Modal>

    <!-- 起运港/目的港选择 -->
    <Modal v-model="dialogPort" :title="portTitle" width="960px" :footer="false" @closed="cancelPort">
      <div v-loading="dialogLoading">
        <el-row :gutter="10">
          <el-col :span="8" style="margin: 10px 0">
            <div class="items">
              <div class="items-head">已选择</div>
              <el-tag v-for="(item, index) in portOption" :key="index" closable type="info" @close="handleRemove(index)">
                {{ (item.code ? item.code + '-' : '') + item.name }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="16">
            <el-row class="filter">
              <el-col style="text-align: right">
                <el-input v-model="portName" size="small" style="width: 130px" placeholder="请输入名称" />
                <el-button type="primary" size="small" @click="getPortData(1)">查询</el-button>
              </el-col>
            </el-row>
            <el-table :data="pagedPortList" border>
              <el-table-column width="55">
                <template #default="scope">
                  <el-checkbox :model-value="portOption.some(o => o.id === scope.row.id)" @change="() => togglePort(scope.row)" />
                </template>
              </el-table-column>
              <el-table-column prop="name" label="地址名称">
                <template #default="scope">{{ (scope.row.code ? scope.row.code + '-' : '') + scope.row.name }}</template>
              </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="page" :page-size="size" layout="total, prev, pager, next" :total="total" style="text-align: right" @current-change="getPortData()" />
          </el-col>
        </el-row>
        <div style="text-align: right; padding-top: 10px">
          <el-button size="small" @click="cancelPort">取 消</el-button>
          <el-button type="primary" size="small" @click="savePort">确 定</el-button>
        </div>
      </div>
    </Modal>

    <!-- 目的国 -->
    <Modal v-model="isItemDialogShow" title="目的国" width="960px" :footer="false" append-to-body @closed="isItemDialogShow = false">
      <el-transfer
        v-model="selectForm.countryToIds"
        filterable
        :filter-method="filterMethod"
        :titles="['国家', '已选择']"
        :props="{ key: 'id', label: 'label' }"
        filter-placeholder="输入搜索"
        :data="countryOptions"
        style="height: 500px"
      />
      <div style="text-align: right; margin: 0 40px 0">
        <el-button size="small" @click="isItemDialogShow = false">取 消</el-button>
        <el-button type="primary" size="small" @click="isItemDialogShow = false">确 定</el-button>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import {
  privatelineApi, getCountryList, getCurrencyList, getSupplierOptions, getWordsList,
  getProductList, getServiceSubtypeList, getCostgroupList, getEscList, getCscList,
  getKscList, getExamineList, CONTAINER_TYPE_LIST, ORG_TAG_LIST
} from '@/api/modules/service'

defineOptions({ name: 'PrivatelineForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['back', 'confirm'])

const formParam = () => ({
  maxAmount: undefined, maxPrice: undefined, singleMaxWeight: undefined, declaredCurrency: undefined,
  productId: undefined, productName: undefined, name: undefined, abbr: undefined, lsId: undefined,
  subtypeId: undefined, subtypeName: undefined, orgTag: undefined, kscName: undefined, cscName: undefined,
  custName: undefined, countryName: undefined, countryId: undefined, countryToIds: [], departureId: [],
  departureName: undefined, deliveryName: undefined, destinationName: undefined, destinationId: [],
  region: undefined, containerType: undefined, deliveryId: [], outsourcing: '0', purposeType: 0,
  usages: [], currencyId: undefined, currencyName: undefined, weight: undefined, cubed: undefined,
  custId: undefined, remark: undefined, belong: undefined, umLength: undefined, umWeight: undefined,
  umVolume: undefined, dispatch: undefined, operatingCosts: undefined, isCreate: 0, includeTax: true,
  coverTank: undefined, categories: [], chargeGroupId: undefined, chargeGroupName: undefined,
  deductibles: undefined, examine: true, examineId: undefined, priceC: undefined, tax: undefined,
  insurance: undefined, priceType: '2', escs: [], pMark: undefined, pHscode: undefined, pVolume: undefined,
  pWeight: undefined, remind: true, terms: '', refStart: undefined, refEnd: undefined, clause: undefined,
  cscId: undefined, escId: undefined, kscId: undefined
})

const selectFormRef = ref()
const selectForm = reactive(formParam())
const terms = ref('')
const formLoading = ref(false)
const selectLoading = ref(false)
const dialogLoading = ref(false)

const lsIdValidator = (rule, value, callback) => {
  const reg = /^[a-zA-Z0-9 .·_-]+$/
  if (!value) callback(new Error('服务编码不能为空'))
  else if (!reg.test(value)) callback(new Error('服务编码不能有中文及特殊字符'))
  else callback()
}
const formRules = {
  name: [{ required: true, message: '服务名称不能为空', trigger: 'blur' }],
  abbr: [{ required: true, message: '服务简称不能为空', trigger: 'blur' }],
  productId: [{ required: true, message: '请选择所属产品', trigger: 'change' }],
  containerType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  subtypeId: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  countryId: [{ required: true, message: '起运国不能为空', trigger: 'change' }],
  countryToIds: [{ required: true, message: '目的国不能为空', trigger: 'change' }],
  outsourcing: [{ required: true, message: '请选择配货属性', trigger: 'change' }],
  declaredCurrency: [{ required: true, message: '请选择申报币种', trigger: 'change' }],
  purposeType: [{ required: true, message: '请选择目的地类型', trigger: 'change' }],
  usages: [{ required: true, message: '请选择服务用途', trigger: 'change' }],
  belong: [{ required: true, message: '请选择分配客户', trigger: 'change' }],
  lsId: [{ required: true, validator: lsIdValidator, trigger: 'blur' }],
  currencyId: [{ required: true, message: '请选择货币单位', trigger: 'change' }],
  umLength: [{ required: true, message: '请选择长度单位', trigger: 'change' }],
  umWeight: [{ required: true, message: '请选择重量单位', trigger: 'change' }],
  umVolume: [{ required: true, message: '请选择体积单位', trigger: 'change' }],
  weight: [{ required: true, message: '支持最大重量不能为空', trigger: 'blur' }],
  cubed: [{ required: true, message: '支持最大体积不能为空', trigger: 'blur' }],
  clause: [{ required: true, message: '请选择服务条款', trigger: 'change' }],
  dispatch: [{ required: true, message: '请选择派送方式', trigger: 'change' }],
  isCreate: [{ required: true, message: '请选择是否生成转单号', trigger: 'change' }],
  includeTax: [{ required: true, message: '请选择是否包税', trigger: 'change' }],
  coverTank: [{ required: true, message: '请选择是否支持锁舱', trigger: 'change' }],
  categories: [{ required: true, message: '请选择商品属性', trigger: 'change' }],
  chargeGroupId: [{ required: true, message: '请选择计费发票费用组', trigger: 'change' }],
  deductibles: [{ required: true, message: '免赔金额不能为空', trigger: 'blur' }],
  priceC: [{ required: true, message: '报关价比率不能为空', trigger: 'blur' }],
  tax: [{ required: true, message: '关税预付比率不能为空', trigger: 'blur' }],
  insurance: [{ required: true, message: '保险费比率不能为空', trigger: 'blur' }],
  examine: [{ required: true, message: '请选择是否验货', trigger: 'change' }],
  examineId: [{ required: true, message: '请选择验货配置', trigger: 'change' }],
  pWeight: [{ required: true, message: '分单重量上限不能为空', trigger: 'blur' }],
  pVolume: [{ required: true, message: '分单体积上限不能为空', trigger: 'blur' }],
  pHscode: [{ required: true, message: '分单HSCODE数限制不能为空', trigger: 'blur' }]
}

/* 下拉数据源 */
const countryList = ref([])
const currencyList = ref([])
const supplierList = ref([])
const productList = ref([])
const wordsList = ref([])
const subtypeList = ref([])
const invoiceList = ref([])
const expressList = ref([])
const customsList = ref([])
const cardList = ref([])
const examineList = ref([])
const countryOptions = computed(() => countryList.value.map(it => ({ ...it, label: `${it.name}-${it.alias}` })))

const dispatchList = computed(() => {
  const { subtypeId, containerType, purposeType } = selectForm
  if (purposeType === 2) return [{ label: '到仓', value: '4' }]
  if ((subtypeId === '1' || subtypeId === '2') && containerType === '1') {
    return [{ label: '整柜直送', value: '3' }, { label: '自提', value: '2' }]
  }
  return [{ label: '卡派', value: '0' }, { label: '快递', value: '1' }, { label: '自提', value: '2' }]
})

const filterMethod = (query, item) => (item.name || item.label || '').indexOf(query) > -1
const purposeTypeChange = () => { selectForm.dispatch = '' }
const onDispatch = () => {
  selectForm.escs = []
  selectForm.kscId = undefined
  if (selectForm.dispatch !== '1') selectForm.isCreate = 0
}
const onChargeType = () => {
  selectForm.pVolume = undefined; selectForm.pWeight = undefined; selectForm.pHscode = undefined
  selectForm.remind = false; selectForm.escs = []; selectForm.kscId = undefined
}
const onSubtype = val => {
  selectForm.departureId = []
  selectForm.destinationId = []
  selectForm.orgTag = undefined
  selectForm.coverTank = (val === '1' || val === '2') ? '0' : undefined
  portList.value = []
  selectForm.containerType = undefined
  selectForm.custId = undefined
  selectForm.dispatch = undefined
  selectForm.escs = []
  selectForm.kscId = undefined
  selectForm.priceType = '2'
  supplierList.value = []
}
const handleStates = () => { isItemDialogShow.value = true }
const isItemDialogShow = ref(false)

const getCustTypeList = async () => {
  selectLoading.value = true
  try { supplierList.value = (await getSupplierOptions()).data } finally { selectLoading.value = false }
}

/* 快递服务穿梭 */
const dialogExpress = ref(false)
const expressOption = ref([])
const handleExpress = async () => {
  expressOption.value = [...selectForm.escs]
  dialogExpress.value = true
  dialogLoading.value = true
  try { expressList.value = (await getEscList()).data } finally { dialogLoading.value = false }
}
const cancelExpress = () => { dialogExpress.value = false; expressOption.value = [] }
const saveExpress = () => { dialogExpress.value = false; selectForm.escs = [...expressOption.value] }

/* 起运港/目的港选择 */
const dialogPort = ref(false)
const portTitle = ref('')
const portName = ref('')
const portList = ref([])
const portOption = ref([])
const tt = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)
const pagedPortList = computed(() => {
  const start = (page.value - 1) * size.value
  return portList.value.slice(start, start + size.value)
})
const handlePort = async val => {
  tt.value = val
  if (val === 'qi' && !selectForm.countryId) { ElMessage.error('请选择起运国'); return }
  if (val === 'mu' && (!Array.isArray(selectForm.countryToIds) || selectForm.countryToIds.length <= 0)) { ElMessage.error('请选择目的国'); return }
  dialogPort.value = true
  if (val === 'qi') { portTitle.value = '起运港'; portOption.value = [...selectForm.departureId] }
  else { portTitle.value = '目的港'; portOption.value = [...selectForm.destinationId] }
  await getPortData(1)
}
const cancelPort = () => { dialogPort.value = false; portName.value = ''; portOption.value = []; portList.value = [] }
const savePort = () => {
  dialogPort.value = false
  if (tt.value === 'qi') selectForm.departureId = [...portOption.value]
  else selectForm.destinationId = [...portOption.value]
}
const getPortData = async val => {
  if (val) page.value = val
  const type = selectForm.subtypeId === '3' ? '0' : selectForm.subtypeId
  const countryId = tt.value === 'qi' ? selectForm.countryId : selectForm.countryToIds.join(',')
  dialogLoading.value = true
  try {
    const result = (await privatelineApi.getPorts(countryId, type, portName.value)).data || []
    portList.value = result.map(it => ({ id: it.id, name: it.name, code: it.code }))
    total.value = portList.value.length
  } finally {
    dialogLoading.value = false
  }
}
const togglePort = row => {
  const index = portOption.value.findIndex(item => item.id === row.id)
  if (index === -1) portOption.value.push({ id: row.id, name: row.name, code: row.code })
  else portOption.value.splice(index, 1)
}
const handleRemove = index => { portOption.value.splice(index, 1) }

/* 数据加载 */
const loadDropdowns = async () => {
  countryList.value = (await getCountryList()).data
  currencyList.value = (await getCurrencyList()).data
  productList.value = (await getProductList()).data
  subtypeList.value = (await getServiceSubtypeList('05')).data.filter(it => it.id !== '3')
  wordsList.value = (await getWordsList('server_terms')).data
  invoiceList.value = (await getCostgroupList()).data
  customsList.value = (await getCscList()).data.filter(it => it.status === '1')
  cardList.value = (await getKscList()).data.filter(it => it.status === '1')
  examineList.value = (await getExamineList()).data
}

const setData = async () => {
  formLoading.value = true
  try {
    await loadDropdowns()
    if (props.isEdit && props.row) {
      const res = (await privatelineApi.getById(props.row.id)).data || {}
      const { name, abbr, id, lsId, deliveryId, departureId, departureName, destinationId, destinationName, escs, targets, usages, categories, terms: t, ...form } = res
      const depName = departureName ? departureName.split(',') : []
      const desName = destinationName ? destinationName.split(',') : []
      const depId = departureId ? String(departureId).split(',') : []
      const desId = destinationId ? String(destinationId).split(',') : []
      const arrDep = depId.map((it, index) => ({ id: it, name: depName[index] }))
      const arrDes = desId.map((it, index) => ({ id: it, name: desName[index] }))
      const arrT = (targets || []).map(item => item.countryId)
      const arrE = (escs || []).map(it => it.id)
      Object.assign(selectForm, formParam(), {
        ...form,
        name: props.isCopy ? undefined : name,
        abbr: props.isCopy ? undefined : abbr,
        id: props.isCopy ? undefined : id,
        lsId: props.isCopy ? undefined : lsId,
        usages: usages ? String(usages).split(',') : [],
        categories: categories ? String(categories).split(',') : [],
        departureId: arrDep,
        destinationId: arrDes,
        countryToIds: arrT,
        escs: arrE
      })
      terms.value = t || ''
      await getCustTypeList()
    }
  } finally {
    formLoading.value = false
  }
}

const handleBack = () => { emit('back') }
const handleSave = () => {
  selectFormRef.value.validate(valid => {
    if (!valid) return false
    const { deliveryId, departureId, destinationId, escs, usages, categories, countryToIds, orgTag, ...form } = selectForm
    if (Array.isArray(departureId) && departureId.length <= 0) { ElMessage.error('请选择起运港'); return }
    if (Array.isArray(destinationId) && selectForm.subtypeId !== '3' && destinationId.length <= 0) { ElMessage.error('请选择目的港'); return }
    if (selectForm.umLength === 'FT' && (selectForm.umWeight !== 'LBS' || selectForm.umVolume !== 'CUFT')) { ElMessage.error('长度单位，重量单位，体积单位必须一致'); return }
    if (selectForm.umLength !== 'FT' && (selectForm.umWeight === 'LBS' || selectForm.umVolume === 'CUFT')) { ElMessage.error('长度单位，重量单位，体积单位必须一致'); return }
    if (selectForm.umWeight === 'LBS' && selectForm.umVolume !== 'CUFT') { ElMessage.error('长度单位，重量单位，体积单位必须一致'); return }
    if (selectForm.dispatch === '1' && Array.isArray(escs) && escs.length <= 0) { ElMessage.error('请选择打单快递服务'); return }
    formLoading.value = true
    try {
      const params = {
        ...form,
        orgTag: (selectForm.subtypeId === '1' && countryToIds.some(it => it === 'US')) ? orgTag : undefined
      }
      params.terms = terms.value
      invoiceList.value.forEach(item => { if (item.id === params.chargeGroupId) params.chargeGroupName = item.name })
      productList.value.forEach(item => { if (item.id === params.productId) params.productName = item.productName })
      if (Array.isArray(departureId)) {
        params.departureId = departureId.map(d => d.id).join(',')
        params.departureName = departureId.map(d => (d.code ? d.code + '-' : '') + d.name).join(',')
      }
      if (Array.isArray(destinationId)) {
        params.destinationId = destinationId.map(d => d.id).join(',')
        params.destinationName = destinationId.map(d => (d.code ? d.code + '-' : '') + d.name).join(',')
      }
      if (Array.isArray(escs)) {
        params.escs = escs.map(d => {
          const item = expressList.value.find(a => a.id === d) || {}
          return { id: item.id, name: item.name }
        }).filter(it => it.id && it.name)
      }
      if (Array.isArray(usages)) params.usages = usages.join(',')
      if (Array.isArray(categories)) params.categories = categories.join(',')
      customsList.value.forEach(it => { if (it.id === params.cscId) params.cscName = it.name })
      cardList.value.forEach(it => { if (it.id === params.kscId) params.kscName = it.name })
      subtypeList.value.forEach(it => { if (it.id === params.subtypeId) params.subtypeName = it.name })
      examineList.value.forEach(it => { if (it.id === params.examineId) params.examineName = it.name })
      params.targets = []
      countryList.value.forEach(item => {
        if (item.id === params.countryId) params.countryName = item.name
        countryToIds.forEach(ele => {
          if (ele === item.id) params.targets.push({ countryId: item.id, countryName: item.name })
        })
      })
      supplierList.value.forEach(item => { if (item.id === params.custId) params.custName = item.name })
      currencyList.value.forEach(item => { if (item.id === params.currencyId) params.currencyName = item.name })
      if (!params.status) params.status = '1'
      privatelineApi.save(params)
      ElMessage.success('保存成功')
      emit('confirm')
    } finally {
      formLoading.value = false
    }
  })
}

onMounted(setData)
</script>

<style lang="scss" scoped>
.detail-form :deep(.el-form-item) { display: inline-block; width: 24.9%; }
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
.input-capacity { display: flex; flex-direction: row; flex-wrap: nowrap; }
.input-unit {
  width: 55px; height: 32px; background-color: #f5f7fa; color: #909399; padding: 0 10px;
  border: 1px solid #dcdfe6; border-left: 0; border-radius: 0 4px 4px 0; margin-left: -1px;
}
.input-border :deep(.el-input__inner) { border-radius: 4px 0 0 4px; }
.privateline-edit {
  padding: 0;
  .header-top {
    text-align: right; height: 50px; line-height: 50px; padding: 0 20px;
    font-size: 16px; color: #666666; border-bottom: 1px solid #cccccc;
  }
  .content {
    padding: 20px;
    .form-title {
      height: 35px; line-height: 35px; font-size: 16px; font-weight: 700;
      background: #f2f2f2; padding-left: 20px; margin-bottom: 20px;
    }
  }
}
.items {
  height: 450px; overflow: auto; border: 1px solid #e6ebf5;
  .items-head { padding: 10px; background-color: #dfdfdf; margin-bottom: 15px; }
  .el-tag { margin: 0 6px 6px 0; }
}
.filter .el-input { display: inline-block; width: 220px; margin: 10px; }
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
