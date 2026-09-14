<template>
  <div v-loading="formLoading" class="truck-edit">
    <div class="header-top">
      <span style="float: left">{{ isEdit && !isCopy ? '编辑卡派服务' : '新增卡派服务' }}</span>
      <el-button type="primary" size="small" @click="goBack">返 回</el-button>
      <el-button type="primary" size="small" @click="saveData">保 存</el-button>
    </div>
    <div class="content">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" size="small">
        <div class="form-title">基础信息</div>
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" :maxlength="50" />
        </el-form-item>
        <el-form-item label="服务简称" prop="abbr">
          <el-input v-model="form.abbr" :maxlength="10" placeholder="请输入" show-word-limit />
        </el-form-item>
        <el-form-item label="服务编码" prop="ksId">
          <el-input v-model="form.ksId" placeholder="请输入" :maxlength="25" show-word-limit />
        </el-form-item>
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="form.subtypeId" style="width: 100%" filterable clearable placeholder="请选择" @change="onSubtype">
            <el-option v-for="item in subTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费方式" prop="priceType">
          <el-select v-model="form.priceType" :disabled="!form.subtypeId" style="width: 100%" filterable clearable placeholder="请选择">
            <el-option v-for="item in countList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所在国家" prop="countryId">
          <el-select v-model="form.countryId" filterable clearable placeholder="所在国家" style="width: 100%" @change="onCountryChange">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="stateId">
          <el-select v-model="form.stateId" placeholder="请选择" clearable :disabled="!form.countryId" filterable style="width: 100%" @focus="getStateList" @change="onStateChange">
            <el-option v-for="item in stateList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="cityId">
          <el-select v-model="form.cityId" placeholder="请选择" clearable :disabled="!form.stateId" filterable style="width: 100%" @focus="getCityList" @change="onCityChange">
            <el-option v-for="item in cityList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区/县" prop="countyId">
          <el-select v-model="form.countyId" placeholder="区/县" clearable :disabled="!form.cityId" filterable style="width: 100%" @focus="getCountyList">
            <el-option v-for="item in countyList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址类型" prop="addressType">
          <el-select v-model="form.addressType" placeholder="地址类型" filterable clearable style="width: 100%" :disabled="!(form.stateId && form.cityId && form.countyId)" @change="onAddressType">
            <el-option v-for="item in ADDRESS_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址类别" prop="addressCategory">
          <el-radio-group v-model="form.addressCategory">
            <el-radio value="0">FBA</el-radio>
            <el-radio value="1">私人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.addressType !== '4'" label="起运地址" prop="addressId">
          <el-select v-model="form.addressId" placeholder="选择地址" filterable clearable style="width: 100%" :disabled="!(form.stateId && form.cityId && form.countyId) || !form.addressType" @focus="getPortAddressData">
            <el-option v-for="item in portList" :key="item.key" :label="item.fullName" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="密度比" prop="density">
          <el-input-number v-model="form.density" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="form.belong" style="width: 100%" clearable placeholder="请选择">
            <el-option v-for="item in BELONG_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货币单位" prop="currencyId">
          <el-select v-model="form.currencyId" clearable filterable style="width: 100%" placeholder="请选择" @focus="getCurrency">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="距离单位" prop="umDistance">
          <el-select v-model="form.umDistance" style="width: 100%" placeholder="请选择" clearable @focus="getUmDistance">
            <el-option v-for="item in umDistanceList" :key="item.value" :label="`${item.label}-${item.value}`" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="form.umWeight" style="width: 100%" placeholder="请选择" clearable @focus="getUmWeight">
            <el-option v-for="item in umWeightList" :key="item.value" :label="`${item.label}-${item.value}`" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="体积单位" prop="umVolume">
          <el-select v-model="form.umVolume" style="width: 100%" placeholder="请选择" clearable @focus="getUmVolume">
            <el-option v-for="item in umVolumeList" :key="item.value" :label="`${item.label}-${item.value}`" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支持最大重量" prop="weight">
          <el-input-number v-model="form.weight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="支持最大体积" prop="cubed">
          <el-input-number v-model="form.cubed" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="999999" :precision="2" />
        </el-form-item>
        <el-form-item label="限制单位" prop="maxVolumeUnit">
          <el-select v-model="form.maxVolumeUnit" style="width: 100%" placeholder="请选择">
            <el-option v-for="item in maxUnitList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认供应商" prop="custId">
          <el-select v-model="form.custId" clearable filterable style="width: 100%" placeholder="请选择" @focus="getSupplier">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入" :maxlength="100" />
        </el-form-item>
        <!-- 源注释：参数&配置（同行/直客体积密度 densityP/densityC）默认隐藏
        <div class="form-title">参数&配置</div>
        <el-form-item label="同行体积密度" prop="densityP">
          <el-input-number v-model="form.densityP" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item>
        <el-form-item label="直客体积密度" prop="densityC">
          <el-input-number v-model="form.densityC" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="9999" :precision="2" />
        </el-form-item>
        -->
        <div class="form-title">运输条款</div>
      </el-form>
      <!-- 源用 toast-ui MarkdownEditor，目标未装依赖，降级为多行文本 -->
      <div>
        <el-input v-model="terms" type="textarea" :rows="10" placeholder="请输入运输条款" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { required } from '@/utils/validate'
