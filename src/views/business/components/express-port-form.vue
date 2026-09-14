<template>
  <div v-loading="formLoading" class="app-panel express-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit ? '编辑快递接口' : '新增快递接口' }}</div>
      <el-button type="primary" size="small" @click="handleBack">返 回</el-button>
      <el-button type="primary" size="small" @click="handleSave">保 存</el-button>
    </div>

    <div class="content">
      <el-form ref="selectFormRef" :model="selectForm" :rules="formRules" label-width="150px" class="detail-form" size="small">
        <div class="form-title"><span>基础信息</span></div>
        <el-form-item label="快递公司" prop="expressId">
          <el-select v-model="selectForm.expressId" :disabled="isEdit" style="width: 100%" size="small" clearable filterable placeholder="请选择" @change="onExpress">
            <el-option v-for="item in expressList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 源注释：服务编码字段默认隐藏
        <el-form-item label="服务编码" prop="codes">
          <el-input v-model="selectForm.codes" :disabled="isEdit" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        -->
        <el-form-item :label="selectForm.expressId === FEDEX_ID ? 'Account Number' : '登录名'" prop="username">
          <el-input v-model="selectForm.username" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item :label="selectForm.expressId === FEDEX_ID ? 'Meter Number' : '登录密码'" prop="password">
          <el-input v-model="selectForm.password" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item :label="selectForm.expressId === FEDEX_ID ? 'KEY' : '接口编码'" prop="interfaceCode">
          <el-input v-model="selectForm.interfaceCode" :disabled="isEdit" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item :label="selectForm.expressId === FEDEX_ID ? 'Password' : '访问授权码'" prop="accessLicenseNumber">
          <el-input v-model="selectForm.accessLicenseNumber" :disabled="isEdit" :maxlength="50" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="selectForm.remarks" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>

        <div class="form-title"><span>接口路径</span></div>
        <el-form-item v-for="(item, index) in urlList" :key="index" :label="item.label" class="is-required" style="width: 49.5%">
          <el-input v-model="item.value" disabled size="small" placeholder="请输入" />
        </el-form-item>

        <div class="form-title"><span>发运参数</span></div>
        <el-form-item label="运单包裹数量上限" prop="maximumPackages">
          <div class="input-content">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.maximumPackages" :disabled="isEdit" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
            </div>
            <div class="input-unit">个</div>
          </div>
        </el-form-item>
        <el-form-item label="单个包裹重量上限" prop="maximumWeightOfPackage">
          <div class="input-content">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.maximumWeightOfPackage" :disabled="isEdit" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
            </div>
            <div class="input-unit">KG</div>
          </div>
        </el-form-item>
        <el-form-item label="重量折扣" prop="weightDiscount">
          <div class="input-content">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.weightDiscount" :disabled="isEdit" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
            </div>
            <div class="input-unit">%</div>
          </div>
        </el-form-item>
        <el-form-item label="标签一式打印份数" prop="numberOfCopies">
          <el-input-number v-model="selectForm.numberOfCopies" :disabled="isEdit" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="打印标签格式(cm)" prop="labelStyle">
          <el-select v-model="selectForm.labelStyle" :disabled="isEdit" style="width: 100%" clearable>
            <el-option v-for="item in lengthList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <!-- 源注释：国外派件成本 / 默认运费折扣 默认隐藏
        <el-form-item label="国外派件成本" prop="deliveryCost">
          <div class="input-content">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.deliveryCost" :disabled="isEdit" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
            </div>
            <div class="input-unit">{{ selectForm.currency }}</div>
          </div>
        </el-form-item>
        <el-form-item label="默认运费折扣" prop="shippingDiscount">
          <div class="input-content">
            <div style="flex: 1">
              <el-input-number v-model="selectForm.shippingDiscount" :disabled="isEdit" class="input-number-valiate input-border" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
            </div>
            <div class="input-unit">%</div>
          </div>
        </el-form-item>
        -->
        <el-form-item label="体积重单位" prop="volumetricWeightUnit">
          <el-input-number v-model="selectForm.volumetricWeightUnit" :disabled="isEdit" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="需要打印发票" prop="printInvoice">
          <el-radio-group v-model="selectForm.printInvoice" :disabled="isEdit">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="GFP" prop="ifGfp">
          <el-radio-group v-model="selectForm.ifGfp" :disabled="isEdit">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>

        <div class="form-title"><span>账号信息</span></div>
        <el-form-item label="公司名称" prop="consignorCompany">
          <el-input v-model="selectForm.consignorCompany" :disabled="isEdit" :maxlength="36" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="国家/地区" prop="consignorCountryCode">
          <el-select v-model="selectForm.consignorCountryCode" :disabled="isEdit" :loading="selectLoading" size="small" filterable placeholder="所在国家" style="width: 100%" @change="onCountry">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="consignorProvinceCode">
          <el-select v-model="selectForm.consignorProvinceCode" :loading="selectLoading" :disabled="isEdit || !selectForm.consignorCountryCode" size="small" filterable clearable placeholder="请选择" style="width: 100%" @focus="getProvince('1')" @change="onProvince">
            <el-option v-for="item in province1List" :key="item.abbr" :label="`${item.name}-${item.alias}`" :value="item.abbr" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="consignorCityCode">
          <el-input v-model="selectForm.consignorCityCode" :disabled="isEdit || !selectForm.consignorProvinceCode" :maxlength="50" size="small" placeholder="请输入" />
          <!-- 源注释：城市改为下拉（city1List）默认隐藏 -->
        </el-form-item>
        <el-form-item label="联系人" prop="consignor">
          <el-input v-model="selectForm.consignor" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系电话" prop="consignorPhone">
          <el-input v-model="selectForm.consignorPhone" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="consignorMail">
          <el-input v-model="selectForm.consignorMail" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="传真号码" prop="consignorFax">
          <el-input v-model="selectForm.consignorFax" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="邮政编号" prop="consignorZip">
          <el-input v-model="selectForm.consignorZip" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="税码" prop="consignorTaxCode">
          <el-input v-model="selectForm.consignorTaxCode" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系地址1" prop="consignorAddress1">
          <el-input v-model="selectForm.consignorAddress1" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系地址2" prop="consignorAddress2">
          <el-input v-model="selectForm.consignorAddress2" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系地址3" prop="consignorAddress3">
          <el-input v-model="selectForm.consignorAddress3" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
        </el-form-item>

        <div class="form-title"><span>退货方信息</span></div>
        <el-form-item label="同发货方" prop="sameConsignor">
          <el-radio-group v-model="selectForm.sameConsignor" :disabled="isEdit">
            <el-radio :label="0">否</el-radio>
            <el-radio :label="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <span v-if="selectForm.sameConsignor === 0">
          <el-form-item label="公司名称" prop="returnCompany">
            <el-input v-model="selectForm.returnCompany" :disabled="isEdit" :maxlength="36" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="国家/地区" prop="returnCountryCode">
            <el-select v-model="selectForm.returnCountryCode" :disabled="isEdit" :loading="selectLoading" size="small" filterable placeholder="所在国家" style="width: 100%" @change="onCountryCode">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="州/省" prop="returnProvinceCode">
            <el-select v-model="selectForm.returnProvinceCode" :loading="selectLoading" :disabled="isEdit || !selectForm.returnCountryCode" size="small" filterable clearable placeholder="请选择" style="width: 100%" @focus="getProvince('2')" @change="onProvinceCode">
              <el-option v-for="item in province2List" :key="item.abbr" :label="`${item.name}-${item.alias}`" :value="item.abbr" />
            </el-select>
          </el-form-item>
          <el-form-item label="城市" prop="returnCityCode">
            <el-input v-model="selectForm.returnCityCode" :disabled="isEdit || !selectForm.returnProvinceCode" :maxlength="50" size="small" placeholder="请输入" />
            <!-- 源注释：城市改为下拉（city2List）默认隐藏 -->
          </el-form-item>
          <el-form-item label="联系人" prop="returnName">
            <el-input v-model="selectForm.returnName" :disabled="isEdit" :maxlength="10" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="联系电话" prop="returnPhone">
            <el-input v-model="selectForm.returnPhone" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="联系邮箱" prop="returnMail">
            <el-input v-model="selectForm.returnMail" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="传真号码" prop="returnFax">
            <el-input v-model="selectForm.returnFax" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="邮政编号" prop="returnZip">
            <el-input v-model="selectForm.returnZip" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="税码" prop="returnTaxCode">
            <el-input v-model="selectForm.returnTaxCode" :disabled="isEdit" :maxlength="20" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="联系地址1" prop="returnAddress1">
            <el-input v-model="selectForm.returnAddress1" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="联系地址2" prop="returnAddress2">
            <el-input v-model="selectForm.returnAddress2" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="联系地址3" prop="returnAddress3">
            <el-input v-model="selectForm.returnAddress3" :disabled="isEdit" :maxlength="100" size="small" placeholder="请输入" />
          </el-form-item>
        </span>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import {
  addExpressPort, updateExpressPort, getExpressPortById, getWordsList, getStateByCountry, getCityByState, geCurrencyList, FEDEX_ID
} from '@/api/modules/business'

