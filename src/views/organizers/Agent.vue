<template>
  <div>
    <MoreInfoPanel v-if="moreVisible" owner-type="agent" :owner="current" @back="moreVisible = false" />

    <SearchBar v-show="!moreVisible" :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="企业名称">
        <el-input v-model="query.name" placeholder="请输入企业名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="国家">
        <el-select v-model="query.country" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
          <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增代理商</el-button>
      </template>
    </SearchBar>

    <PageCard v-show="!moreVisible">
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="280"
        @change="loadData"
      >
        <template #col-region="{ row }">{{ [row.state, row.city, row.county].filter(Boolean).join(' / ') }}</template>
        <template #col-staff="{ row }">
          <el-button link type="primary" size="small" @click="openRelate(row)">{{ ((row.financeStaff || []).length + (row.serviceStaff || []).length) }} 人</el-button>
        </template>
        <template #col-service="{ row }">
          <el-button link type="primary" size="small" @click="openService(row)">{{ (row.services || []).length }} 项</el-button>
        </template>
        <template #col-status="{ row }">
          <el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" :disabled="!can('edit')" @change="v => toggleStatus(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openMore(row)">更多</el-button>
        </template>
      </ProTable>
    </PageCard>

    <RelateStaffDialog v-model="relateVisible" :record="current" :update-fn="updateAgent" @saved="loadData" />
    <EnableServiceDialog v-model="serviceVisible" :record="current" :update-fn="updateAgent" @saved="loadData" />

    <Modal v-model="dialog.visible" :title="dialog.title" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司简称" prop="abbr">
              <el-input v-model="form.abbr" placeholder="请输入简称" />
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
          <el-col :span="24">
            <el-form-item label="所在地区" prop="region">
              <el-cascader v-model="form.region" :options="REGIONS" style="width: 100%" placeholder="国家/州省/城市/区县" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司法人" prop="legal">
              <el-input v-model="form.legal" placeholder="请输入法人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照" prop="licenseCode">
              <el-input v-model="form.licenseCode" placeholder="请输入营业执照号" />
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
            <el-form-item label="成立日期" prop="setupDate">
              <el-date-picker v-model="form.setupDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="选择日期" />
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
            <el-form-item label="合作金额" prop="coopAmount">
              <el-input v-model="form.coopAmount" placeholder="请输入合作金额" />
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
            <el-form-item label="平台" prop="platform">
              <el-select v-model="form.platform" placeholder="请选择" style="width: 100%">
                <el-option v-for="p in PLATFORMS" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否请款" prop="ifRequestPay">
              <el-radio-group v-model="form.ifRequestPay">
                <el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否提货" prop="ifPickup">
              <el-radio-group v-model="form.ifPickup">
                <el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="人工审核" prop="ifManualReview">
              <el-radio-group v-model="form.ifManualReview">
                <el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="独立财务" prop="ifSelfFinance">
              <el-radio-group v-model="form.ifSelfFinance">
                <el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio>
              </el-radio-group>
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
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelateStaffDialog from '@/components/Common/RelateStaffDialog.vue'
import EnableServiceDialog from '@/components/Common/EnableServiceDialog.vue'
import MoreInfoPanel from '@/components/Common/MoreInfoPanel.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import {
  getAgentList, addAgent, updateAgent, deleteAgent, toggleAgentStatus,
  REGIONS, CERT_TYPES, STATUS_OPTIONS,
  COOP_PERIODS, COMPANY_SIZES, SALE_TYPES, PLATFORMS, YES_NO
} from '@/api/modules/organizers'

defineOptions({ name: 'OrgAgent' })

const { can } = usePagePerms()
const countryOptions = REGIONS.map(r => r.value)

const query = reactive({ name: '', country: '', status: '', page: 1, size: 10 })
const list = ref([])
const total = ref(0)
const loading = ref(false)

