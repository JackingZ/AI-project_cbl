<template>
  <Modal v-model="visible" :title="isEdit ? '编辑组' : '新增组'" width="500px" :footer="false" @closed="close">
    <div v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="small" style="padding-right: 30px">
        <el-form-item label="服务组名称" prop="name">
          <el-input v-model="form.name" clearable size="small" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item label="国家" prop="countryId">
          <el-select v-model="form.countryId" placeholder="请选择" style="width: 100%" clearable filterable :filter-method="filterCountry" size="small" :loading="selectLoading" @focus="getCountryData" @change="countryChange">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务" class="is-required">
          <el-input v-model="form.serviceNames" size="small" placeholder="请选择" disabled>
            <template #append><el-button :icon="Search" @click="showService" /></template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
    <div style="text-align: right; margin-top: 10px">
      <el-button :disabled="loading" size="small" @click="close">取 消</el-button>
      <el-button :disabled="loading" type="primary" size="small" @click="submit">保 存</el-button>
    </div>

    <!-- 关联服务 -->
    <Modal v-model="serviceVisible" title="关联服务" width="960px" :footer="false" append-to-body @closed="closeServiceDialog">
      <div v-loading="serviceLoading">
        <div style="margin: 0 50px 10px">
          <span>业务类型：</span>
          <el-radio-group v-model="form.subtypeId" size="small" @change="typeChange('1')">
            <el-radio-button v-for="item in subtypeList" :key="item.id" :label="item.id">{{ item.name }}</el-radio-button>
          </el-radio-group>
          <span style="padding-left: 20px">所属产品：</span>
          <el-select v-model="form.productId" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 180px" @focus="getProductType" @change="() => typeChange()">
            <el-option v-for="item in productList" :key="item.id" :label="item.productName" :value="item.id" />
          </el-select>
          <span style="padding-left: 20px">目的港：</span>
          <el-select v-model="form.destinationId" :disabled="!form.subtypeId || !form.countryId" :loading="selectLoading" placeholder="请选择" size="small" clearable filterable style="width: 180px" @focus="getEndPortData" @change="() => typeChange()">
            <el-option v-for="item in endPortList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <el-transfer
          v-model="serviceOption"
          filterable
          :filter-method="filterMethod"
          :titles="['选择关联服务', '已关联服务']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="serviceList"
          style="height: 500px"
        />
        <div style="text-align: right; margin: 20px 40px 0">
          <el-button size="small" @click="closeServiceDialog">取 消</el-button>
          <el-button type="primary" size="small" @click="submitService">确 定</el-button>
        </div>
      </div>
    </Modal>
  </Modal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { lineGroupApi, privatelineApi, getCountryList, getProductList, getServiceSubtypeList } from '@/api/modules/service'

defineOptions({ name: 'PrivatelineGroupForm' })
defineProps({ isEdit: { type: Boolean, default: false } })
const emit = defineEmits(['save-success'])

const visible = ref(false)
const serviceVisible = ref(false)
const loading = ref(false)
const selectLoading = ref(false)
const serviceLoading = ref(false)
const productList = ref([])
const endPortList = ref([])
const countryList = ref([])
const allCountryList = ref([])
const serviceList = ref([])
const subtypeList = ref([])
const serviceItem = ref([])
const serviceOption = ref([])
const serviceType = ref('')
const serviceCountry = ref('')
const serviceProduct = ref('')
const serviceDestination = ref('')
const formRef = ref()

const initForm = () => ({
  id: undefined, name: '', status: '1', productId: '', productName: '', destinationId: '', destinationName: '',
  countryId: '', countryName: '', serviceIds: [], serviceNames: '', subtypeId: '', subtypeName: ''
})
const form = reactive(initForm())
const rules = {
  name: { required: true, message: '请输入服务组名称', trigger: 'blur' },
  countryId: { required: true, message: '请选择目的国', trigger: 'change' }
}

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1
const filterCountry = value => {
  if (!value) { countryList.value = allCountryList.value; return }
  countryList.value = allCountryList.value.filter(item => `${item.name}-${item.alias}`.toUpperCase().indexOf(value.toUpperCase()) !== -1)
}

