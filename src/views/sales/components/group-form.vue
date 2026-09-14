<template>
  <!-- 服务组新增/编辑弹窗（源 group-form.vue，500px），内含「关联服务」穿梭框子弹窗（960px） -->
  <Modal v-model="visible" :title="isEdit ? '编辑组' : '新增组'" width="500px" :confirm-loading="loading" @confirm="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="服务组名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入服务组名称" />
      </el-form-item>
      <el-form-item label="国家" prop="countryId">
        <el-select v-model="form.countryId" filterable placeholder="请选择目的国" style="width: 100%" @change="countryChange">
          <el-option v-for="c in countryList" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务" prop="serviceIds" class="is-required">
        <el-input v-model="form.serviceNames" disabled placeholder="请选择关联服务">
          <template #append><el-button :icon="Search" @click="showService" /></template>
        </el-input>
      </el-form-item>
    </el-form>

    <!-- 关联服务 子弹窗 -->
    <Modal v-model="serviceVisible" title="关联服务" width="960px" append-to-body @confirm="submitService">
      <el-radio-group v-model="form.subtypeId" class="gf-radio" @change="typeChange">
        <el-radio-button v-for="s in subtypeList" :key="s.id" :value="s.id">{{ s.name }}</el-radio-button>
      </el-radio-group>
      <el-transfer
        v-model="serviceOption"
        filterable
        :titles="['选择关联服务', '已关联服务']"
        :props="{ key: 'id', label: 'name' }"
        :filter-method="filterService"
        :data="serviceList"
        class="gf-transfer"
      />
    </Modal>
  </Modal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { groupApi, getCountryOptions, getServiceSubtypeOptions, getServiceOptions } from '@/api/modules/sales'

defineOptions({ name: 'SalesGroupForm' })
const props = defineProps({ isEdit: { type: Boolean, default: false } })
const emit = defineEmits(['save-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref(null)
const defaultForm = () => ({ id: undefined, name: '', status: '1', countryId: '', countryName: '', serviceIds: [], serviceNames: '', subtypeId: '', subtypeName: '' })
const form = reactive(defaultForm())

const rules = {
  name: [required('请输入服务组名称')],
  countryId: [required('请选择目的国', 'change')],
  serviceIds: [required('请选择关联服务')]
}

const countryList = ref([])
const subtypeList = ref([])
const serviceList = ref([])
// saleCreate 门控（源：saleCreate==='1' 时已有关联项禁用取消）；mock 固定 '0'
const saleCreate = ref('0')

async function show(row) {
  Object.assign(form, defaultForm())
  countryList.value = (await getCountryOptions()).data
  subtypeList.value = (await getServiceSubtypeOptions()).data
  if (props.isEdit && row) {
    Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
    form.serviceIds = Array.isArray(row.serviceIds) ? [...row.serviceIds] : (row.lscId ? String(row.lscId).split(',') : [])
    form.serviceNames = row.lscName || ''
  } else {
    form.subtypeId = subtypeList.value[0]?.id || ''
  }
  visible.value = true
  formRef.value?.clearValidate()
}
defineExpose({ show })

const countryChange = id => {
  form.countryName = (countryList.value.find(c => c.id === id) || {}).name || ''
}

/* 关联服务子弹窗 */
const serviceVisible = ref(false)
const serviceOption = ref([])
async function showService() {
  if (!form.subtypeId) form.subtypeId = subtypeList.value[0]?.id || ''
  await loadServices()
  serviceOption.value = [...form.serviceIds]
  serviceVisible.value = true
}
async function loadServices() {
  const data = (await getServiceOptions({ subtypeId: form.subtypeId, countryId: form.countryId })).data
  serviceList.value = data.map(s => ({
    ...s,
    disabled: saleCreate.value === '1' && !serviceOption.value.includes(s.id)
  }))
}
const typeChange = () => { loadServices() }
const filterService = (query, item) => item.name.includes(query)
const submitService = () => {
  form.serviceIds = [...serviceOption.value]
  form.serviceNames = serviceList.value.filter(s => serviceOption.value.includes(s.id)).map(s => s.name).join('、')
  serviceVisible.value = false
}

/* 主表单提交 */
async function submit() {
  await formRef.value.validate()
  if (!form.serviceIds.length) { ElMessage.error('请选择关联服务'); return }
  loading.value = true
  try {
    const subtypeName = (subtypeList.value.find(s => s.id === form.subtypeId) || {}).name || ''
    // 提交字段为 lscIds（对齐源，非 serviceIds）
    const params = {
      id: form.id, name: form.name, status: form.status || '1',
      countryId: form.countryId, countryName: form.countryName,
      subtypeId: form.subtypeId, subtypeName,
      lscIds: form.serviceIds, serviceIds: [...form.serviceIds],
      lscId: form.serviceIds.join(','), lscName: form.serviceNames
    }
    await groupApi.saveGroup(params)
    ElMessage.success('保存成功')
    visible.value = false
    emit('save-success')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.gf-radio { margin-bottom: 16px; }
.gf-transfer { display: flex; justify-content: center; }
.gf-transfer :deep(.el-transfer-panel) { width: 40%; }
</style>
