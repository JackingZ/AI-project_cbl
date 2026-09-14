<template>
  <div v-loading="loading">
    <SearchBar :model="searchForm" @search="onSearch" @reset="onReset">
      <el-form-item>
        <el-select v-model="searchForm.shipDay" placeholder="起运时间" filterable clearable style="width: 130px">
          <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="searchForm.customDay" placeholder="截报关时间" filterable clearable style="width: 130px">
          <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="keyWord" placeholder="请输入" :maxlength="150" style="width: 250px">
          <template #prepend>
            <el-select v-model="keyType" style="width: 100px">
              <el-option label="服务编码" value="1" />
              <el-option label="服务机构" value="2" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="CirclePlus" @click="addServicer">新增服务商</el-button>
      </template>
    </SearchBar>

    <ProTable v-model:page="page" v-model:size="size" :data="tableData" :columns="columns" :loading="loading" :total="total" :action-width="160" @change="queryAll">
      <template #col-shipDay="{ row }">{{ formatDays(row.shipDay) }}</template>
      <template #col-docDay="{ row }">{{ formatDays(row.docDay) }}</template>
      <template #col-customDay="{ row }">{{ formatDays(row.customDay) }}</template>
      <template #col-orgType2="{ row }">{{ formatType(row.orgType2) }}</template>
      <template #col-shipDay2="{ row }">{{ formatDays(row.shipDay2) }}</template>
      <template #actions="{ row }">
        <el-button link type="primary" size="small" @click="editServicer(row)">编辑</el-button>
        <el-button link type="danger" size="small" @click="delServicer(row)">删除</el-button>
      </template>
    </ProTable>

    <!-- 新增/编辑服务商 -->
    <Modal v-model="isAddEditVisible" :title="serTitle" width="900px" :footer="false" @closed="cancel">
      <div v-loading="servicerLoading" class="add-edit-organ">
        <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="140px" label-position="right" class="airline-service-form" size="small">
          <el-form-item label="服务机构" prop="orgId">
            <el-select v-model="selectForm.orgId" :disabled="isEdit" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadOrgan('1')">
              <el-option v-for="item in organList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="服务编码" prop="serviceCode">
            <el-input v-model="selectForm.serviceCode" show-word-limit :maxlength="30" :disabled="isEdit" placeholder="请输入" />
          </el-form-item>
          <el-form-item label="中转国" prop="entreportCountryId">
            <el-select v-model="selectForm.entreportCountryId" style="width: 100%" placeholder="请选择" filterable @change="onCountry('enterport')">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="中转港" prop="entreport">
            <el-select v-model="selectForm.entreport" :disabled="!selectForm.entreportCountryId" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadPort('enterport')">
              <el-option v-for="item in entreportList" :key="item.id" :label="`${item.code}-${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="卸货国" prop="dischargeCountryId">
            <el-select v-model="selectForm.dischargeCountryId" style="width: 100%" placeholder="请选择" filterable @change="onCountry('discharge')">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="卸货港" prop="discharge">
            <el-select v-model="selectForm.discharge" :disabled="!selectForm.dischargeCountryId" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadPort('discharge')">
              <el-option v-for="item in dischargeportList" :key="item.id" :label="`${item.code}-${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="运输信息" prop="days">
            <el-input v-model="selectForm.days" placeholder="运输天数"><template #append>天</template></el-input>
          </el-form-item>
          <el-form-item label="起运时间" prop="shipDay">
            <el-select v-model="selectForm.shipDay" style="width: 100%" placeholder="请选择" clearable filterable>
              <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="截文件时间" prop="docDay">
            <el-select v-model="selectForm.docDay" style="width: 100%" placeholder="请选择" clearable filterable>
              <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="截报关时间" prop="customDay">
            <el-select v-model="selectForm.customDay" style="width: 100%" placeholder="请选择" clearable filterable>
              <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <!-- 是否包机：仅空运（stId '0'）显示 -->
          <el-form-item v-if="isAir === '0'" label="是否包机" prop="airplane">
            <el-radio-group v-model="selectForm.airplane">
              <el-radio :value="false">否</el-radio>
              <el-radio :value="true">是</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="二程转运" prop="transfer">
            <el-radio-group v-model="selectForm.transfer" @change="onTransfer">
              <el-radio :value="false">无</el-radio>
              <el-radio :value="true">有</el-radio>
            </el-radio-group>
          </el-form-item>
          <div v-if="selectForm.transfer">
            <el-form-item label="二程服务机构类型" prop="orgType2">
              <el-select v-model="selectForm.orgType2" style="width: 100%" placeholder="请选择" clearable filterable @change="onOrgType2">
                <el-option v-for="o in ORG_TYPE2_LIST" :key="o.id" :label="o.name" :value="o.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="二程卸货国" prop="dischargeCountryId2">
              <el-select v-model="selectForm.dischargeCountryId2" style="width: 100%" placeholder="请选择" filterable @change="onCountry('discharge2')">
                <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="二程服务机构" prop="orgId2">
              <el-select v-model="selectForm.orgId2" :disabled="!selectForm.orgType2" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadOrgan('2')">
                <el-option v-for="item in organ2List" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="二程卸货港" prop="discharge2">
              <el-select v-model="selectForm.discharge2" :disabled="!selectForm.dischargeCountryId2" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadPort('discharge2')">
                <el-option v-for="item in discharge2portList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="二程运输信息" prop="days2">
              <el-input v-model="selectForm.days2" placeholder="运输天数"><template #append>天</template></el-input>
            </el-form-item>
            <el-form-item label="二程起运时间" prop="shipDay2">
              <el-select v-model="selectForm.shipDay2" style="width: 100%" placeholder="请选择" clearable filterable>
                <el-option v-for="item in WEEKDAYS" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
        <div style="text-align: right; margin: 20px 20px 0">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="saveConfirm">确 定</el-button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import {
  bookingApi, getCountryList, getPortList, getServiceOrganList,
  WEEKDAYS, ORG_TYPE2_LIST
} from '@/api/modules/service'