defineOptions({ name: 'ExpressPortForm' })
const props = defineProps({
  countryList: { type: Array, default: () => [] },
  expressList: { type: Array, default: () => [] }
})
const emit = defineEmits(['back', 'go'])

const formParam = () => ({
  accessLicenseNumber: undefined, codes: undefined, consignor: undefined,
  consignorAddress1: undefined, consignorAddress2: undefined, consignorAddress3: undefined,
  consignorCity: undefined, consignorCityCode: undefined, consignorCompany: undefined,
  consignorCountry: undefined, consignorCountryCode: undefined, consignorDistrict: undefined, consignorDistrictCode: undefined,
  consignorFax: undefined, consignorMail: undefined, consignorPhone: undefined,
  consignorProvince: undefined, consignorProvinceCode: undefined, consignorTaxCode: undefined, consignorZip: undefined,
  currency: undefined, createTime: undefined, deliveryCost: 0, expressId: undefined, expressName: undefined, id: 0,
  ifGfp: 0, interfaceCode: undefined, labelOfUnit: 1, labelStyle: undefined,
  maximumPackages: 0, maximumWeightOfPackage: 0, numberOfCopies: 0, packagingType: undefined,
  password: undefined, printInvoice: 0, remarks: undefined, returnerEntity: {}, returnId: undefined,
  returnAddress1: undefined, returnAddress2: undefined, returnAddress3: undefined, returnCityCode: undefined, returnCityName: undefined,
  returnCompany: undefined, returnCountryCode: undefined, returnCountryName: undefined, returnDistrictCode: undefined, returnDistrictName: undefined,
  returnFax: undefined, returnMail: undefined, returnName: undefined, returnPhone: undefined,
  returnProvinceCode: undefined, returnProvinceName: undefined, returnTaxCode: undefined, returnZip: undefined,
  sameConsignor: 0, serviceCode: undefined, shipperNumber: undefined, shippingDiscount: 0,
  username: undefined, ifEnable: undefined, volumetricWeightUnit: undefined, weightDiscount: 0
})

