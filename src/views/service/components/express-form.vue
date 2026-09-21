<template>
  <div v-loading="formLoading" class="app-panel express-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit && !isCopy ? '编辑快递服务' : '新增快递服务' }}</div>
      <el-button type="primary" size="small" @click="handleBack">返 回</el-button>
      <el-button type="primary" size="small" @click="handleSave">保 存</el-button>
    </div>

    <div class="content">
      <el-form ref="selectFormRef" :model="selectForm" :rules="formRules" label-width="160px" class="detail-form" size="small">
        <div class="form-title"><span>基础信息</span></div>

        <el-form-item label="服务名称" prop="name">
          <el-input v-model="selectForm.name" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务简称" prop="abbr">
          <el-input v-model="selectForm.abbr" :maxlength="10" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="selectForm.belong" placeholder="请选择" size="small" clearable style="width: 100%">
            <el-option label="直客" value="0" />
            <el-option label="同行" value="1" />
            <el-option label="同行&直客" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务编码" prop="expressCode">
          <el-input v-model="selectForm.expressCode" size="small" placeholder="请输入" :maxlength="25" show-word-limit />
        </el-form-item>
        <el-form-item label="起运国" prop="countryId">
          <el-select v-model="selectForm.countryId" :loading="selectLoading" size="small" filterable clearable placeholder="请选择" style="width: 100%" @change="clearOrg">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递公司" prop="expressId">
          <el-select v-model="selectForm.expressId" :disabled="!selectForm.countryId" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="getExpressCompanyList" @change="onExpress">
            <el-option v-for="item in expressList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="selectForm.subtypeId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @change="subtypeChange">
            <el-option v-for="item in typeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="selectForm.umWeight" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @change="val => handlerChange(val, 'weight_type')">
            <el-option v-for="item in umWeightList" :key="item.value" :label="`${item.label}-${item.value}`" :disabled="item.disabled" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度单位" prop="umMeasure">
          <el-select v-model="selectForm.umMeasure" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @change="val => handlerChange(val, 'measurement_type')">
            <el-option v-for="item in umMeasureList" :key="item.value" :label="`${item.label}-${item.value}`" :disabled="item.disabled" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="货币单位" prop="currencyId">
          <el-select v-model="selectForm.currencyId" :loading="selectLoading" clearable filterable style="width: 100%" size="small" placeholder="请选择" @focus="getCurrencyList">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认供应商" prop="defaultSupplierId">
          <el-select v-model="selectForm.defaultSupplierId" size="small" clearable filterable style="width: 100%" placeholder="请选择" @focus="getCustTypeList">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- <el-form-item label="备注" prop="remark">
          <el-input v-model="selectForm.remark" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item> -->

        <div class="form-title"><span>参数&配置</span></div>

        <!-- <el-form-item label="同行体积重单位" prop="vw1">
          <el-input-number v-model="selectForm.vw1" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item>
        <el-form-item label="直客体积重单位" prop="vw2">
          <el-input-number v-model="selectForm.vw2" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item> -->
        <el-form-item label="是否控制打单量" prop="ifPrintNum">
          <el-radio-group v-model="selectForm.ifPrintNum" @change="onPrint">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="selectForm.ifPrintNum === 1" label="控制方式" prop="printMethod">
          <el-select v-model="selectForm.printMethod" placeholder="请选择" size="small" clearable style="width: 100%">
            <el-option label="按打单金额" :value="1" />
            <el-option label="按重量" :value="2" />
            <el-option label="按方数" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectForm.ifPrintNum === 1" label="阀值" prop="printThreshold">
          <el-input-number v-model="selectForm.printThreshold" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item>
        <el-form-item v-if="selectForm.ifPrintNum === 1" label="周期" prop="cycling">
          <el-select v-model="selectForm.cycling" placeholder="请选择" size="small" clearable style="width: 100%">
            <el-option label="每天" :value="1" />
            <el-option label="每周" :value="2" />
            <el-option label="每月" :value="3" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="expressStr === 'ups'" label="是否第三方支付" prop="ifOtherPay">
          <el-radio-group v-model="selectForm.ifOtherPay">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="expressStr === 'ups' && selectForm.ifOtherPay === 1" label="物流支付账号" prop="payNo">
          <el-input v-model="selectForm.payNo" :maxlength="36" size="small" placeholder="请输入" />
        </el-form-item>

        <el-form-item label="物流接口账号" prop="paramId">
          <el-select v-model="selectForm.paramId" :loading="selectLoading" :disabled="!selectForm.expressId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="loadLogisticsPort" @change="onPort">
            <el-option v-for="item in portList" :key="item.id" :label="item.username" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="物流支付类型" prop="payType">
          <el-select v-model="selectForm.payType" :loading="selectLoading" :disabled="!selectForm.expressId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="loadPayMethod">
            <el-option v-for="item in payTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="expressStr === 'dpd' ? '服务供应商' : '服务代码'" prop="serviceCode">
          <el-select v-model="selectForm.serviceCode" :loading="selectLoading" :disabled="!selectForm.expressId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="loadServiceCode" @change="onServiceCode">
            <el-option v-for="item in serviceCodeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="包裹类别" prop="packageType">
          <el-select v-model="selectForm.packageType" :loading="selectLoading" :disabled="!selectForm.expressId" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="loadPkgCode">
            <el-option v-for="item in packageCodeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="expressStr === 'ups' && selectForm.paramId && selectForm.gfp === 1" label="货物分类" prop="classification">
          <el-select v-model="selectForm.classification" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="getRelateData('4')">
            <el-option v-for="item in classificList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="expressStr === 'ups' && selectForm.paramId && selectForm.gfp === 1" label="handlingUnit数量" prop="handlingUnitQuantity">
          <el-input-number v-model="selectForm.handlingUnitQuantity" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item v-if="expressStr === 'ups' && selectForm.paramId && selectForm.gfp === 1" label="handlingUnit类型" prop="handlingUnitType">
          <el-select v-model="selectForm.handlingUnitType" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="getRelateData('6')">
            <el-option v-for="item in huTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="expressStr === 'fedex'" label="dropoff类型" prop="dropoffType">
          <el-select v-model="selectForm.dropoffType" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="getRelateData('3')">
            <el-option v-for="(item, index) in dropoffTypeList" :key="index" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="expressStr === 'dpd'" label="服务类型" prop="serviceTypeName">
          <el-select v-model="selectForm.serviceTypeName" :loading="selectLoading" :disabled="!selectForm.serviceCode" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="loadDPDserviceType" @change="onServiceType">
            <el-option v-for="(item, index) in serviceTypeList" :key="index" :label="item.serviceTypeName" :value="item.serviceTypeName" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="expressStr === 'dpd'" label="EORI税号" prop="eoriNumber">
          <el-input v-model="selectForm.eoriNumber" :disabled="!selectForm.serviceTypeName" autocomplete="off" :maxlength="50" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="expressStr === 'dpd'" label="增值税税号" prop="vatNumber">
          <el-input v-model="selectForm.vatNumber" :disabled="!selectForm.serviceTypeName" autocomplete="off" :maxlength="50" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="expressStr === 'dpd'" label="关税支付人" prop="dutyPaidBy">
          <el-select v-model="selectForm.dutyPaidBy" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 100%" @focus="getRelateData('5')">
            <el-option v-for="item in dutyPaidList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="货值上限" prop="maxValueGoods">
          <el-input-number v-model="selectForm.maxValueGoods" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999999" />
        </el-form-item>

        <div class="form-title"><span>发货人公司</span></div>
        <el-form-item label="姓名" prop="consignor">
          <el-input v-model="selectForm.consignor" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="公司">
          <el-input v-model="selectForm.consignorCompany" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="电话" prop="consignorPhone">
          <el-input v-model="selectForm.consignorPhone" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="传真" prop="consignorFax">
          <el-input v-model="selectForm.consignorFax" :maxlength="30" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="邮箱" prop="consignorMail">
          <el-input v-model="selectForm.consignorMail" :maxlength="30" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="税号" prop="consignorTaxCode">
          <el-input v-model="selectForm.consignorTaxCode" :maxlength="30" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="国家/地区" prop="consignorCountryCode">
          <el-select v-model="selectForm.consignorCountryCode" :loading="selectLoading" size="small" filterable clearable placeholder="请选择" style="width: 100%" @change="onCountry">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="consignorProvinceCode">
          <el-select v-model="selectForm.consignorProvinceCode" :loading="selectLoading" :disabled="!selectForm.consignorCountryCode" size="small" filterable clearable placeholder="请选择" style="width: 100%" @focus="getProvince" @change="onProvince">
            <el-option v-for="item in provinceList" :key="item.abbr" :label="`${item.name}-${item.alias}`" :value="item.abbr" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="consignorCityCode">
          <el-input v-model="selectForm.consignorCityCode" :disabled="!selectForm.consignorProvinceCode" :maxlength="50" size="small" placeholder="请输入" />
          <!-- <el-select
            v-model="selectForm.consignorCityCode"
            :loading="selectLoading"
            :disabled="!selectForm.consignorProvinceCode"
            size="small"
            filterable
            clearable
            placeholder="请选择"
            style="width:100%;"
            @focus="getCity"
          >
            <el-option
              v-for="item in cityList"
              :key="item.id"
              :label="`${item.name}-${item.alias}`"
              :value="item.id"
            />
          </el-select> -->
        </el-form-item>
        <el-form-item label="详细地址1" prop="consignorAddress1">
          <el-input v-model="selectForm.consignorAddress1" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细地址2" prop="consignorAddress2">
          <el-input v-model="selectForm.consignorAddress2" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细地址3" prop="consignorAddress3">
          <el-input v-model="selectForm.consignorAddress3" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="邮编" prop="consignorZip">
          <el-input v-model="selectForm.consignorZip" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
      </el-form>
      <div class="form-title"><span>运输条款</span></div>
      <!-- 源 toast-ui MarkdownEditor 降级为 textarea -->
      <div>
        <el-input v-model="terms" type="textarea" :rows="10" placeholder="请输入运输条款" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import {
  expressApi, getExpressCompany, getLogisticsPort, getCurrencyList, getSupplierOptions,
  getServiceCode, getPayMethod, getPkgCode, getDPDserviceType, getExpressWords, getStateByCountry
} from '@/api/modules/service'

