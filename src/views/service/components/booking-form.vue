<template>
  <div v-loading="loading" class="booking-service-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit && !isCopy ? '编辑订舱服务' : '新增订舱服务' }}</div>
      <el-button type="primary" size="small" @click="goBack">返 回</el-button>
      <el-button type="primary" size="small" @click="save">保 存</el-button>
    </div>
    <div class="content">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="detail-form" size="small">
        <div class="form-title">基础信息</div>
        <el-form-item label="航线名称" prop="name">
          <el-input v-model="form.name" show-word-limit :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="航线简称" prop="alias">
          <el-input v-model="form.alias" show-word-limit :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务编码" prop="serviceCode">
          <el-input v-model="form.serviceCode" :maxlength="25" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="业务类型" prop="conveyance">
          <el-select v-model="form.conveyance" style="width: 100%" placeholder="请选择" clearable @change="onSFTool">
            <el-option v-for="item in tools" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="transType">
          <el-select v-model="form.transType" :disabled="!form.conveyance" style="width: 100%" placeholder="请选择" multiple>
            <el-option v-for="item in svTypes" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属国际航线" prop="routeId">
          <el-select v-model="form.routeId" :disabled="!form.conveyance" style="width: 100%" clearable filterable placeholder="请选择" @focus="loadInterFlight">
            <el-option v-for="item in interFlightList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="form.belong" style="width: 100%" clearable placeholder="请选择">
            <el-option v-for="b in BELONG_LIST" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起运国" prop="countryFromId">
          <el-select v-model="form.countryFromId" placeholder="请选择" filterable clearable style="width: 100%">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起运港" prop="portsFromId">
          <el-select v-model="form.portsFromId" :disabled="!form.countryFromId || !form.conveyance" placeholder="请选择" filterable clearable style="width: 100%" @focus="loadPortFrom">
            <el-option v-for="item in portFromList" :key="item.id" :label="`${item.code ? item.code + '-' : ''}${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的国" prop="countryToId">
          <el-select v-model="form.countryToId" placeholder="请选择" filterable clearable style="width: 100%">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目的港" prop="portsToId">
          <el-select v-model="form.portsToId" :disabled="!form.countryToId || !form.conveyance" placeholder="请选择" filterable clearable style="width: 100%" @focus="loadPortTo">
            <el-option v-for="item in portToList" :key="item.id" :label="`${item.code ? item.code + '-' : ''}${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>

        <!-- 货币单位：空运/卡航（conveyance 非 1/2）显示单一货币；海运/铁路按 transType 分整柜/拼箱货币 -->
        <el-form-item v-if="form.conveyance !== '1' && form.conveyance !== '2'" label="货币单位" prop="currencyId">
          <el-select v-model="form.currencyId" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadCurrency">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="(form.conveyance === '1' || form.conveyance === '2') && form.transType.indexOf('2') !== -1" label="整柜货币单位" prop="currencyId1">
          <el-select v-model="form.currencyId1" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadCurrency">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="(form.conveyance === '1' || form.conveyance === '2') && form.transType.indexOf('3') !== -1" label="拼箱货币单位" prop="currencyId2">
          <el-select v-model="form.currencyId2" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadCurrency">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="form.umWeight" style="width: 100%" placeholder="请选择" clearable @focus="loadWeightUnit">
            <el-option v-for="item in weightUnitList" :key="item.value" :label="item.label + '-' + item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度单位" prop="umLength">
          <el-select v-model="form.umLength" style="width: 100%" placeholder="请选择" clearable @focus="loadLengthUnit">
            <el-option v-for="item in lengthUnitList" :key="item.value" :label="item.label + '-' + item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支持最大重量" prop="weight">
          <el-input-number v-model="form.weight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="99999" :precision="2" />
        </el-form-item>
        <el-form-item label="支持最大长度" prop="length">
          <el-input-number v-model="form.length" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="99999" :precision="2" />
        </el-form-item>
        <el-form-item label="体积密度比" prop="densityRatio">
          <el-input-number v-model="form.densityRatio" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="99999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="体积重" prop="volumeWeight">
          <el-input-number v-model="form.volumeWeight" class="input-number-valiate" :controls="false" placeholder="请输入" :min="0" :max="99999999" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="默认供应商" prop="custId">
          <el-select v-model="form.custId" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadSupplier">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name || '--'" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入" :maxlength="100" />
        </el-form-item>
        <div class="form-title">运输条款</div>
      </el-form>
      <!-- 源 toast-ui MarkdownEditor 降级为 textarea -->
      <div>
        <el-input v-model="terms" type="textarea" :rows="10" placeholder="请输入运输条款" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  bookingApi, getCountryList, getPortList, getCurrencyList, getSupplierOptions,
  getFlightList, getBookingSvTypes, getWordsList, BELONG_LIST
} from '@/api/modules/service'

