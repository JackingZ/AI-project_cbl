<template>
  <div>
    <MoreInfoPanel v-if="moreVisible" owner-type="customer" :owner="current" @back="moreVisible = false" />

    <SearchBar v-show="!moreVisible" :model="query" @search="handleSearch" @reset="handleReset">
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
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增客户</el-button>
        <el-button :icon="Upload" :disabled="!can('add')" @click="importVisible = true">批量导入</el-button>
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
        :action-width="330"
        @change="loadData"
      >
        <template #col-contract="{ row }">
          <el-button v-if="row.audit === '已通过'" link :type="contractTag(row.contract)" size="small" @click="openContract(row)">{{ row.contract }}</el-button>
          <span v-else>{{ row.contract }}</span>
        </template>
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
          <el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" :disabled="!can('edit')" @change="v => toggleStatus(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openBelong(row)">修改归属</el-button>
          <el-button v-if="row.audit !== '已通过'" link type="warning" size="small" :disabled="!can('edit')" @click="openAudit(row)">审核</el-button>
          <el-button v-if="row.audit !== '已通过'" link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openMore(row)">更多</el-button>
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

    <!-- 修改归属：变更所属上级 -->
    <Modal v-model="belong.visible" title="修改所属公司" width="460px" :confirm-loading="belong.loading" @confirm="submitBelong">
      <el-form label-width="90px">
        <el-form-item label="所属上级">{{ belong.currentName || '-' }}</el-form-item>
        <el-form-item label="新公司">
          <el-select v-model="belong.parentName" placeholder="请选择" filterable clearable style="width: 100%">
            <el-option v-for="p in parentOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 修改合同状态 -->
    <Modal v-model="contract.visible" title="修改合同状态" width="420px" :confirm-loading="contract.loading" @confirm="submitContract">
      <el-form label-width="90px">
        <el-form-item label="签署合同">
          <el-select v-model="contract.value" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in CONTRACT_STATUS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 审核：客户审核结果 -->
    <Modal v-model="audit.visible" title="客户审核" width="720px" :confirm-loading="audit.loading" @confirm="submitAudit">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="公司名称">{{ auditForm.name || '-' }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="国家/地区">{{ auditForm.country || '-' }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="主体类型">{{ auditForm.entity || '-' }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="营业执照">{{ auditForm.licenseCode || '-' }}</el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="公司类型" prop="subtype">
              <el-select v-model="auditForm.subtype" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in CUSTOMER_SUBTYPES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合作期限" prop="coopPeriod">
              <el-select v-model="auditForm.coopPeriod" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in COOP_PERIODS" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="添加来源" prop="source">
              <el-select v-model="auditForm.source" placeholder="请选择" style="width: 100%">
                <el-option v-for="s in ADD_SOURCES" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总分标识" prop="branch">
              <el-select v-model="auditForm.branch" placeholder="请选择" style="width: 100%">
                <el-option v-for="b in SUPPLIER_BRANCH" :key="b" :label="b" :value="b" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核结果" prop="audit">
              <el-radio-group v-model="auditForm.audit">
                <el-radio v-for="a in AUDIT_STATUS" :key="a" :value="a">{{ a }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="证件照片">
              <div class="cert-list">
                <div v-for="slot in CERT_SLOTS" :key="slot.key" class="cert-slot">
                  <div v-if="certDocs[slot.key]" class="cert-item">
                    <img :src="certDocs[slot.key].url" :alt="slot.label" @click="previewCert(certDocs[slot.key].url)" />
                    <i class="cert-del" @click="removeCert(slot.key)"><el-icon><Close /></el-icon></i>
                  </div>
                  <el-upload
                    v-else
                    :show-file-list="false"
                    :auto-upload="false"
                    accept="image/*"
                    :on-change="file => onCertChange(slot.key, file)"
                  >
                    <div class="cert-add"><el-icon><Plus /></el-icon><span>上传</span></div>
                  </el-upload>
                  <div class="cert-label">{{ slot.label }}</div>
                </div>
              </div>
              <div class="cert-tip">支持 jpg/png，单张 ≤ 1MB（本地存储）</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="auditForm.remark" type="textarea" :rows="2" placeholder="请输入审核备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </Modal>

    <!-- 证件照片预览 -->
    <el-dialog v-model="certPreview.visible" width="560px" append-to-body title="证件预览">
      <img :src="certPreview.url" style="width: 100%" alt="证件预览" />
    </el-dialog>

    <Modal v-model="dialog.visible" :title="dialog.title" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" :disabled="dialog.readonly">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="公司名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公司简称" prop="abbr">
              <el-input v-model="form.abbr" placeholder="请输入公司简称" />
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
          <el-col :span="12">
            <el-form-item label="总分标识" prop="branch">
              <el-select v-model="form.branch" placeholder="请选择" style="width: 100%">
                <el-option v-for="b in SUPPLIER_BRANCH" :key="b" :label="b" :value="b" />
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
            <el-form-item label="证件号码" prop="certNumber">
              <el-input v-model="form.certNumber" placeholder="请输入证件号码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照" prop="licenseCode">
              <el-input v-model="form.licenseCode" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证照地址" prop="licenseAddress">
              <el-input v-model="form.licenseAddress" placeholder="请输入证照地址" />
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
import { Plus, Upload, Close } from '@element-plus/icons-vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelateStaffDialog from '@/components/Common/RelateStaffDialog.vue'
import MoreInfoPanel from '@/components/Common/MoreInfoPanel.vue'
import ImportDialog from '@/components/Common/ImportDialog.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import {
  getCustomerList, addCustomer, updateCustomer, deleteCustomer, toggleCustomerStatus,
  bulkImportCustomer, getParentCompanyOptions,
  REGIONS, CUSTOMER_SUBTYPES, ENTITY_TYPES, AUDIT_STATUS, CONTRACT_STATUS, STATUS_OPTIONS,
  CERT_TYPES, COOP_PERIODS, ADD_SOURCES, CUSTOMER_SOURCES, COMPANY_SIZES,
  SALE_TYPES, PLATFORM_TYPES, PLATFORMS, YES_NO, SUPPLIER_BRANCH
} from '@/api/modules/organizers'

defineOptions({ name: 'OrgCustomer' })

const { can } = usePagePerms()
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
// 更多：附加信息子页面
const moreVisible = ref(false)
const openMore = row => { current.value = row; moreVisible.value = true }

// 修改归属：变更所属上级
const parentOptions = ref([])
const belong = reactive({ visible: false, loading: false, id: null, currentName: '', parentName: '' })
const openBelong = async row => {
  if (!parentOptions.value.length) {
    const res = await getParentCompanyOptions()
    parentOptions.value = res.data
  }
  Object.assign(belong, { visible: true, id: row.id, currentName: row.parentName, parentName: '' })
}
const submitBelong = async () => {
  if (!belong.parentName) return ElMessage.warning('请选择新公司')
  belong.loading = true
  try {
    await updateCustomer(belong.id, { parentName: belong.parentName })
    ElMessage.success('修改成功')
    belong.visible = false
    loadData()
  } finally {
    belong.loading = false
  }
}

// 修改合同状态（仅已通过审核可改，对齐源）
const contract = reactive({ visible: false, loading: false, id: null, value: '' })
const contractTag = c => ({ 未签署: 'info', 已签署: 'success', 已注销: 'danger' }[c] || 'primary')
const openContract = row => { Object.assign(contract, { visible: true, id: row.id, value: row.contract }) }
const submitContract = async () => {
  contract.loading = true
  try {
    await updateCustomer(contract.id, { contract: contract.value })
    ElMessage.success('修改成功')
    contract.visible = false
    loadData()
  } finally {
    contract.loading = false
  }
}

// 审核：客户审核结果
const auditFormRef = ref(null)
const audit = reactive({ visible: false, loading: false, id: null })
const auditForm = reactive({ name: '', country: '', entity: '', licenseCode: '', subtype: '', coopPeriod: '', source: '手工录入', branch: '总部', audit: '待审核', remark: '' })
const auditRules = {
  subtype: [required('请选择公司类型', 'change')],
  coopPeriod: [required('请选择合作期限', 'change')],
  branch: [required('请选择总分标识', 'change')],
  audit: [required('请选择审核结果', 'change')]
}
// 证件照片：三个固定槽位（身份证正/反面 + 营业执照），本地读为 base64 存客户记录
const CERT_SLOTS = [
  { key: 'front', label: '身份证正面' },
  { key: 'back', label: '身份证反面' },
  { key: 'license', label: '营业执照' }
]
const certDocs = reactive({ front: null, back: null, license: null })
const certPreview = reactive({ visible: false, url: '' })
const onCertChange = (key, file) => {
  const raw = file.raw
  if (raw.size > 1024 * 1024) return ElMessage.warning('单张图片不能超过 1MB')
  const reader = new FileReader()
  reader.onload = e => { certDocs[key] = { name: raw.name, url: e.target.result } }
  reader.readAsDataURL(raw)
}
const removeCert = key => { certDocs[key] = null }
const previewCert = url => { certPreview.url = url; certPreview.visible = true }

const openAudit = row => {
  Object.assign(auditForm, {
    name: row.name, country: row.country, entity: row.entity, licenseCode: row.licenseCode,
    subtype: row.subtype, coopPeriod: row.coopPeriod, source: row.addSource || '手工录入', branch: row.branch || '总部',
    audit: row.audit, remark: row.remark || ''
  })
  const docs = row.certDocs || {}
  Object.assign(certDocs, { front: docs.front || null, back: docs.back || null, license: docs.license || null })
  Object.assign(audit, { visible: true, id: row.id })
  auditFormRef.value?.clearValidate()
}
const submitAudit = async () => {
  await auditFormRef.value.validate()
  audit.loading = true
  try {
    await updateCustomer(audit.id, {
      subtype: auditForm.subtype, coopPeriod: auditForm.coopPeriod, addSource: auditForm.source, branch: auditForm.branch,
      audit: auditForm.audit, remark: auditForm.remark,
      certDocs: { front: certDocs.front, back: certDocs.back, license: certDocs.license }
    })
    ElMessage.success('审核已提交')
    audit.visible = false
    loadData()
  } finally {
    audit.loading = false
  }
}

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
  abbr: [required('请输入公司简称')],
  subtype: [required('请选择客户类型', 'change')],
  entity: [required('请选择主体类型', 'change')],
  region: [required('请选择所在地区', 'change')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, readonly: false, id: null })
const defaultForm = () => ({
  name: '', abbr: '', alias: '', code: '', subtype: '直客', entity: '企业', branch: '总部', region: [],
  contact: '', phone: '', contract: '未签署', coopPeriod: '1年', addSource: '手工录入',
  custSource: '业务开发', legal: '', certType: '营业执照', certNumber: '', licenseCode: '', licenseAddress: '', setupDate: '',
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
  name: row.name, abbr: row.abbr, alias: row.alias, code: row.code, subtype: row.subtype, entity: row.entity, branch: row.branch || '总部',
  region: [row.country, row.state, row.city, row.county].filter(Boolean),
  contact: row.contact, phone: row.phone, contract: row.contract, coopPeriod: row.coopPeriod,
  addSource: row.addSource, custSource: row.custSource, legal: row.legal, certType: row.certType,
  certNumber: row.certNumber, licenseCode: row.licenseCode, licenseAddress: row.licenseAddress, setupDate: row.setupDate, companySize: row.companySize,
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
    name: form.name, abbr: form.abbr, alias: form.alias, code: form.code, subtype: form.subtype, entity: form.entity, branch: form.branch,
    country, state, city, county, contact: form.contact, phone: form.phone, contract: form.contract,
    coopPeriod: form.coopPeriod, addSource: form.addSource, custSource: form.custSource,
    legal: form.legal, certType: form.certType, certNumber: form.certNumber, licenseCode: form.licenseCode, licenseAddress: form.licenseAddress, setupDate: form.setupDate,
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

<style scoped lang="scss">
.cert-list {
  display: flex;
  gap: $space-lg;
}
.cert-slot {
  text-align: center;
}
.cert-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid $border-color;
  border-radius: $radius-base;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
  .cert-del {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    font-size: $font-xs;
  }
}
.cert-add {
  width: 100px;
  height: 100px;
  border: 1px dashed $border-color;
  border-radius: $radius-base;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $text-placeholder;
  cursor: pointer;
  font-size: $font-xs;
  &:hover { border-color: $primary-color; color: $primary-color; }
}
.cert-label {
  margin-top: $space-xs;
  font-size: $font-xs;
  color: $text-secondary;
}
.cert-tip {
  color: $text-placeholder;
  font-size: $font-xs;
  margin-top: $space-xs;
}
</style>