defineOptions({ name: 'ExpressAddEditForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null },
  countryList: { type: Array, default: () => [] },
  typeList: { type: Array, default: () => [] }
})
const emit = defineEmits(['back', 'save-success'])

const defaultForm = () => ({
  name: undefined, abbr: undefined, subtypeId: undefined, countryId: undefined, currencyId: undefined,
  defaultSupplierId: undefined, expressId: undefined, expressName: undefined, belong: undefined,
  expressCode: undefined, umWeight: undefined, umMeasure: undefined, payNo: undefined, paramId: undefined,
  paramName: undefined, payType: undefined, packageType: undefined, dropoffType: undefined,
  serviceCode: undefined, serviceTypeName: undefined, dutyPaidBy: undefined, terms: undefined,
  ifPrintNum: 0, maxValueGoods: 0, printMethod: undefined, printThreshold: undefined, cycling: 2,
  ifOtherPay: 0, settlement: undefined, gfp: undefined,
  consignor: undefined, consignorAddress1: undefined, consignorAddress2: undefined, consignorAddress3: undefined,
  consignorCityCode: undefined, consignorCountryCode: undefined, consignorFax: undefined, consignorCompany: undefined,
  consignorMail: undefined, consignorPhone: undefined, consignorProvinceCode: undefined, consignorTaxCode: undefined,
  consignorZip: undefined, classification: undefined, handlingUnitQuantity: undefined, handlingUnitType: undefined,
  eoriNumber: undefined, vatNumber: undefined
})
const selectForm = reactive(defaultForm())
const selectFormRef = ref()
const terms = ref('')
const expressStr = ref('')
const selectLoading = ref(false)
const formLoading = ref(false)