defineOptions({ name: 'BookingAddEditForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null },
  tools: { type: Array, default: () => [] }
})
const emit = defineEmits(['back', 'save-success'])

const loading = ref(false)
const formRef = ref()
const terms = ref('')

const defaultForm = () => ({
  belong: undefined, serviceCode: undefined, remark: undefined, name: undefined, alias: undefined,
  conveyance: undefined, transType: [], routeId: undefined, routeName: undefined,
  countryFromId: undefined, countryFromName: undefined, portsFromId: undefined, portsFromName: undefined,
  countryToId: undefined, countryToName: undefined, portsToId: undefined, portsToName: undefined,
  currencyId: undefined, currencyName: undefined, currencyId1: undefined, currencyName1: undefined,
  currencyId2: undefined, currencyName2: undefined, umWeight: undefined, umLength: undefined,
  weight: undefined, length: undefined, custId: undefined, custName: undefined,
  densityRatio: undefined, volumeWeight: undefined
})
const form = reactive(defaultForm())

const codeValidator = (rule, value, cb) => {
  const reg = /^[a-zA-Z0-9 .·_-]+$/
  if (!value) cb(new Error('服务编码不能为空'))
  else if (!reg.test(value)) cb(new Error('服务编码不能有中文及特殊字符'))
  else cb()
}
const rules = {
  serviceCode: [{ required: true, message: '服务编码不能为空', trigger: 'blur' }, { validator: codeValidator, trigger: 'blur' }],
  name: [{ required: true, message: '航线名称不能为空', trigger: 'blur' }],
  alias: [{ required: true, message: '航线简称不能为空', trigger: 'change' }],
  conveyance: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  transType: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  routeId: [{ required: true, message: '请选择国际航线', trigger: 'change' }],
  countryFromId: [{ required: true, message: '请选择起运国', trigger: 'change' }],
  portsFromId: [{ required: true, message: '请选择起运港', trigger: 'change' }],
  countryToId: [{ required: true, message: '请选择目的国', trigger: 'change' }],
  portsToId: [{ required: true, message: '请选择目的港', trigger: 'change' }],
  belong: [{ required: true, message: '分配客户不能为空', trigger: 'change' }],
  umWeight: [{ required: true, message: '请选择重量单位', trigger: 'change' }],
  umLength: [{ required: true, message: '请选择长度单位', trigger: 'change' }],
  densityRatio: [{ required: true, message: '体积密度比不能为空', trigger: 'change' }],
  volumeWeight: [{ required: true, message: '体积重不能为空', trigger: 'change' }],
  weight: [{ required: true, message: '最大重量不能为空', trigger: 'blur' }],
  length: [{ required: true, message: '最大长度不能为空', trigger: 'blur' }],
  currencyId: [{ required: true, message: '请选择货币单位', trigger: 'change' }],
  custId: [{ required: true, message: '默认供应商不能为空', trigger: 'change' }],
  currencyId1: [{ required: true, message: '请选择整柜货币单位', trigger: 'change' }],
  currencyId2: [{ required: true, message: '请选择拼箱货币单位', trigger: 'change' }]
}