defineOptions({ name: 'AirlineServiceProvider' })
const props = defineProps({
  stId: { type: String, default: '' },
  bsId: { type: [String, Number], default: '' },
  countryService: { type: Array, default: () => [] }
})

const isAir = ref(props.stId)
const loading = ref(false)
const servicerLoading = ref(false)
const isAddEditVisible = ref(false)
const isEdit = ref(false)
const serTitle = ref('')

const entreportList = ref([])
const dischargeportList = ref([])
const discharge2portList = ref([])
const organList = ref([])
const organ2List = ref([])
const countryList = ref([])
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const searchForm = reactive({ shipDay: undefined, customDay: undefined, orgName: undefined, serviceCode: undefined })
const keyType = ref('1')
const keyWord = ref('')

const columns = [
  { prop: 'orgName', label: '服务机构', minWidth: 150 },
  { prop: 'serviceCode', label: '服务编码', minWidth: 150, showOverflowTooltip: true },
  { prop: 'entreportName', label: '中转港', minWidth: 150, showOverflowTooltip: true },
  { prop: 'dischargeName', label: '卸货港', minWidth: 150, showOverflowTooltip: true },
  { prop: 'days', label: '运输天数', width: 100 },
  { prop: 'shipDay', label: '起运时间', minWidth: 120 },
  { prop: 'docDay', label: '截文件时间', minWidth: 120 },
  { prop: 'customDay', label: '截报关时间', minWidth: 120 },
  { prop: 'orgType2', label: '二程机构类型', width: 120 },
  { prop: 'orgName2', label: '二程服务机构', minWidth: 150, showOverflowTooltip: true },
  { prop: 'dischargeName2', label: '二程卸货港', minWidth: 150, showOverflowTooltip: true },
  { prop: 'days2', label: '二程运输天数', width: 120 },
  { prop: 'shipDay2', label: '二程起运时间', minWidth: 120 }
]