const currencyList = ref([])
const supplierList = ref([])
const expressList = ref([])
const umWeightList = ref([])
const umMeasureList = ref([])
const portList = ref([])
const payTypeList = ref([])
const packageCodeList = ref([])
const serviceCodeList = ref([])
const serviceTypeList = ref([])
const classificList = ref([])
const huTypeList = ref([])
const dropoffTypeList = ref([])
const dutyPaidList = ref([])
const provinceList = ref([])
const cityList = ref([])

const codeValidator = (rule, value, cb) => {
  const reg = /^[a-zA-Z0-9 .·_-]+$/
  if (!value) cb(new Error('服务编码不能为空'))
  else if (!reg.test(value)) cb(new Error('服务编码不能有中文及特殊字符'))
  else cb()
}
const noChineseValidator = (msg, required = true) => (rule, value, cb) => {
  const reg = /[一-龥]/
  if (required && !value) cb(new Error(msg))
  else if (value && reg.test(value)) cb(new Error(msg.replace('不能为空', '不能是中文')))
  else cb()
}
const zipValidator = (rule, value, cb) => {
  const reg = /^[a-zA-Z0-9]*$/
  if (!reg.test(value)) cb(new Error('邮编只能包含数字、字母')); else cb()
}
const phoneValidator = (rule, value, cb) => {
  const reg = /[一-龥]/
  if (value && reg.test(value)) cb(new Error('电话不能有中文')); else cb()
}
const formRules = {
  name: [{ required: true, message: '服务名称不能为空', trigger: 'blur' }],
  abbr: [{ required: true, message: '服务简称不能为空', trigger: 'blur' }],
  subtypeId: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  countryId: [{ required: true, message: '请选择起运国', trigger: 'change' }],
  expressId: [{ required: true, message: '请选择快递公司', trigger: 'blur' }],
  belong: [{ required: true, message: '请选择分配客户', trigger: 'change' }],
  expressCode: [{ required: true, message: '服务编码不能为空', trigger: 'blur' }, { validator: codeValidator, trigger: 'blur' }],
  umWeight: [{ required: true, message: '请选择重量单位', trigger: 'change' }],
  umMeasure: [{ required: true, message: '请选择长度单位', trigger: 'change' }],
  currencyId: [{ required: true, message: '请选择货币单位', trigger: 'change' }],
  payNo: [{ required: true, message: '物流支付账号不能为空', trigger: 'blur' }, { validator: noChineseValidator('物流支付账号不能为空'), trigger: 'blur' }],
  paramId: [{ required: true, message: '请选择物流接口账号', trigger: 'change' }],
  ifOtherPay: [{ required: true, message: '请选择是否第三方支付', trigger: 'change' }],
  ifPrintNum: [{ required: true, message: '请选择是否控制打单量', trigger: 'change' }],
  printMethod: [{ required: true, message: '请选择控制方式', trigger: 'change' }],
  printThreshold: [{ required: true, message: '阀值不能为空', trigger: 'blur' }],
  cycling: [{ required: true, message: '请选择周期', trigger: 'change' }],
  payType: [{ required: true, message: '请选择物流支付类型', trigger: 'change' }],
  packageType: [{ required: true, message: '请选择UPS包裹类别码', trigger: 'change' }],
  dropoffType: [{ required: true, message: '请选择dropoff类型', trigger: 'change' }],
  classification: [{ required: true, message: '请选择货物分类', trigger: 'change' }],
  serviceCode: [{ required: true, message: '请选择服务代码', trigger: 'change' }],
  serviceTypeName: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  dutyPaidBy: [{ required: true, message: '请选择关税支付人', trigger: 'change' }],
  consignor: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  consignorPhone: [{ required: true, message: '电话不能为空', trigger: 'blur' }, { validator: phoneValidator, trigger: 'blur' }],
  consignorMail: [{ required: true, message: '邮箱地址不能为空', trigger: 'blur' }, { type: 'email', message: '邮箱地址格式不正确', trigger: ['blur', 'change'] }],
  consignorZip: [{ required: true, message: '邮编不能为空', trigger: 'blur' }, { validator: zipValidator, trigger: 'blur' }],
  consignorCountryCode: [{ required: true, message: '请选择国家/地区', trigger: 'change' }],
  consignorProvinceCode: [{ required: true, message: '请选择州/省', trigger: 'change' }],
  consignorCityCode: [{ required: true, message: '请选择城市', trigger: 'change' }],
  consignorAddress1: [{ required: true, message: '详细地址1不能为空', trigger: 'blur' }],
  consignorAddress2: [{ required: false, message: '详细地址2不能为空', trigger: 'blur' }],
  consignorAddress3: [{ required: false, message: '详细地址3不能为空', trigger: 'blur' }]
}

