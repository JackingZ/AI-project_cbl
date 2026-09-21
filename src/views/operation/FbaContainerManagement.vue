<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增FBA仓库</el-button>
        <div class="op-filters">
          <el-select v-model="query.type" placeholder="仓库类型" clearable style="width: 130px">
            <el-option v-for="t in FBA_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-select v-model="query.countryName" placeholder="所在国家" clearable filterable style="width: 130px" @change="onSearchCountry">
            <el-option v-for="c in countryOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-select v-model="query.stateName" placeholder="州/省" clearable filterable :disabled="!query.countryName" style="width: 130px" @change="onSearchState">
            <el-option v-for="s in searchStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
          <el-select v-model="query.cityName" placeholder="城市" clearable filterable :disabled="!query.stateName" style="width: 130px">
            <el-option v-for="c in searchCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
          <el-select v-model="query.status" placeholder="启用状态" clearable style="width: 130px">
            <el-option label="启用" value="1" />
            <el-option label="禁用" value="0" />
          </el-select>
          <el-input v-model="query.code" placeholder="请输入仓库编码" style="width: 150px" />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="180"
        @change="loadData"
      >
        <template #col-type="{ row }">{{ typeLabel(row.type) }}</template>
        <template #col-region="{ row }">
          <span v-if="row.stateName">{{ row.stateName }}</span>
          <span v-if="row.cityName"> &gt; {{ row.cityName }}</span>
        </template>
        <template #col-status="{ row }">
          <el-switch
            :model-value="row.status === '1'"
            active-text="启用" inactive-text="禁用"
            :disabled="!can('edit')"
            :before-change="() => beforeStatusChange(row)"
          />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" title="FBA仓库" width="900px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="fba-form">
        <el-form-item label="仓库类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择" style="width: 100%" @change="onTypeChange">
            <el-option v-for="t in FBA_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === '1'" label="自有" prop="ifHave">
          <el-radio-group v-model="form.ifHave">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="FBA仓库编码" prop="code">
          <el-input v-model="form.code" maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="国家/地区" prop="countryName">
          <el-select v-model="form.countryName" filterable placeholder="请选择" style="width: 100%" @change="onFormCountry">
            <el-option v-for="c in countryOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="stateName">
          <el-select v-model="form.stateName" filterable clearable :disabled="!form.countryName" placeholder="请选择" style="width: 100%" @change="onFormState">
            <el-option v-for="s in formStateOpts" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市" prop="cityName">
          <el-select v-model="form.cityName" filterable clearable :disabled="!form.stateName" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in formCityOpts" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细地址一" prop="address">
          <el-input v-model="form.address" :maxlength="30" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细地址二" prop="address1">
          <el-input v-model="form.address1" :maxlength="30" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="详细地址三" prop="address2">
          <el-input v-model="form.address2" :maxlength="30" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="邮政编码" prop="postal">
          <el-input v-model="form.postal" :maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="收货公司" prop="recipient">
          <el-input v-model="form.recipient" :disabled="isRecipientDisabled" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="form.email" :maxlength="30" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="form.type === '0'" label="最大尺寸" prop="maxSize">
          <el-input v-model.number="form.maxSize" type="number" placeholder="请输入">
            <template #append>cm</template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="form.type === '0'" label="最大重量" prop="maxWeight">
          <el-input v-model.number="form.maxWeight" type="number" placeholder="请输入">
            <template #append>kg</template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="form.type === '0'" label="直送" prop="isDirect">
          <el-radio-group v-model="form.isDirect">
            <el-radio :value="0">是</el-radio>
            <el-radio :value="1">否</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import {
  fbaApi, FBA_TYPE_OPTIONS,
  getCountryOpts, getStateOpts, getCityOpts
} from '@/api/modules/operation'

