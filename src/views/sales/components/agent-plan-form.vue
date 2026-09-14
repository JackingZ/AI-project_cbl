<template>
  <!-- 发货计划 新增/编辑表单（源 addEditForm.vue 897 行，960px），内含服务商选择弹窗(1200px) -->
  <Modal v-model="visible" :title="isEdit ? '编辑发货计划' : '新增发货计划'" width="960px" :confirm-loading="loading" @confirm="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12"><el-form-item label="计划名称" prop="name"><el-input v-model="form.name" placeholder="请输入" /></el-form-item></el-col>
        <el-col :span="12">
          <el-form-item label="业务类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择" style="width: 100%" @change="onType">
              <el-option v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目的国" prop="countryId">
            <el-select v-model="form.countryId" filterable placeholder="请选择" style="width: 100%">
              <el-option v-for="c in countryList" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="服务商机构" prop="orgType2">
            <el-select v-model="form.orgType2" placeholder="请选择" style="width: 100%">
              <el-option v-for="o in ORG_TYPE2_LIST" :key="o.id" :label="o.name" :value="o.id" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="`计划量(${unitLabel})`" prop="planNum">
            <el-input-number v-model="form.planNum" :min="0" :controls="false" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="计划时间" prop="planTime"><el-date-picker v-model="form.planTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="服务商" prop="providerNames">
            <el-input v-model="form.providerNames" disabled placeholder="请选择服务商">
              <template #append><el-button :icon="Search" @click="openProviders">选择</el-button></template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
      </el-row>
    </el-form>

    <!-- 服务商选择弹窗（1200px，多选逗号拼接） -->
    <Modal v-model="providerVisible" title="选择服务商" width="1200px" append-to-body @confirm="confirmProviders">
      <el-table ref="providerTableRef" :data="providerList" border height="420" @selection-change="onProviderSelect">
        <el-table-column type="selection" width="50" reserve-selection />
        <el-table-column label="服务商名称" prop="name" min-width="200" />
        <el-table-column label="机构类型" width="120"><template #default="{ row }">{{ lookup(ORG_TYPE2_LIST, row.orgType2) }}</template></el-table-column>
        <el-table-column label="目的国" prop="countryName" width="120" />
        <el-table-column label="联系人" prop="contact" width="140" />
      </el-table>
      <el-pagination
        small layout="total, prev, pager, next" :current-page="providerPage.page" :page-size="providerPage.size" :total="providerPage.total"
        style="margin-top: 10px; text-align: right" @current-change="loadProviders"
      />
    </Modal>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { agentPlanApi, lookup, unitByBiz, BIZ_TYPE_LIST, ORG_TYPE2_LIST, getCountryOptions } from '@/api/modules/sales'

defineOptions({ name: 'SalesAgentPlanForm' })
const props = defineProps({ isEdit: { type: Boolean, default: false } })
const emit = defineEmits(['save-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref(null)
const defaultForm = () => ({
  id: undefined, name: '', type: '0', countryId: '', orgType2: '', planNum: 0, planTime: '',
  providerIds: '', providerNames: '', remark: '', unit: 'KG'
})
const form = reactive(defaultForm())
// type '1'/'2'→体积(CBM)，'0'/'4'→重量(KG)
const unitLabel = computed(() => unitByBiz(form.type))

const rules = {
  name: [required('请输入计划名称')],
  type: [required('请选择业务类型', 'change')],
  countryId: [required('请选择目的国', 'change')],
  orgType2: [required('请选择服务商机构', 'change')],
  providerNames: [required('请选择服务商', 'change')]
}

const countryList = ref([])
async function show(row) {
  Object.assign(form, defaultForm())
  countryList.value = (await getCountryOptions()).data
  if (props.isEdit && row) {
    Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  }
  visible.value = true
  formRef.value?.clearValidate()
}
defineExpose({ show })

const onType = () => { form.unit = unitByBiz(form.type) }

/* 服务商选择弹窗 */
const providerVisible = ref(false)
const providerList = ref([])
const providerTableRef = ref(null)
const providerPage = reactive({ page: 1, size: 10, total: 0 })
const selectedProviders = ref([])
async function openProviders() {
  await loadProviders(1)
  providerVisible.value = true
}
async function loadProviders(page = 1) {
  providerPage.page = page
  const res = (await agentPlanApi.getProviders({ page, size: providerPage.size })).data
  providerList.value = res.list
  providerPage.total = res.total
}
const onProviderSelect = rows => { selectedProviders.value = rows }
const confirmProviders = () => {
  form.providerIds = selectedProviders.value.map(p => p.id).join(',')
  form.providerNames = selectedProviders.value.map(p => p.name).join(',')
  providerVisible.value = false
}

async function submit() {
  await formRef.value.validate()
  loading.value = true
  try {
    const countryName = (countryList.value.find(c => c.id === form.countryId) || {}).name || ''
    await agentPlanApi.save({ ...form, countryName, unit: unitByBiz(form.type) })
    ElMessage.success('保存成功')
    visible.value = false
    emit('save-success')
  } finally {
    loading.value = false
  }
}
</script>