/* 下拉数据源 */
const svTypes = ref([])
const interFlightList = ref([])
const countryList = ref([])
const portFromList = ref([])
const portToList = ref([])
const currencyList = ref([])
const supplierList = ref([])
const weightUnitList = ref([])
const lengthUnitList = ref([])
const loadSvTypes = async val => { svTypes.value = (await getBookingSvTypes(val)).data }
const loadInterFlight = async () => { interFlightList.value = (await getFlightList(form.conveyance)).data }
const loadCountry = async () => { countryList.value = (await getCountryList()).data }
const loadPortFrom = async () => { portFromList.value = (await getPortList(form.countryFromId, form.conveyance)).data }
const loadPortTo = async () => { portToList.value = (await getPortList(form.countryToId, form.conveyance)).data }
const loadCurrency = async () => { currencyList.value = (await getCurrencyList()).data }
const loadSupplier = async () => { supplierList.value = (await getSupplierOptions()).data }
const loadWeightUnit = async () => { weightUnitList.value = (await getWordsList('weight_type')).data }
const loadLengthUnit = async () => { lengthUnitList.value = (await getWordsList('measurement_type')).data }

/* 业务类型 change：清空服务类型/航线/供应商，重载 svTypes */
const onSFTool = val => {
  form.transType = []
  form.routeId = undefined
  form.custId = undefined
  loadSvTypes(val)
}

onMounted(async () => {
  await loadCountry()
  if (props.row) {
    const src = { ...props.row }
    // 复制：源去掉 id/name/alias/serviceCode
    if (props.isCopy) { delete src.id; delete src.name; delete src.alias; delete src.serviceCode }
    const { transType, terms: t, ...rest } = src
    Object.assign(form, defaultForm(), rest)
    form.transType = transType ? String(transType).split(',') : []
    terms.value = t || ''
    loading.value = true
    await loadSvTypes(form.conveyance)
    await Promise.all([loadSupplier(), loadCurrency(), loadPortFrom(), loadPortTo(), loadInterFlight(), loadLengthUnit(), loadWeightUnit()])
    loading.value = false
  }
})

const goBack = () => emit('back')

const save = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    const params = { ...form, transType: form.transType.join(',') }
    const r = interFlightList.value.find(x => x.id === params.routeId); if (r) params.routeName = r.name
    const cf = countryList.value.find(x => x.id === params.countryFromId); if (cf) params.countryFromName = cf.name
    const pf = portFromList.value.find(x => x.id === params.portsFromId); if (pf) params.portsFromName = (pf.code ? pf.code + '-' : '') + pf.name
    const ct = countryList.value.find(x => x.id === params.countryToId); if (ct) params.countryToName = ct.name
    const pt = portToList.value.find(x => x.id === params.portsToId); if (pt) params.portsToName = (pt.code ? pt.code + '-' : '') + pt.name
    const cur = currencyList.value.find(x => x.id === params.currencyId); if (cur) params.currencyName = cur.name
    const cur1 = currencyList.value.find(x => x.id === params.currencyId1); if (cur1) params.currencyName1 = cur1.name
    const cur2 = currencyList.value.find(x => x.id === params.currencyId2); if (cur2) params.currencyName2 = cur2.name
    const su = supplierList.value.find(x => x.id === params.custId); if (su) params.custName = su.name
    loading.value = true
    try {
      await bookingApi.save(params)
      ElMessage.success(props.isEdit && !props.isCopy ? '编辑成功' : '添加成功')
      emit('save-success')
    } finally {
      loading.value = false
    }
  })
}
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
.booking-service-edit {
  .header-top {
    text-align: right; height: 50px; line-height: 50px; padding: 0 20px;
    font-size: 16px; color: #666; border-bottom: 1px solid #ccc;
  }
  .content {
    padding: 20px;
    .form-title {
      height: 35px; line-height: 35px; font-size: 16px; font-weight: 700;
      background: rgb(231, 231, 231); padding-left: 20px; margin-bottom: 20px;
    }
  }
  .input-number-valiate { width: 100%; }
  .input-number-valiate :deep(.el-input__inner) { text-align: left; }
}
</style>