/* 重量/长度单位互斥禁用（源 handlerChange） */
const handlerChange = (val, type) => {
  if (type === 'weight_type') {
    let disList = []
    if (val === 'KGS') disList = ['IN', 'FT']
    else if (val === 'LBS') disList = ['CM']
    umMeasureList.value = umMeasureList.value.map(e => ({ ...e, disabled: disList.indexOf(e.value) !== -1 }))
  } else {
    let disList = []
    if (val === 'IN' || val === 'FT') disList = ['KGS']
    else if (val === 'CM') disList = ['LBS']
    umWeightList.value = umWeightList.value.map(e => ({ ...e, disabled: disList.indexOf(e.value) !== -1 }))
  }
}

const clearOrg = () => { selectForm.expressId = undefined; expressList.value = []; onExpress() }
const onCountry = () => { selectForm.consignorProvinceCode = undefined; selectForm.consignorCityCode = undefined; provinceList.value = []; cityList.value = [] }
const onProvince = () => { selectForm.consignorCityCode = undefined; cityList.value = [] }
const getProvince = async () => {
  selectLoading.value = true
  try { provinceList.value = (await getStateByCountry(selectForm.consignorCountryCode)).data } finally { selectLoading.value = false }
}

const getExpressCompanyList = async () => {
  selectLoading.value = true
  try { expressList.value = (await getExpressCompany(selectForm.countryId, '4')).data } finally { selectLoading.value = false }
}
const getCurrencyList2 = async () => { currencyList.value = (await getCurrencyList()).data }
const subtypeChange = () => { selectForm.defaultSupplierId = undefined }
const getCustTypeList = async () => { supplierList.value = (await getSupplierOptions()).data }

