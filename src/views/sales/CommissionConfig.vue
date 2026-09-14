<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <!-- comId 仅 custType==='0' 显示（对齐源） -->
      <el-form-item v-if="custType === '0'" label="所属公司">
        <el-select v-model="query.comId" clearable placeholder="全部" style="width: 180px">
          <el-option v-for="c in companyList" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.subtypeId" clearable placeholder="全部" style="width: 140px" @focus="loadSubtypes">
          <el-option v-for="s in subtypeList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="服务">
        <el-select v-model="query.lscId" clearable placeholder="全部" style="width: 180px" @focus="loadServices">
          <el-option v-for="s in serviceList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="240" @change="loadData">
        <template #col-measureMethod="{ row }">{{ row.measureMethod === 2 ? '按重量(KG)' : '按体积(CBM)' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" @click="openServices(row)">关联服务</el-button>
          <el-button link type="primary" size="small" @click="openLog(row)">操作日志</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑弹窗 -->
    <Modal v-model="editDlg.visible" :title="editDlg.isEdit ? '编辑佣金方案' : '新增佣金方案'" width="820px" :confirm-loading="editDlg.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="方案名称" prop="name"><el-input v-model="form.name" placeholder="请输入" /></el-form-item></el-col>
          <el-col v-if="custType === '0'" :span="12">
            <el-form-item label="所属公司" prop="comId">
              <el-select v-model="form.comId" placeholder="请选择" style="width: 100%"><el-option v-for="c in companyList" :key="c.id" :label="c.name" :value="c.id" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="subtypeId">
              <el-select v-model="form.subtypeId" placeholder="请选择" style="width: 100%"><el-option v-for="s in subtypeList" :key="s.id" :label="s.name" :value="s.id" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目的国" prop="countryId">
              <el-select v-model="form.countryId" filterable placeholder="请选择" style="width: 100%"><el-option v-for="c in countryList" :key="c.id" :label="c.name" :value="c.id" /></el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计量方式" prop="measureMethod">
              <el-select v-model="form.measureMethod" placeholder="请选择" style="width: 100%">
                <el-option v-for="m in MEASURE_METHOD_LIST" :key="m.id" :label="m.name" :value="Number(m.id)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 版本有效期 -->
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="生效日期" prop="startTime"><el-date-picker v-model="form.startTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="失效日期" prop="endTime"><el-date-picker v-model="form.endTime" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>

        <!-- 6 项比例系数 -->
        <el-divider content-position="left">比例系数(%)</el-divider>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item label="团队比例"><el-input-number v-model="form.teamRatio" :min="0" :max="100" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="客户比例"><el-input-number v-model="form.customerRatio" :min="0" :max="100" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="同事比例"><el-input-number v-model="form.colleaguesRatio" :min="0" :max="100" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="托管客户比例"><el-input-number v-model="form.escrowCustomerRatio" :min="0" :max="100" :controls="false" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="非正式比例"><el-input-number v-model="form.informalRatio" :min="0" :max="100" :controls="false" style="width: 100%" /></el-form-item></el-col>
        </el-row>

        <!-- 阶梯区间 extentVoList -->
        <el-divider content-position="left">
          阶梯区间
          <el-button link type="primary" size="small" style="margin-left: 12px" @click="addExtent">添加区间</el-button>
        </el-divider>
        <el-table :data="form.extentVoList" border size="small">
          <el-table-column label="起始值" width="180">
            <template #default="{ row }"><el-input-number v-model="row.min" :min="0" :controls="false" style="width: 100%" /></template>
          </el-table-column>
          <el-table-column label="结束值" width="180">
            <template #default="{ row }"><el-input-number v-model="row.max" :min="0" :controls="false" style="width: 100%" /></template>
          </el-table-column>
          <el-table-column label="单价">
            <template #default="{ row }"><el-input-number v-model="row.unitPrice" :min="0" :precision="2" :controls="false" style="width: 100%" /></template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }"><el-button link type="danger" size="small" @click="form.extentVoList.splice($index, 1)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </el-form>
    </Modal>

    <!-- 查看弹窗 -->
    <Modal v-model="viewDlg.visible" title="查看佣金方案" width="820px" :footer="false">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="方案名称">{{ viewDlg.row.name }}</el-descriptions-item>
        <el-descriptions-item label="所属公司">{{ viewDlg.row.comName }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ viewDlg.row.subtypeName }}</el-descriptions-item>
        <el-descriptions-item label="目的国">{{ viewDlg.row.countryName }}</el-descriptions-item>
        <el-descriptions-item label="计量方式">{{ viewDlg.row.measureMethod === 2 ? '按重量(KG)' : '按体积(CBM)' }}</el-descriptions-item>
        <el-descriptions-item label="有效期">{{ viewDlg.row.startTime }} ~ {{ viewDlg.row.endTime }}</el-descriptions-item>
        <el-descriptions-item label="团队比例">{{ viewDlg.row.teamRatio }}%</el-descriptions-item>
        <el-descriptions-item label="客户比例">{{ viewDlg.row.customerRatio }}%</el-descriptions-item>
        <el-descriptions-item label="同事比例">{{ viewDlg.row.colleaguesRatio }}%</el-descriptions-item>
        <el-descriptions-item label="托管客户比例">{{ viewDlg.row.escrowCustomerRatio }}%</el-descriptions-item>
        <el-descriptions-item label="非正式比例">{{ viewDlg.row.informalRatio }}%</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">阶梯区间</el-divider>
      <el-table :data="viewDlg.row.extentVoList || []" border size="small">
        <el-table-column label="起始值" prop="min" />
        <el-table-column label="结束值" prop="max" />
        <el-table-column label="单价" prop="unitPrice" />
      </el-table>
    </Modal>

    <!-- 操作日志弹窗 -->
    <Modal v-model="logDlg.visible" title="操作日志" width="700px" :footer="false">
      <el-table :data="logDlg.list" border size="small">
        <el-table-column label="操作人" prop="operator" width="120" />
        <el-table-column label="操作" prop="action" width="120" />
        <el-table-column label="时间" prop="time" width="180" />
        <el-table-column label="备注" prop="remark" />
      </el-table>
    </Modal>

    <!-- 关联服务 穿梭框 -->
    <RelevanceTransfer
      v-model="svcDlg.visible"
      title="关联服务"
      :company-list="serviceAll"
      :selected="svcDlg.selected"
      :show-footer="svcDlg.editable"
      @save="saveServices"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import RelevanceTransfer from '@/views/price/components/RelevanceTransfer.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import {
  commissionApi, MEASURE_METHOD_LIST,
  getCompanyOptions, getCountryOptions, getServiceSubtypeOptions, getServiceOptions
} from '@/api/modules/sales'