import {
  truckApi, getCountryList, getStateByCountry, getCityByState, getCountyByCity,
  getCurrencyList, getWordsList, getPortList, getFbastoreList, getSupplierOptions,
  BELONG_LIST, TRUCK_EDIT_ADDRESS_TYPE_LIST as ADDRESS_TYPE_LIST
} from '@/api/modules/service'

defineOptions({ name: 'TruckServiceForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null },
  countryList: { type: Array, default: () => [] },
  subTypeList: { type: Array, default: () => [] }
})
const emit = defineEmits(['back', 'saveSuccess'])

const formLoading = ref(false)
const formRef = ref()
const terms = ref('')

const blank = () => ({
  addressCategory: '0', maxWeightUnit: undefined, maxVolumeUnit: undefined,
  id: undefined, name: undefined, abbr: undefined, countryId: undefined,
  countyId: undefined, stateId: undefined, cityId: undefined, subtypeId: undefined,
  ksId: undefined, density: undefined, belong: undefined, umDistance: undefined,
  umWeight: undefined, umVolume: undefined, densityP: undefined, densityC: undefined,
  terms: undefined, weight: undefined, cubed: undefined, currencyId: undefined,
  custId: undefined, remark: undefined, addressType: undefined, addressId: undefined, priceType: undefined
})
const form = reactive(blank())

const numberValidate = (rule, value, cb) => {
  if (/[一-龥]/.test(value)) cb(new Error('字符不能为中文'))
  else cb()
}
const rules = {
  name: [required('服务名称不能为空')],
  abbr: [required('服务简称不能为空')],
  subtypeId: [required('请选择服务类型', 'change')],
  priceType: [required('请选择计费方式', 'change')],
  countryId: [required('请选择所在国家', 'change')],
  stateId: [required('请选择州/省', 'change')],
  cityId: [required('请选择城市', 'change')],
  addressType: [required('请选择地址类型', 'change')],
  addressCategory: [required('请选择地址类别', 'change')],
  addressId: [required('请选择起运地址', 'change')],
  ksId: [required('服务编码不能为空')],
  density: [required('密度比不能为空'), { validator: numberValidate, trigger: 'blur' }],
  belong: [required('请选择分配客户', 'change')],
  weight: [required('支持最大重量不能为空')],
  cubed: [required('支持最大体积不能为空')],
  currencyId: [required('请选择货币单位', 'change')],
  umDistance: [required('请选择距离单位', 'change')],
  umWeight: [required('请选择重量单位', 'change')],
  umVolume: [required('请选择体积单位', 'change')]
}

const currencyList = ref([])
const supplierList = ref([])
const portList = ref([])
const stateList = ref([])
const cityList = ref([])
const countyList = ref([])
const countList = ref([])
const umDistanceList = ref([])
const umWeightList = ref([])
const umVolumeList = ref([])

const maxUnitList = computed(() => {
  if (form.subtypeId === '0') return [{ id: 'pallet', name: '托' }, { id: 'parcel', name: '单票' }, { id: ' box', name: '单箱' }]
  if (form.subtypeId === '1') return [{ id: 'vehicle', name: '车型' }, { id: 'parcel', name: '单票' }, { id: ' box', name: '单箱' }]
  return []
})

/* 单位字典 */
const getUmDistance = async () => { umDistanceList.value = (await getWordsList('DISTANCE_TYPE')).data }
const getUmWeight = async () => { umWeightList.value = (await getWordsList('weight_type')).data }
const getUmVolume = async () => { umVolumeList.value = (await getWordsList('VOLUME_TYPE')).data }
const getCurrency = async () => { currencyList.value = (await getCurrencyList()).data }
const getSupplier = async () => { supplierList.value = (await getSupplierOptions()).data }