const onExpress = () => {
  expressStr.value = undefined
  selectForm.expressName = undefined
  expressList.value.forEach(it => {
    if (it.id === selectForm.expressId) { selectForm.expressName = it.name; expressStr.value = it.code.toLowerCase() }
  })
  portList.value = []; payTypeList.value = []; packageCodeList.value = []; serviceCodeList.value = []
  serviceTypeList.value = []; dutyPaidList.value = []; dropoffTypeList.value = []
  selectForm.dropoffType = undefined; selectForm.paramId = undefined; selectForm.payType = undefined
  selectForm.packageType = undefined; selectForm.eoriNumber = undefined; selectForm.vatNumber = undefined
  selectForm.serviceCode = undefined; selectForm.serviceTypeName = undefined; selectForm.dutyPaidBy = undefined
  onPort()
}

/* 接口账号关联字典（gfp / 承运商决定） */
const getRelateData = str => {
  if (str === '3' && expressStr.value === 'fedex') loadWords('DropoffType')
  else if (str === '4' && expressStr.value === 'ups' && selectForm.gfp === 1) loadWords('UPS_GROUND_FREIGHT_CLASSES')
  else if (str === '5') loadWords('DPD_DUTY_PAID')
  else if (str === '6' && expressStr.value === 'ups' && selectForm.gfp === 1) loadWords('UPS_HANDLING_UNIT_CODES')
}
const loadWords = async type => {
  selectLoading.value = true
  try {
    const data = (await getExpressWords(type)).data
    if (type === 'UPS_GROUND_FREIGHT_CLASSES') classificList.value = data
    else if (type === 'UPS_HANDLING_UNIT_CODES') huTypeList.value = data
    else if (type === 'DPD_DUTY_PAID') dutyPaidList.value = data
    else if (type === 'DropoffType') dropoffTypeList.value = data
  } finally { selectLoading.value = false }
}
/* 重量/长度单位字典（固定 KGS/LBS、IN/FT/CM） */
const loadUnits = async () => {
  const w = (await getExpressWords('weight_type')).data
  const m = (await getExpressWords('measurement_type')).data
  umWeightList.value = [{ label: '千克', value: 'KGS' }, { label: '磅', value: 'LBS' }].map(e => ({ ...e, disabled: false }))
  umMeasureList.value = [{ label: '英寸', value: 'IN' }, { label: '英尺', value: 'FT' }, { label: '厘米', value: 'CM' }].map(e => ({ ...e, disabled: false }))
}

const loadLogisticsPort = async () => {
  selectLoading.value = true
  try { portList.value = (await getLogisticsPort(selectForm.expressId)).data } finally { selectLoading.value = false }
}
const onPort = () => {
  selectForm.paramName = undefined; selectForm.gfp = undefined
  portList.value.forEach(it => { if (selectForm.paramId === it.id) { selectForm.paramName = it.username; selectForm.gfp = it.gfp } })
  classificList.value = []; huTypeList.value = []
  selectForm.classification = undefined; selectForm.handlingUnitType = undefined; selectForm.handlingUnitQuantity = undefined
}
const loadServiceCode = async () => {
  selectLoading.value = true
  try { serviceCodeList.value = (await getServiceCode(expressStr.value)).data } finally { selectLoading.value = false }
}
const loadPayMethod = async () => {
  selectLoading.value = true
  try { payTypeList.value = (await getPayMethod(expressStr.value)).data } finally { selectLoading.value = false }
}
const loadPkgCode = async () => {
  selectLoading.value = true
  try { packageCodeList.value = (await getPkgCode(expressStr.value)).data } finally { selectLoading.value = false }
}
const onPrint = () => {
  if (selectForm.ifPrintNum === 0) { selectForm.printMethod = undefined; selectForm.printThreshold = undefined; selectForm.cycling = undefined }
  else selectForm.cycling = 2
}
const onServiceCode = () => { selectForm.serviceTypeName = undefined; serviceTypeList.value = []; selectForm.dutyPaidBy = undefined; dutyPaidList.value = [] }
const onServiceType = () => { selectForm.vatNumber = undefined; selectForm.eoriNumber = undefined }
const loadDPDserviceType = async () => {
  selectLoading.value = true
  try { serviceTypeList.value = (await getDPDserviceType(selectForm.serviceCode)).data } finally { selectLoading.value = false }
}