const defaultForm = () => ({
  serviceCode: '', airplane: false, bsId: undefined, days2: undefined,
  discharge2: undefined, dischargeName2: undefined, dischargeCountryId2: undefined, dischargeCountryName2: undefined,
  orgId2: undefined, orgName2: undefined, orgType2: undefined, shipDay2: undefined,
  customDay: undefined, days: undefined, discharge: undefined, dischargeCountryId: undefined, dischargeCountryName: undefined,
  docDay: undefined, entreport: undefined, entreportName: undefined, entreportCountryId: undefined, entreportCountryName: undefined,
  id: undefined, orgId: undefined, orgName: undefined, orgType: undefined, shipDay: undefined, transfer: false
})
const selectForm = reactive(defaultForm())
const editForm = ref()

const validateNums = (rule, value, cb) => {
  const reg = /^[1-9]+[0-9]*$/
  if (!reg.test(value)) cb(new Error('运输信息为正整数')); else cb()
}
const codeValidator = (rule, value, cb) => {
  const reg = /^[a-zA-Z0-9 .·_-]+$/
  if (!value) cb(new Error('服务编码不能为空'))
  else if (!reg.test(value)) cb(new Error('服务编码不能有中文及特殊字符'))
  else cb()
}
const formRules = {
  orgId: [{ required: true, message: '请选择服务机构', trigger: 'change' }],
  serviceCode: [{ required: true, message: '请输入服务编码', trigger: 'change' }, { validator: codeValidator, trigger: 'blur' }],
  dischargeCountryId: [{ required: true, message: '请选择卸货港', trigger: 'change' }],
  discharge: [{ required: true, message: '请选择卸货港', trigger: 'change' }],
  days: [{ required: true, message: '运输天数不能为空', trigger: 'blur' }, { validator: validateNums, trigger: 'blur' }],
  customDay: [{ required: true, message: '请选择截报关时间', trigger: 'change' }],
  shipDay: [{ required: true, message: '请选择起运时间', trigger: 'change' }],
  docDay: [{ required: true, message: '请选择截文件时间', trigger: 'change' }],
  transfer: [{ required: true, message: '请选择二程转运', trigger: 'change' }],
  orgType2: [{ required: true, message: '请选择二程服务类型', trigger: 'change' }],
  orgId2: [{ required: true, message: '请选择二程服务机构', trigger: 'change' }],
  dischargeCountryId2: [{ required: true, message: '请选择二程卸货港', trigger: 'change' }],
  discharge2: [{ required: true, message: '请选择二程卸货港', trigger: 'change' }],
  days2: [{ required: true, message: '二程运输天数不能为空', trigger: 'blur' }, { validator: validateNums, trigger: 'blur' }],
  shipDay2: [{ required: true, message: '请选择二程起运时间', trigger: 'change' }]
}

const formatDays = val => (WEEKDAYS.find(w => w.id === val) || {}).name || ''
const formatType = val => (ORG_TYPE2_LIST.find(o => o.id === val) || {}).name || ''