defineOptions({ name: 'SalesCommission' })
const { can } = usePagePerms()
// 登录 custType 固定 mock（聚货通 '0'）
const custType = ref('0')

const companyList = ref([])
const countryList = ref([])
const subtypeList = ref([])
const serviceList = ref([])
const serviceAll = ref([])
onMounted(async () => {
  companyList.value = (await getCompanyOptions()).data
  countryList.value = (await getCountryOptions()).data
  subtypeList.value = (await getServiceSubtypeOptions()).data
  serviceAll.value = (await getServiceOptions()).data
})
const loadSubtypes = async () => { if (!subtypeList.value.length) subtypeList.value = (await getServiceSubtypeOptions()).data }
const loadServices = async () => { serviceList.value = (await getServiceOptions()).data }

// countryId 在查询中被源强制 undefined，此处沿用（不参与筛选）
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(commissionApi.list, { comId: '', subtypeId: '', lscId: '' })

const columns = [
  { prop: 'name', label: '方案名称', minWidth: 140 },
  { prop: 'comName', label: '所属公司', minWidth: 160 },
  { prop: 'subtypeName', label: '业务类型', width: 110 },
  { prop: 'countryName', label: '目的国', width: 100 },
  { prop: 'measureMethod', label: '计量方式', width: 130 },
  { prop: 'startTime', label: '生效日期', width: 120 },
  { prop: 'endTime', label: '失效日期', width: 120 }
]