/* 计费方式选项：subtypeId'0'→托数/重量&方数；否则→车型 */
const onCountType = () => {
  if (form.subtypeId === '0') countList.value = [{ name: '托数', id: '1' }, { name: '重量&方数', id: '2' }]
  else countList.value = [{ name: '车型', id: '0' }]
}
const onSubtype = () => {
  form.custId = undefined
  form.priceType = undefined
  supplierList.value = []
  form.maxWeightUnit = undefined
  form.maxVolumeUnit = undefined
  if (form.subtypeId === '0') { form.maxWeightUnit = 'pallet'; form.maxVolumeUnit = 'pallet' }
  if (form.subtypeId === '1') { form.maxWeightUnit = 'vehicle'; form.maxVolumeUnit = 'vehicle' }
  onCountType()
}

/* 国家-州省-城市-区县级联 */
const getStateList = async () => { if (form.countryId) stateList.value = (await getStateByCountry(form.countryId)).data }
const getCityList = async () => { if (form.stateId) cityList.value = (await getCityByState(form.stateId)).data }
const getCountyList = async () => { if (form.cityId) countyList.value = (await getCountyByCity(form.cityId)).data }
const onCountryChange = () => { form.stateId = undefined; onStateChange() }
const onStateChange = () => { form.cityId = undefined; onCityChange() }
const onCityChange = () => { form.countyId = undefined }
const onAddressType = () => { form.addressId = undefined; portList.value = [] }

const getPortAddressData = async () => {
  if (form.addressType === '3') {
    portList.value = (await getFbastoreList(form.countryId)).data.map(x => ({ ...x, key: x.id, fullName: `${x.code}-${x.address}` }))
  } else {
    portList.value = (await getPortList(form.countryId, form.addressType)).data.map(x => ({
      ...x, key: x.code || x.id, fullName: `${x.code || x.id} - ${x.name || x.address}`
    }))
  }
}

const goBack = () => emit('back')

const saveData = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    formLoading.value = true
    try {
      const { countryId, stateId, cityId, countyId, ...rest } = form
      const countryName = (props.countryList.find(x => x.id === countryId) || {}).name
      const stateName = (stateList.value.find(x => x.id === stateId) || {}).name
      const cityName = (cityList.value.find(x => x.id === cityId) || {}).name
      const countyName = (countyList.value.find(x => x.id === countyId) || {}).name
      const params = { ...rest, countryId, countryName, stateName, stateId, cityName, cityId, countyId, countyName }
      const port = portList.value.find(x => x.key === params.addressId)
      if (port) params.addressName = port.fullName
      const sup = supplierList.value.find(x => x.id === params.custId)
      params.custName = sup ? sup.name : ''
      const sub = props.subTypeList.find(x => x.id === params.subtypeId)
      if (sub) params.subtypeName = sub.name
      const cur = currencyList.value.find(x => x.id === params.currencyId)
      if (cur) params.currencyName = cur.name
      params.endAddressType = params.addressType
      params.terms = terms.value
      if (props.isCopy) delete params.id
      await truckApi.save(params)
      ElMessage.success('保存成功')
      emit('saveSuccess')
    } finally {
      formLoading.value = false
    }
  })
}

onMounted(async () => {
  if (props.row && (props.isEdit || props.isCopy)) {
    formLoading.value = true
    try {
      const data = (await truckApi.getById(props.row.id)).data || {}
      Object.assign(form, blank())
      Object.keys(form).forEach(k => { if (data[k] !== undefined) form[k] = data[k] })
      form.addressCategory = data.addressCategory || '0'
      if (props.isCopy) { form.name = undefined; form.abbr = undefined; form.id = undefined; form.ksId = undefined }
      terms.value = data.terms || ''
      onCountType()
      await Promise.all([getCurrency(), getSupplier(), getUmDistance(), getUmWeight(), getUmVolume()])
      await getStateList(); await getCityList(); await getCountyList()
      if (form.countryId && form.stateId && form.cityId && form.countyId && form.addressType && form.addressType !== '4') await getPortAddressData()
    } finally {
      formLoading.value = false
    }
  }
  nextTick(() => formRef.value && formRef.value.clearValidate())
})
</script>

<style scoped lang="scss">
.el-form-item { display: inline-block; width: 24.9%; }
.truck-edit {
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
.input-number-valiate {
  width: 100%;
  :deep(.el-input__inner) { text-align: left; }
}
</style>