const handleBack = () => emit('back')
const handleSave = () => {
  selectFormRef.value.validate(async valid => {
    if (!valid) return
    formLoading.value = true
    try {
      const {
        consignor, consignorCompany, consignorAddress1, consignorAddress2, consignorAddress3,
        consignorCityCode, consignorCountryCode, consignorFax, consignorMail, consignorPhone,
        consignorProvinceCode, consignorTaxCode, consignorZip, ...form
      } = selectForm
      const consignorEntity = {
        consignor, consignorCompany, consignorAddress1, consignorAddress2, consignorAddress3,
        consignorCityCode, consignorCountryCode, consignorFax, consignorMail, consignorPhone,
        consignorProvinceCode, consignorTaxCode, consignorZip
      }
      const params = { ...form, terms: terms.value }
      props.countryList.forEach(item => {
        if (item.id === consignorCountryCode) consignorEntity.consignorCountry = item.alias
        if (item.id === params.countryId) params.countryName = item.name
      })
      provinceList.value.forEach(item => { if (item.abbr === consignorProvinceCode) consignorEntity.consignorProvince = item.alias })
      consignorEntity.consignorCity = consignorCityCode
      currencyList.value.forEach(it => { if (it.id === params.currencyId) params.currencyName = it.name })
      supplierList.value.forEach(it => { if (it.id === params.defaultSupplierId) params.defaultSupplierName = it.name })
      params.consignorEntity = consignorEntity
      // 复制：去 id 走新增
      if (props.isCopy) delete params.id
      await expressApi.save(params)
      ElMessage.success('保存成功')
      emit('save-success')
    } finally {
      formLoading.value = false
    }
  })
}

onMounted(async () => {
  await loadUnits()
  await getCurrencyList2()
  await getCustTypeList()
  if (props.row) {
    formLoading.value = true
    const { consignorEntity, terms: t, ...form } = { ...props.row }
    Object.assign(selectForm, defaultForm(), form, consignorEntity || {})
    terms.value = t || ''
    // 复制：去掉 id/name/abbr/expressCode
    if (props.isCopy) { selectForm.id = undefined; selectForm.name = undefined; selectForm.abbr = undefined; selectForm.expressCode = undefined }
    await getExpressCompanyList()
    expressList.value.forEach(it => { if (selectForm.expressId === it.id) expressStr.value = it.code.toLowerCase() })
    await loadLogisticsPort()
    portList.value.forEach(it => { if (selectForm.paramId === it.id) selectForm.gfp = it.gfp })
    await Promise.all([loadServiceCode(), loadPayMethod(), loadPkgCode()])
    getRelateData('4'); getRelateData('6')
    if (expressStr.value === 'dpd') { getRelateData('5'); loadDPDserviceType() }
    else if (expressStr.value === 'fedex') getRelateData('3')
    if (selectForm.consignorCountryCode) await getProvince()
    formLoading.value = false
  }
  nextTick(() => selectFormRef.value && selectFormRef.value.clearValidate())
})
</script>

<style scoped lang="scss">
.detail-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  column-gap: 16px;

  .form-title { grid-column: 1 / -1; }
  :deep(.el-form-item) { width: 100%; min-width: 0; }
  :deep(.el-form-item__label) { white-space: nowrap; }
  :deep(.el-form-item__content) { min-width: 0; }
}
.express-edit {
  padding: 0;
  .header-top {
    text-align: right; height: 50px; line-height: 50px; padding: 0 20px;
    font-size: 16px; color: #666; border-bottom: 1px solid #ccc;
  }
  .content {
    padding: 20px;
    .form-title {
      height: 35px; line-height: 35px; font-size: 16px; font-weight: 700;
      background: #f2f2f2; padding-left: 20px; margin-bottom: 20px;
    }
  }
}
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
</style>