const queryAll = async () => {
  loading.value = true
  try {
    const res = (await bookingApi.getTransList(props.bsId, { page: page.value, size: size.value })).data
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}
const onSearch = () => {
  if (keyType.value === '1') { searchForm.serviceCode = keyWord.value; searchForm.orgName = undefined }
  else { searchForm.serviceCode = undefined; searchForm.orgName = keyWord.value }
  page.value = 1
  queryAll()
}
const onReset = () => { searchForm.shipDay = undefined; searchForm.customDay = undefined; keyWord.value = ''; onSearch() }

const loadCountry = async () => { countryList.value = (await getCountryList()).data }

const onCountry = key => {
  if (key === 'enterport') { selectForm.entreport = undefined; entreportList.value = [] }
  else if (key === 'discharge') { selectForm.discharge = undefined; dischargeportList.value = [] }
  else if (key === 'discharge2') { selectForm.discharge2 = undefined; discharge2portList.value = []; selectForm.orgId2 = undefined; organ2List.value = [] }
}
const onOrgType2 = () => { selectForm.orgId2 = undefined; organ2List.value = []; selectForm.discharge2 = undefined; discharge2portList.value = [] }

/* 二程机构类型 → 港口 type 映射：1船东→'1'/2空运→'0'/3铁路→'2' */
const loadPort = async key => {
  let countryId, type
  const ot2 = selectForm.orgType2 === '1' ? '1' : selectForm.orgType2 === '2' ? '0' : selectForm.orgType2 === '3' ? '2' : ''
  if (key === 'enterport') { countryId = selectForm.entreportCountryId; type = props.stId }
  else if (key === 'discharge') { countryId = selectForm.dischargeCountryId; type = props.stId }
  else if (key === 'discharge2') { countryId = selectForm.dischargeCountryId2; type = ot2 }
  selectLoadingWrap(async () => {
    const data = (await getPortList(countryId, type)).data
    if (key === 'enterport') entreportList.value = data
    else if (key === 'discharge') dischargeportList.value = data
    else if (key === 'discharge2') discharge2portList.value = data
  })
}

/* 服务机构：主程按 stId 映射机构类型（0空→'2'/1海→'1'/2铁→'3'），serviceCountry 取 countryService 去重 */
const loadOrgan = async num => {
  const orId = props.stId === '0' ? '2' : props.stId === '1' ? '1' : props.stId === '2' ? '3' : ''
  if (num === '1') selectForm.orgType = orId
  selectLoadingWrap(async () => {
    const data = (await getServiceOrganList()).data
    if (num === '1') organList.value = data; else organ2List.value = data
  })
}

const selectLoading = ref(false)
const selectLoadingWrap = async fn => {
  selectLoading.value = true
  try { await fn() } finally { selectLoading.value = false }
}

const addServicer = () => { isEdit.value = false; serTitle.value = '新增服务商'; resetForm(); isAddEditVisible.value = true }
const editServicer = async row => {
  isEdit.value = true
  serTitle.value = '编辑服务商'
  Object.assign(selectForm, defaultForm(), row)
  servicerLoading.value = true
  isAddEditVisible.value = true
  await Promise.all([loadPort('enterport'), loadPort('discharge'), loadPort('discharge2'), loadOrgan('1'), loadOrgan('2')])
  servicerLoading.value = false
}
const delServicer = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await bookingApi.removeTrans(props.bsId, row.id); ElMessage.success('删除成功'); queryAll() })
    .catch(() => {})
}

const onTransfer = () => {
  if (!selectForm.transfer) {
    selectForm.days2 = undefined; selectForm.discharge2 = undefined; selectForm.dischargeCountryId2 = undefined
    selectForm.orgId2 = undefined; selectForm.orgType2 = undefined; selectForm.shipDay2 = undefined
  }
}

const saveConfirm = () => {
  editForm.value.validate(async valid => {
    if (!valid) return
    servicerLoading.value = true
    try {
      const params = { ...selectForm, bscId: props.bsId }
      countryList.value.forEach(it => {
        if (it.id === params.dischargeCountryId) params.dischargeCountryName = it.name
        if (it.id === params.entreportCountryId) params.entreportCountryName = it.name
        if (it.id === params.dischargeCountryId2) params.dischargeCountryName2 = it.name
      })
      const ep = entreportList.value.find(i => i.id === params.entreport); if (ep) params.entreportName = ep.name
      const dp = dischargeportList.value.find(i => i.id === params.discharge); if (dp) params.dischargeName = dp.name
      const dp2 = discharge2portList.value.find(i => i.id === params.discharge2); if (dp2) params.dischargeName2 = dp2.name
      const o1 = organList.value.find(i => i.id === params.orgId); if (o1) params.orgName = o1.name
      const o2 = organ2List.value.find(i => i.id === params.orgId2); if (o2) params.orgName2 = o2.name
      await bookingApi.saveTrans(props.bsId, params)
      ElMessage.success('操作成功')
      isAddEditVisible.value = false
      resetForm()
      queryAll()
    } finally {
      servicerLoading.value = false
    }
  })
}

const cancel = () => { isAddEditVisible.value = false; resetForm() }
const resetForm = () => {
  Object.assign(selectForm, defaultForm())
  editForm.value && editForm.value.clearValidate()
}

onMounted(async () => {
  await loadCountry()
  queryAll()
})
</script>

<style scoped lang="scss">
.airline-service-form {
  padding: 0 50px 0 10px;
  .el-form-item { display: inline-block; width: 400px; }
}
</style>