const selectFormRef = ref()
const selectForm = reactive(formParam())
const isEdit = ref(false)
const currentId = ref('')
const province1List = ref([])
const province2List = ref([])
const city1List = ref([])
const city2List = ref([])
const lengthList = ref([])
const urlList = ref([])
const selectLoading = ref(false)
const formLoading = ref(false)

const chineseValidator = (rule, value, callback) => {
  const reg = /[一-龥]/
  if (value && reg.test(value)) callback(new Error(rule.msg))
  else callback()
}
const alnumValidator = (rule, value, callback) => {
  const reg = /^[a-zA-Z0-9]*$/
  if (!reg.test(value)) callback(new Error(rule.msg))
  else callback()
}
const formRules = {
  expressId: [{ required: true, message: '请选择快递公司', trigger: 'change' }],
  codes: [
    { required: true, message: '服务编码不能为空', trigger: 'blur' },
    { validator: chineseValidator, msg: '服务编码不能有中文', trigger: 'blur' }
  ],
  interfaceCode: [
    { required: true, message: '接口编码不能为空', trigger: 'blur' },
    { validator: chineseValidator, msg: '接口编码不能有中文', trigger: 'blur' }
  ],
  username: [{ required: true, message: '登录名不能为空', trigger: 'blur' }],
  password: [{ required: false, message: '登录密码不能为空', trigger: 'blur' }],
  accessLicenseNumber: [
    { required: true, message: '访问授权码不能为空', trigger: 'blur' },
    { validator: alnumValidator, msg: '访问授权码只能包含数字、字母', trigger: 'blur' }
  ],
  maximumPackages: [{ required: true, message: '运单包裹数量上限不能为空', trigger: 'blur' }],
  maximumWeightOfPackage: [{ required: true, message: '单个包裹重量上限不能为空', trigger: 'blur' }],
  weightDiscount: [{ required: true, message: '重量折扣不能为空', trigger: 'blur' }],
  numberOfCopies: [{ required: true, message: '标签一式打印份数不能为空', trigger: 'blur' }],
  labelStyle: [{ required: true, message: '请选择打印标签格式', trigger: 'change' }],
  deliveryCost: [{ required: true, message: '国外派件成本不能为空', trigger: 'blur' }],
  shippingDiscount: [{ required: true, message: '默认运费折扣不能为空', trigger: 'blur' }],
  volumetricWeightUnit: [{ required: true, message: '体积重单位不能为空', trigger: 'blur' }],
  printInvoice: [{ required: true, message: '请选择需要打印发票', trigger: 'change' }],
  ifGfp: [{ required: true, message: '请选择GFP', trigger: 'change' }],
  consignorCompany: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }],
  consignorCountryCode: [{ required: true, message: '请选择国家/地区', trigger: 'change' }],
  consignorProvinceCode: [{ required: true, message: '请选择州省', trigger: 'change' }],
  consignorCityCode: [{ required: true, message: '请选择市区', trigger: 'change' }],
  consignor: [{ required: true, message: '联系人不能为空', trigger: 'blur' }],
  consignorPhone: [
    { required: true, message: '联系电话不能为空', trigger: 'blur' },
    { validator: chineseValidator, msg: '联系电话不能有中文', trigger: 'blur' }
  ],
  consignorMail: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱地址格式不正确', trigger: ['blur', 'change'] }
  ],
  consignorZip: [
    { required: true, message: '邮政编号不能为空', trigger: 'blur' },
    { validator: alnumValidator, msg: '邮政编号只能包含数字、字母', trigger: 'blur' }
  ],
  consignorAddress1: [{ required: true, message: '联系地址1不能为空', trigger: 'blur' }],
  consignorAddress2: [{ required: false, message: '联系地址2不能为空', trigger: 'blur' }],
  consignorAddress3: [{ required: false, message: '联系地址3不能为空', trigger: 'blur' }],
  sameConsignor: [{ required: true, message: '请选择同发货方', trigger: 'change' }],
  returnCompany: [{ required: true, message: '公司名称不能为空', trigger: 'blur' }],
  returnCountryCode: [{ required: true, message: '请选择国家/地区', trigger: 'change' }],
  returnProvinceCode: [{ required: true, message: '请选择州省', trigger: 'change' }],
  returnCityCode: [{ required: true, message: '请选择市区', trigger: 'change' }],
  returnName: [{ required: true, message: '联系人不能为空', trigger: 'blur' }],
  returnPhone: [
    { required: true, message: '联系电话不能为空', trigger: 'blur' },
    { validator: chineseValidator, msg: '联系电话不能有中文', trigger: 'blur' }
  ],
  returnMail: [
    { required: true, message: '邮箱地址不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱地址格式不正确', trigger: ['blur', 'change'] }
  ],
  returnZip: [
    { required: true, message: '邮政编号不能为空', trigger: 'blur' },
    { validator: alnumValidator, msg: '邮政编号只能包含数字、字母', trigger: 'blur' }
  ],
  returnAddress1: [{ required: true, message: '联系地址1不能为空', trigger: 'blur' }],
  returnAddress2: [{ required: false, message: '联系地址2不能为空', trigger: 'blur' }],
  returnAddress3: [{ required: false, message: '联系地址3不能为空', trigger: 'blur' }]
}

