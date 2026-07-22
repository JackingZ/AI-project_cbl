<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="公司名称">
        <el-input v-model="query.name" placeholder="请输入公司名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="客户类型">
        <el-select v-model="query.subtype" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in CUSTOMER_SUBTYPES" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="国家">
        <el-select v-model="query.country" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" @click="openAdd">新增客户</el-button>
        <el-button :icon="Upload" @click="importVisible = true">批量导入</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="260"
        @change="loadData"
      >
        <template #col-region="{ row }">{{ [row.state, row.city, row.county].filter(Boolean).join(' / ') }}</template>
        <template #col-staff="{ row }">
          <el-button link type="primary" size="small" @click="openRelate(row)">
            {{ ((row.financeStaff || []).length + (row.serviceStaff || []).length) }} 人
          </el-button>
        </template>
        <template #col-audit="{ row }">
          <el-tag :type="auditTag(row.audit)" effect="light">{{ row.audit }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" @change="v => toggleStatus(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openView(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="openRelate(row)">关联人员</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <RelateStaffDialog v-model="relateVisible" :record="current" :update-fn="updateCustomer" @saved="loadData" />
    <ImportDialog
      v-model="importVisible"
      title="客户导入"
      :headers="importHeaders"
      :sample="importSample"
      :on-import="handleImport"
      @done="loadData"
    />

    <Modal v-model="dialog.visible" :title="dialog.title" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" :disabled="dialog.readonly">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名称" prop="alias">
              <el-input v-model="form.alias" placeholder="English name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户编码" prop="code">
              <el-input v-model="form.code" placeholder="请输入客户编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司类型" prop="subtype">
              <el-select v-model="form.subtype" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in CUSTOMER_SUBTYPES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主体类型" prop="entity">
              <el-select v-model="form.entity" placeholder="请选择" style="width: 100%">
                <el-option v-for="e in ENTITY_TYPES" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="所在地区" prop="region">
              <el-cascader v-model="form.region" :options="REGIONS" style="width: 100%" placeholder="国家/州省/城市/区县" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="form.contact" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="签署合同" prop="contract">
              <el-select v-model="form.contract" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in CONTRACT_STATUS" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作期限" prop="coopPeriod">
              <el-select v-model="form.coopPeriod" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in COOP_PERIODS" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="添加来源" prop="addSource">
              <el-select v-model="form.addSource" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in ADD_SOURCES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户来源" prop="custSource">
              <el-select v-model="form.custSource" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in CUSTOMER_SOURCES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司法人" prop="legal">
              <el-input v-model="form.legal" placeholder="请输入法人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件类型" prop="certType">
              <el-select v-model="form.certType" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in CERT_TYPES" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照" prop="licenseCode">
              <el-input v-model="form.licenseCode" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立日期" prop="setupDate">
              <el-date-picker v-model="form.setupDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司规模" prop="companySize">
              <el-select v-model="form.companySize" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in COMPANY_SIZES" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册资金" prop="registeredCapital">
              <el-input v-model="form.registeredCapital" placeholder="请输入注册资金" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售类型" prop="saleType">
              <el-select v-model="form.saleType" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in SALE_TYPES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台类型" prop="platformType">
              <el-select v-model="form.platformType" placeholder="请选择" style="width: 100%">
                <el-option v-for="p in PLATFORM_TYPES" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台" prop="platform">
              <el-select v-model="form.platform" placeholder="请选择" style="width: 100%">
                <el-option v-for="p in PLATFORMS" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="店铺链接" prop="shopUrl">
              <el-input v-model="form.shopUrl" placeholder="请输入店铺链接" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驰名商标" prop="famousMark">
              <el-radio-group v-model="form.famousMark">
                <el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核状态" prop="audit">
              <el-select v-model="form.audit" placeholder="请选择" style="width: 100%">
                <el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template v-if="dialog.readonly" #footer>
        <el-button type="primary" @click="dialog.visible = false">关闭</el-button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import { useActivatedRefresh } from '@/utils/hooks'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelateStaffDialog from '@/components/Common/RelateStaffDialog.vue'
import ImportDialog from '@/components/Common/ImportDialog.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import {
  getCustomerList, addCustomer, updateCustomer, deleteCustomer, toggleCustomerStatus,
  bulkImportCustomer,
  REGIONS, CUSTOMER_SUBTYPES, ENTITY_TYPES, AUDIT_STATUS, CONTRACT_STATUS, STATUS_OPTIONS,
  CERT_TYPES, COOP_PERIODS, ADD_SOURCES, CUSTOMER_SOURCES, COMPANY_SIZES,
  SALE_TYPES, PLATFORM_TYPES, PLATFORMS, YES_NO
} from '@/api/modules/organizers'

defineOptions({ name: 'OrgCustomer' })

const countryOptions = REGIONS.map(r => r.value)

const query = reactive({ name: '', subtype: '', country: '', audit: '', status: '', page: 1, size: 10 })
const list = ref([])
const total = ref(0)
const loading = ref(false)

// 关联人员 / 批量导入
const relateVisible = ref(false)
const importVisible = ref(false)
const current = ref(null)
const openRelate = row => { current.value = row; relateVisible.value = true }
const importHeaders = [
  { label: '公司名称', field: 'name' },
  { label: '客户类型', field: 'subtype' },
  { label: '主体类型', field: 'entity' },
  { label: '国家', field: 'country' },
  { label: '州省', field: 'state' },
  { label: '城市', field: 'city' }
]
const importSample = ['示例贸易有限公司', '直客', '企业', '美国', '加利福尼亚州', '洛杉矶']
const handleImport = rows => bulkImportCustomer(rows)

const columns = [
  { prop: 'name', label: '公司名称', minWidth: 200 },
  { prop: 'contract', label: '签署合同', width: 100, align: 'center' },
  { prop: 'subtype', label: '公司类型', width: 90 },
  { prop: 'entity', label: '主体类型', width: 90 },
  { prop: 'country', label: '国家/地区', width: 100 },
  { prop: 'region', label: '州省市区', minWidth: 170 },
  { prop: 'parentName', label: '所属上级', minWidth: 130 },
  { prop: 'staff', label: '关联人员', width: 100, align: 'center' },
  { prop: 'createTime', label: '添加时间', width: 160 },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 80, align: 'center' }
]

const auditTag = a => ({ 待审核: 'warning', 已通过: 'success', 已拒绝: 'danger' }[a] || 'info')

const rules = {
  name: [required('请输入公司名称')],
  subtype: [required('请选择客户类型', 'change')],
  entity: [required('请选择主体类型', 'change')],
  region: [required('请选择所在地区', 'change')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, readonly: false, id: null })
const defaultForm = () => ({
  name: '', alias: '', code: '', subtype: '直客', entity: '企业', region: [],
  contact: '', phone: '', contract: '未签署', coopPeriod: '1年', addSource: '手工录入',
  custSource: '业务开发', legal: '', certType: '营业执照', licenseCode: '', setupDate: '',
  companySize: '1-20人', registeredCapital: '', saleType: '直销', platformType: '线下',
  platform: '独立站', shopUrl: '', brand: '', famousMark: '否',
  audit: '待审核', status: '启用', parentName: '聚货通总部'
})
const form = reactive(defaultForm())

const loadData = async () => {
  loading.value = true
  try {
    const res = await getCustomerList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { query.page = 1; loadData() }
const handleReset = () => { Object.assign(query, { name: '', subtype: '', country: '', audit: '', status: '', page: 1 }); loadData() }

const fillForm = row => Object.assign(form, {
  name: row.name, alias: row.alias, code: row.code, subtype: row.subtype, entity: row.entity,
  region: [row.country, row.state, row.city, row.county].filter(Boolean),
  contact: row.contact, phone: row.phone, contract: row.contract, coopPeriod: row.coopPeriod,
  addSource: row.addSource, custSource: row.custSource, legal: row.legal, certType: row.certType,
  licenseCode: row.licenseCode, setupDate: row.setupDate, companySize: row.companySize,
  registeredCapital: row.registeredCapital, saleType: row.saleType, platformType: row.platformType,
  platform: row.platform, shopUrl: row.shopUrl, brand: row.brand, famousMark: row.famousMark,
  audit: row.audit, status: row.status, parentName: row.parentName
})

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增客户', isEdit: false, readonly: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  fillForm(row)
  Object.assign(dialog, { visible: true, title: '编辑客户', isEdit: true, readonly: false, id: row.id })
  formRef.value?.clearValidate()
}
const openView = row => {
  fillForm(row)
  Object.assign(dialog, { visible: true, title: '客户详情', isEdit: false, readonly: true, id: row.id })
}

const toPayload = () => {
  const [country, state, city, county] = form.region
  return {
    name: form.name, alias: form.alias, code: form.code, subtype: form.subtype, entity: form.entity,
    country, state, city, county, contact: form.contact, phone: form.phone, contract: form.contract,
    coopPeriod: form.coopPeriod, addSource: form.addSource, custSource: form.custSource,
    legal: form.legal, certType: form.certType, licenseCode: form.licenseCode, setupDate: form.setupDate,
    companySize: form.companySize, registeredCapital: form.registeredCapital, saleType: form.saleType,
    platformType: form.platformType, platform: form.platform, shopUrl: form.shopUrl, brand: form.brand,
    famousMark: form.famousMark, audit: form.audit, status: form.status, parentName: form.parentName
  }
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateCustomer(dialog.id, toPayload())
      ElMessage.success('修改成功')
    } else {
      await addCustomer(toPayload())
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

const toggleStatus = async (row, v) => {
  await toggleCustomerStatus(row.id, v)
  row.status = v
  ElMessage.success(`已${v}`)
}

const handleDelete = row =>
  confirmDelete(async () => {
    await deleteCustomer(row.id)
    loadData()
  }, `确定删除客户「${row.name}」吗？`)

useActivatedRefresh(loadData)
</script>