/* 新增/编辑 */
const formRef = ref(null)
const editDlg = reactive({ visible: false, isEdit: false, loading: false })
const defaultForm = () => ({
  id: undefined, name: '', comId: '', subtypeId: '', countryId: '', measureMethod: 2,
  startTime: '', endTime: '', teamRatio: 0, customerRatio: 0, colleaguesRatio: 0,
  escrowCustomerRatio: 0, informalRatio: 0, extentVoList: []
})
const form = reactive(defaultForm())
const rules = {
  name: [required('请输入方案名称')],
  subtypeId: [required('请选择业务类型', 'change')],
  countryId: [required('请选择目的国', 'change')],
  measureMethod: [required('请选择计量方式', 'change')],
  startTime: [required('请选择生效日期', 'change')],
  endTime: [required('请选择失效日期', 'change')]
}
const openAdd = () => {
  Object.assign(form, defaultForm())
  form.extentVoList = [{ min: 0, max: 0, unitPrice: 0 }]
  editDlg.isEdit = false; editDlg.visible = true
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, defaultForm())
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  form.extentVoList = (row.extentVoList || []).map(e => ({ ...e }))
  editDlg.isEdit = true; editDlg.visible = true
  formRef.value?.clearValidate()
}
const addExtent = () => {
  const last = form.extentVoList[form.extentVoList.length - 1]
  form.extentVoList.push({ min: last ? last.max : 0, max: 0, unitPrice: 0 })
}
// 区间校验：完整、max>min、不重叠、连续（对齐源）
const validateExtents = () => {
  const rows = form.extentVoList
  if (!rows.length) { ElMessage.error('请添加阶梯区间'); return false }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (r.min == null || r.max == null || r.unitPrice == null) { ElMessage.error('阶梯区间需填写完整'); return false }
    if (Number(r.max) <= Number(r.min)) { ElMessage.error('区间结束值须大于起始值'); return false }
    if (i > 0 && Number(r.min) !== Number(rows[i - 1].max)) { ElMessage.error('阶梯区间须连续且不重叠'); return false }
  }
  return true
}
const submit = async () => {
  await formRef.value.validate()
  if (!validateExtents()) return
  editDlg.loading = true
  try {
    const comName = (companyList.value.find(c => c.id === form.comId) || {}).name || ''
    const subtypeName = (subtypeList.value.find(s => s.id === form.subtypeId) || {}).name || ''
    const countryName = (countryList.value.find(c => c.id === form.countryId) || {}).name || ''
    await commissionApi.save({ ...form, comName, subtypeName, countryName })
    ElMessage.success('保存成功')
    editDlg.visible = false
    loadData()
  } finally {
    editDlg.loading = false
  }
}

/* 查看 */
const viewDlg = reactive({ visible: false, row: {} })
const openView = row => { viewDlg.row = row; viewDlg.visible = true }

/* 操作日志 */
const logDlg = reactive({ visible: false, list: [] })
const openLog = async row => {
  logDlg.list = (await commissionApi.getLog(row.id)).data.list
  logDlg.visible = true
}

/* 关联服务 */
const svcDlg = reactive({ visible: false, selected: [], editable: true, row: null })
const openServices = row => {
  svcDlg.row = row
  svcDlg.selected = [...(row.serviceIds || [])]
  // tag==='1' 时不可解除原有选择（对齐源穿梭框 disabled 逻辑，此处以只读近似）
  svcDlg.editable = row.tag !== '1'
  svcDlg.visible = true
}
const saveServices = ids => {
  commissionApi.save({ ...svcDlg.row, serviceIds: ids })
  ElMessage.success('保存成功')
  loadData()
}
</script>