defineOptions({ name: 'OpFba' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(fbaApi.list, {
  type: '', countryName: '', stateName: '', cityName: '', status: '', code: ''
})

const columns = [
  { prop: 'type', label: '仓库类型', width: 120 },
  { prop: 'code', label: '仓库编号', width: 120 },
  { prop: 'countryName', label: '国家/地区', width: 160 },
  { prop: 'region', label: '州省市区', minWidth: 180 },
  { prop: 'address', label: '详细地址一', minWidth: 180 },
  { prop: 'postal', label: '邮政编码', width: 120 },
  { prop: 'recipient', label: '收货公司', minWidth: 180 },
  { prop: 'status', label: '启用状态', width: 150 }
]
const typeLabel = v => FBA_TYPE_OPTIONS.find(t => t.value === v)?.label || v

// 校验规则（对齐源）
const noChinesePostal = { validator: (r, v, cb) => (v && /[一-龥]/.test(v)) ? cb(new Error('邮政编码不能有中文')) : cb(), trigger: 'blur' }
const noChinesePhone = { validator: (r, v, cb) => (v && /[一-龥]/.test(v)) ? cb(new Error('电话号码不能有中文')) : cb(), trigger: 'blur' }
const geZero = { validator: (r, v, cb) => (v != null && v < 0) ? cb(new Error('必须大于等于0')) : cb(), trigger: 'blur' }
const rules = {
  type: [required('请选择FBA仓库类型', 'change')],
  countryName: [required('请选择国家/地区', 'change')],
  stateName: [required('请选择州/省', 'change')],
  cityName: [required('请选择城市', 'change')],
  code: [required('FBA仓库编码不能为空')],
  address: [{ required: true, message: '仓库地址不能为空' }],
  postal: [required('邮政编码不能为空'), noChinesePostal],
  recipient: [required('收货公司不能为空')],
  contact: [required('联系人不能为空')],
  email: [required('邮箱不能为空'), { type: 'email', message: '邮箱地址格式不正确', trigger: ['blur', 'change'] }],
  phone: [required('电话不能为空'), noChinesePhone],
  maxSize: [{ type: 'number', message: '请填写数字', trigger: 'blur' }, geZero],
  maxWeight: [{ type: 'number', message: '请填写数字', trigger: 'blur' }, geZero]
}

// 筛选区地区联动
const countryOpts = getCountryOpts()
const searchStateOpts = computed(() => query.countryName ? getStateOpts(query.countryName) : [])
const searchCityOpts = computed(() => query.countryName && query.stateName ? getCityOpts(query.countryName, query.stateName) : [])
const onSearchCountry = () => { query.stateName = ''; query.cityName = '' }
const onSearchState = () => { query.cityName = '' }

// 表单地区联动
const formStateOpts = computed(() => form.countryName ? getStateOpts(form.countryName) : [])
const formCityOpts = computed(() => form.countryName && form.stateName ? getCityOpts(form.countryName, form.stateName) : [])
const onFormCountry = () => { form.stateName = ''; form.cityName = '' }
const onFormState = () => { form.cityName = '' }

// 收货公司禁用：亚马逊(type=0)时禁用并自动 Amazon
const isRecipientDisabled = computed(() => parseInt(form.type, 10) === 0)

const defaultForm = () => ({
  type: '', ifHave: 0, code: '', countryName: '', stateName: '', cityName: '',
  address: '', address1: '', address2: '', postal: '', recipient: '', contact: '',
  email: '', phone: '', maxSize: undefined, maxWeight: undefined, isDirect: undefined
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

// 仓库类型变更：清空条件字段，亚马逊自动 Amazon
const onTypeChange = val => {
  form.maxSize = undefined
  form.maxWeight = undefined
  form.isDirect = undefined
  form.recipient = parseInt(val, 10) === 0 ? 'Amazon' : ''
}

const pick = row => ({
  type: row.type, ifHave: row.ifHave, code: row.code,
  countryName: row.countryName, stateName: row.stateName, cityName: row.cityName,
  address: row.address, address1: row.address1, address2: row.address2, postal: row.postal,
  recipient: row.recipient, contact: row.contact, email: row.email, phone: row.phone,
  maxSize: row.maxSize, maxWeight: row.maxWeight, isDirect: row.isDirect
})
const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { ...defaultForm(), ...pick(row) })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { ...form, region: [form.countryName, form.stateName, form.cityName].filter(Boolean) }
    if (dialog.isEdit) {
      await fbaApi.update(dialog.id, payload)
      ElMessage.success('操作成功')
    } else {
      await fbaApi.add({ ...payload, status: '1' })
      ElMessage.success('操作成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('此操作将删除FBA仓库，是否继续？', async () => { await fbaApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })

// 启用状态开关：before-change 在变更前确认，取消则值不变（初始化不触发）
const beforeStatusChange = row => {
  const next = row.status === '1' ? '0' : '1'
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(`此操作将${next === '0' ? '禁用' : '开启'}FBA仓库，是否继续？`, '温馨提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
      await fbaApi.update(row.id, { status: next })
      row.status = next
      ElMessage.success('操作成功')
      resolve(true)
    }).catch(() => reject(new Error('cancel')))
  })
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; flex-wrap: wrap; gap: $space-sm; justify-content: flex-end; }
.fba-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 50%; }
}
</style>