const setAdd = () => {
  isEdit.value = false
  getWordsData('ups_interface_api')
  getWordsData('LABEL_STYLE')
}
const setData = async val => {
  isEdit.value = true
  currentId.value = (val || {}).id
  getWordsData('ups_interface_api')
  getWordsData('LABEL_STYLE')
  await getExpressPortByIdData()
}
const onExpress = () => {
  if (selectForm.expressId) geCurrencyOne()
  else selectForm.currency = ''
}
const geCurrencyOne = async () => {
  const item = props.expressList.find(it => it.id === selectForm.expressId) || {}
  if (!item.countryId) { selectForm.currency = ''; return }
  const result = ((await geCurrencyList({ page: 1, size: 9999, countryId: item.countryId })).data || {}).result || []
  selectForm.currency = (result[0] || {}).id
}
const onCountry = () => { selectForm.consignorProvinceCode = undefined; selectForm.consignorCityCode = undefined; province1List.value = []; city1List.value = [] }
const onCountryCode = () => { selectForm.returnProvinceCode = undefined; selectForm.returnCityCode = undefined; province2List.value = []; city2List.value = [] }
const onProvince = () => { selectForm.consignorCityCode = undefined; city1List.value = [] }
const onProvinceCode = () => { selectForm.returnCityCode = undefined; city2List.value = [] }
const getProvince = async val => {
  selectLoading.value = true
  const id = val === '1' ? selectForm.consignorCountryCode : selectForm.returnCountryCode
  try {
    const result = ((await getStateByCountry(id)).data || {}).result || []
    if (val === '1') province1List.value = result
    else province2List.value = result
  } finally {
    selectLoading.value = false
  }
}
// eslint-disable-next-line no-unused-vars
const getCity = async val => {
  selectLoading.value = true
  try {
    const result = ((await getCityByState(selectForm.consignorProvinceCode)).data || {}).result || []
    if (val === '1') city1List.value = result
    else city2List.value = result
  } finally {
    selectLoading.value = false
  }
}
const getExpressPortByIdData = async () => {
  formLoading.value = true
  try {
    const data = (await getExpressPortById(currentId.value)).data || {}
    const { returnerEntity, ...form } = data
    const {
      id, returnAddress1, returnAddress2, returnAddress3, returnCityCode, returnCompany, returnCountryCode,
      returnFax, returnMail, returnName, returnPhone, returnProvinceCode, returnTaxCode, returnZip
    } = returnerEntity || {}
    Object.assign(selectForm, formParam(), form, {
      returnId: id, returnAddress1, returnAddress2, returnAddress3, returnCityCode, returnCompany, returnCountryCode,
      returnFax, returnMail, returnName, returnPhone, returnProvinceCode, returnTaxCode, returnZip
    })
    geCurrencyOne()
    getProvince('1')
    getProvince('2')
  } finally {
    formLoading.value = false
  }
}
const getWordsData = async type => {
  selectLoading.value = true
  try {
    const data = (await getWordsList({ type })).data || []
    if (type === 'ups_interface_api') urlList.value = data
    else if (type === 'LABEL_STYLE') lengthList.value = data
  } finally {
    selectLoading.value = false
  }
}
const resetForm = () => {
  Object.assign(selectForm, formParam())
  nextTick(() => selectFormRef.value && selectFormRef.value.clearValidate())
}
const handleBack = () => { resetForm(); emit('back') }
const handleSave = () => {
  selectFormRef.value.validate(valid => {
    if (!valid) return false
    formLoading.value = true
    const {
      sameConsignor, consignor, consignorCompany, consignorAddress1, consignorAddress2, consignorAddress3,
      consignorCountryCode, consignorProvinceCode, consignorCityCode, consignorFax, consignorMail, consignorPhone,
      consignorTaxCode, consignorZip, returnId, returnAddress1, returnAddress2, returnAddress3, returnCityCode,
      returnCompany, returnCountryCode, returnFax, returnMail, returnName, returnPhone, returnProvinceCode,
      returnTaxCode, returnZip, returnerEntity, ...form
    } = selectForm
    const params = {
      returnerEntity: {
        id: returnId,
        returnAddress1: sameConsignor === 1 ? consignorAddress1 : returnAddress1,
        returnAddress2: sameConsignor === 1 ? consignorAddress2 : returnAddress2,
        returnAddress3: sameConsignor === 1 ? consignorAddress3 : returnAddress3,
        returnCityCode: sameConsignor === 1 ? consignorCityCode : returnCityCode,
        returnCompany: sameConsignor === 1 ? consignorCompany : returnCompany,
        returnCountryCode: sameConsignor === 1 ? consignorCountryCode : returnCountryCode,
        returnFax: sameConsignor === 1 ? consignorFax : returnFax,
        returnMail: sameConsignor === 1 ? consignorMail : returnMail,
        returnName: sameConsignor === 1 ? consignor : returnName,
        returnPhone: sameConsignor === 1 ? consignorPhone : returnPhone,
        returnProvinceCode: sameConsignor === 1 ? consignorProvinceCode : returnProvinceCode,
        returnTaxCode: sameConsignor === 1 ? consignorTaxCode : returnTaxCode,
        returnZip: sameConsignor === 1 ? consignorZip : returnZip
      },
      sameConsignor, consignor, consignorCompany, consignorAddress1, consignorAddress2, consignorAddress3,
      consignorCountryCode, consignorProvinceCode, consignorCityCode, consignorFax, consignorMail, consignorPhone,
      consignorTaxCode, consignorZip, ...form
    }
    props.countryList.forEach(item => {
      if (item.id === consignorCountryCode) params.consignorCountry = item.name
      if (item.id === params.returnerEntity.returnCountryCode) params.returnerEntity.returnCountryName = item.name
    })
    province1List.value.forEach(it => { if (it.abbr === consignorProvinceCode) params.consignorProvince = it.name })
    params.consignorCity = consignorCityCode
    if (sameConsignor === 1) {
      params.returnerEntity.returnProvinceName = params.consignorProvince
      params.returnerEntity.returnCityName = params.consignorCity
    } else {
      province2List.value.forEach(it => { if (it.abbr === params.returnerEntity.returnProvinceCode) params.returnerEntity.returnProvinceName = it.name })
      params.returnerEntity.returnCityName = params.returnerEntity.returnCityCode
    }
    props.expressList.forEach(it => { if (it.id === params.expressId) params.expressName = it.name })
    const done = () => { ElMessage.success('保存成功'); formLoading.value = false; emit('go'); resetForm() }
    const fail = () => { formLoading.value = false }
    if (isEdit.value) updateExpressPort(params).then(done).catch(fail)
    else addExpressPort(params).then(done).catch(fail)
  })
}

defineExpose({ setAdd, setData })
</script>

<style lang="scss" scoped>
.el-form-item {
  display: inline-block;
  width: 24.9%;
}
.express-edit {
  padding: 0;
  .header-top {
    text-align: right;
    height: 50px;
    line-height: 50px;
    padding: 0 20px;
    font-size: 16px;
    color: #666666;
    border-bottom: 1px solid #cccccc;
  }
  .content {
    padding: 20px;
    .form-title {
      height: 35px;
      line-height: 35px;
      font-size: 16px;
      font-weight: 700;
      background: #f2f2f2;
      padding-left: 20px;
      margin-bottom: 20px;
    }
  }
}
.input-number-valiate {
  width: 100%;
  :deep(.el-input__inner) { text-align: left; }
}
.input-content { display: flex; flex-direction: row; flex-wrap: nowrap; }
.input-unit {
  width: 50px;
  height: 32px;
  background-color: #f5f7fa;
  color: #909399;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-left: 0;
  border-radius: 0 4px 4px 0;
  margin-left: -1px;
}
.input-border {
  :deep(.el-input__inner) { border-radius: 4px 0 0 4px; }
}
</style>