const countryChange = () => {
  form.serviceIds = []
  form.serviceNames = ''
  form.destinationId = ''
  serviceList.value = []
  serviceOption.value = []
}
const typeChange = async val => {
  if (val === '1') { form.destinationId = undefined; endPortList.value = [] }
  serviceList.value = []
  serviceOption.value = []
  if (form.id && serviceType.value === form.subtypeId && serviceCountry.value === form.countryId &&
    serviceProduct.value === form.productId && serviceDestination.value === form.destinationId) {
    serviceOption.value = serviceItem.value.map(e => e.id)
  }
  if (form.subtypeId && form.productId && form.destinationId) await getPrivatelineList()
}
const showService = () => {
  if (!form.countryId) { ElMessage.error('请选择国家'); return }
  serviceVisible.value = true
  serviceOption.value = form.serviceIds
  getSubtypeList()
}
const getPrivatelineList = async () => {
  serviceLoading.value = true
  try {
    const data = (await privatelineApi.getComplicatedList({
      subtypeId: form.subtypeId, countryId: form.countryId, destinationId: form.destinationId, productId: form.productId
    })).data || []
    serviceList.value = data.filter(it => it && it.status === '1').map(it => ({
      ...it, disabled: it.lineCreate === '1' && !serviceOption.value.includes(it.id)
    }))
  } finally {
    serviceLoading.value = false
  }
}
const getSubtypeList = async () => {
  serviceLoading.value = true
  try { subtypeList.value = (await getServiceSubtypeList('05')).data.filter(it => it.id !== '3') } finally { serviceLoading.value = false }
}
const getCountryData = async () => {
  selectLoading.value = true
  try {
    const data = (await getCountryList()).data || []
    countryList.value = data
    allCountryList.value = data
  } finally {
    selectLoading.value = false
  }
}
const getProductType = async () => {
  selectLoading.value = true
  try { productList.value = (await getProductList()).data } finally { selectLoading.value = false }
}
const getEndPortData = async () => {
  selectLoading.value = true
  try {
    const type = form.subtypeId === '3' ? '' : form.subtypeId
    endPortList.value = (await privatelineApi.getPorts(form.countryId, type)).data || []
  } finally {
    selectLoading.value = false
  }
}
const resetForm = () => {
  Object.assign(form, initForm())
  formRef.value && formRef.value.resetFields()
}
const close = () => {
  serviceType.value = ''
  serviceCountry.value = ''
  serviceOption.value = []
  serviceItem.value = []
  serviceList.value = []
  resetForm()
  visible.value = false
}
const closeServiceDialog = () => { serviceVisible.value = false; serviceOption.value = [] }
const submitService = () => {
  form.serviceIds = serviceOption.value
  form.serviceNames = form.serviceIds.map(e => {
    const service = serviceList.value.find(s => e === s.id) || {}
    return service.name || ''
  }).join(',')
  serviceVisible.value = false
}
const submit = () => {
  formRef.value.validate(valid => {
    if (!valid) return
    if (form.serviceIds.length <= 0) { ElMessage.error('请选择关联服务'); return }
    const country = countryList.value.find(s => s.id === form.countryId) || {}
    const subtype = subtypeList.value.find(s => s.id === form.subtypeId) || {}
    const product = productList.value.find(s => s.id === form.productId) || {}
    const destination = endPortList.value.find(s => s.id === form.destinationId) || {}
    const { serviceIds, serviceNames, status, ...obj } = form
    const params = {
      ...obj,
      status: status || '1',
      countryName: country.name || '',
      subtypeName: subtype.name || '',
      productName: product.productName || '',
      destinationName: destination.name || '',
      lscName: (serviceNames || '').split(',').join('、'),
      lscIds: serviceIds
    }
    loading.value = true
    try {
      if (params.id) lineGroupApi.res.update(params.id, params)
      else lineGroupApi.res.add(params)
      ElMessage.success('保存成功')
      close()
      emit('save-success')
    } finally {
      loading.value = false
    }
  })
}
const getLscGroupItems = async () => {
  const data = (await lineGroupApi.getItems(form.id)).data || []
  serviceItem.value = JSON.parse(JSON.stringify(data))
  serviceOption.value = serviceItem.value.map(e => e.id)
  form.serviceIds = data.map(e => e.id)
  form.serviceNames = data.map(e => e.name).join(',')
}
const show = async data => {
  visible.value = true
  if (data) {
    const { lscId, lscName, ...obj } = data
    Object.assign(form, initForm(), obj)
    serviceType.value = data.subtypeId
    serviceCountry.value = data.countryId
    serviceProduct.value = data.productId
    serviceDestination.value = data.destinationId
    loading.value = true
    try {
      await getLscGroupItems()
      if (form.subtypeId && form.productId && form.destinationId) await getPrivatelineList()
      await getCountryData()
      getSubtypeList()
      getProductType()
      getEndPortData()
    } finally {
      loading.value = false
    }
  }
}

defineExpose({ show })
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