// 关联人员 / 开通服务
const relateVisible = ref(false)
const serviceVisible = ref(false)
const current = ref(null)
const openRelate = row => { current.value = row; relateVisible.value = true }
const openService = row => { current.value = row; serviceVisible.value = true }
// 更多：附加信息子页面
const moreVisible = ref(false)
const openMore = row => { current.value = row; moreVisible.value = true }

const columns = [
  { prop: 'name', label: '公司名称', minWidth: 190 },
  { prop: 'abbr', label: '简称', width: 90 },
  { prop: 'country', label: '国家/地区', width: 100 },
  { prop: 'region', label: '州省市区', minWidth: 170 },
  { prop: 'parentName', label: '上级公司', minWidth: 120 },
  { prop: 'staff', label: '关联人员', width: 90, align: 'center' },
  { prop: 'service', label: '开通服务', width: 90, align: 'center' },
  { prop: 'createTime', label: '添加时间', width: 160 },
  { prop: 'status', label: '状态', width: 80, align: 'center' }
]

const rules = {
  name: [required('请输入公司名称')],
  abbr: [required('请输入公司简称')],
  alias: [required('请输入英文名称')],
  region: [required('请选择所在地区', 'change')],
  legal: [required('请输入公司法人')],
  licenseCode: [required('请输入营业执照号')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({
  name: '', abbr: '', alias: '', code: '', region: [], legal: '', licenseCode: '',
  certType: '营业执照', setupDate: '', coopPeriod: '1年', coopAmount: '', companySize: '1-20人',
  registeredCapital: '', saleType: '直销', platform: '独立站', ifRequestPay: '是', ifPickup: '否',
  ifManualReview: '否', ifSelfFinance: '否', status: '启用', parentName: '聚货通总部'
})
const form = reactive(defaultForm())

const loadData = async () => {
  loading.value = true
  try {
    const res = await getAgentList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { query.page = 1; loadData() }
const handleReset = () => { Object.assign(query, { name: '', country: '', status: '', page: 1 }); loadData() }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增代理商', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, abbr: row.abbr, alias: row.alias, code: row.code,
    region: [row.country, row.state, row.city, row.county].filter(Boolean),
    legal: row.legal, licenseCode: row.licenseCode, certType: row.certType, setupDate: row.setupDate,
    coopPeriod: row.coopPeriod, coopAmount: row.coopAmount, companySize: row.companySize,
    registeredCapital: row.registeredCapital, saleType: row.saleType, platform: row.platform,
    ifRequestPay: row.ifRequestPay, ifPickup: row.ifPickup, ifManualReview: row.ifManualReview,
    ifSelfFinance: row.ifSelfFinance, status: row.status, parentName: row.parentName
  })
  Object.assign(dialog, { visible: true, title: '编辑代理商', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}

const toPayload = () => {
  const [country, state, city, county] = form.region
  return {
    name: form.name, abbr: form.abbr, alias: form.alias, code: form.code,
    country, state, city, county, legal: form.legal, licenseCode: form.licenseCode,
    certType: form.certType, setupDate: form.setupDate, coopPeriod: form.coopPeriod,
    coopAmount: form.coopAmount, companySize: form.companySize, registeredCapital: form.registeredCapital,
    saleType: form.saleType, platform: form.platform, ifRequestPay: form.ifRequestPay,
    ifPickup: form.ifPickup, ifManualReview: form.ifManualReview, ifSelfFinance: form.ifSelfFinance,
    status: form.status, parentName: form.parentName
  }
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateAgent(dialog.id, toPayload())
      ElMessage.success('修改成功')
    } else {
      await addAgent(toPayload())
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

const toggleStatus = async (row, v) => {
  await toggleAgentStatus(row.id, v)
  row.status = v
  ElMessage.success(`已${v}`)
}

const handleDelete = row =>
  confirmDelete(async () => {
    await deleteAgent(row.id)
    loadData()
  }, `确定删除代理商「${row.name}」吗？`)

useActivatedRefresh(loadData)
</script>
