<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <!-- 源注释：新增成本项目按钮（qadd 权限）默认隐藏
      <el-form-item>
        <el-button v-if="can('qadd')" type="primary" :icon="CirclePlus" @click="openAdd">新增成本项目</el-button>
      </el-form-item>
      -->
      <el-form-item>
        <el-select v-model="query.serviceTypeId" placeholder="服务类型" clearable filterable style="width: 130px" @change="onReset('SELECT_TYPE')">
          <el-option v-for="item in serviceTypeList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="query.typeId" placeholder="项目类型" :disabled="!query.serviceTypeId" clearable filterable style="width: 130px">
          <el-option v-for="item in costitemTypeList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-input v-model="query.name" placeholder="请输入成本项目关键字" clearable style="width: 180px" />
      </el-form-item>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="0" @change="loadData">
        <template #col-types="{ row }">{{ (row.types || []).map(item => item.typeName).join(',') || '--' }}</template>
        <template #col-settlement="{ row }">{{ (SETTLEMENT_LIST.find(item => item.id === row.settlement) || {}).name || '--' }}</template>
        <!-- 源注释：操作列（qedit/qdel 权限）默认隐藏
        <template #actions="{ row }">
          <el-button v-if="can('qedit')" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="can('qdel')" link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
        -->
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="isEdit ? '编辑成本项目' : '新增成本项目'" width="600px" :confirm-loading="dialog.loading" @confirm="saveConfirm" @closed="close">
      <el-form ref="formRef" v-loading="dialog.loading" :model="form" :rules="formRules" size="small" label-width="130px">
        <el-form-item label="项目中文名称" prop="name">
          <el-input ref="firstInput" v-model="form.name" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="项目英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务类型" prop="serviceTypeId">
          <el-select v-model="form.serviceTypeId" clearable filterable placeholder="请选择" style="width: 100%" @change="onReset('FORM_TYPE')">
            <el-option v-for="item in serviceTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目类型" prop="typeList">
          <el-select v-model="form.typeList" clearable multiple :disabled="!form.serviceTypeId" placeholder="请选择" style="width: 100%">
            <el-option v-for="item in formTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算单位" prop="settlement">
          <el-select v-model="form.settlement" clearable filterable placeholder="请选择" style="width: 100%">
            <el-option v-for="item in SETTLEMENT_LIST" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票描述" prop="invoice">
          <el-input v-model="form.invoice" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item v-if="form.serviceTypeId === '04'" label="是否按区间计费" prop="ranging">
          <el-select v-model="form.ranging" clearable placeholder="请选择" style="width: 100%">
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
// import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import {
  getCostitemList, saveCostitem, deleteCostitem, getServiceTypeList, getCostitemTypeList,
  SETTLEMENT_LIST
} from '@/api/modules/operatingCost'

defineOptions({ name: 'CostProjects' })

const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getCostitemList, { serviceTypeId: '', typeId: '', name: '' })

const columns = [
  { prop: 'name', label: '项目中文名称', minWidth: 140 },
  { prop: 'alias', label: '项目英文名称', minWidth: 140 },
  { prop: 'serviceTypeName', label: '服务类型', width: 120 },
  { prop: 'types', label: '项目类型', width: 120 },
  { prop: 'settlement', label: '结算单位', width: 120 },
  { prop: 'invoice', label: '发票描述', minWidth: 140 },
  { prop: 'remark', label: '备注', minWidth: 140 }
]

// 服务类型下拉（列表筛选 + 表单共用）
const serviceTypeList = ref([])
// 列表筛选的项目类型下拉
const costitemTypeList = ref([])
// 表单的项目类型下拉
const formTypeList = ref([])

const loadServiceType = async () => { serviceTypeList.value = (await getServiceTypeList()).data || [] }
loadServiceType()

/* 新增/编辑弹窗 */
const isEdit = ref(false)
const currentId = ref('')
const formRef = ref()
const firstInput = ref()
const dialog = reactive({ visible: false, loading: false })
const initForm = () => ({
  name: undefined, alias: undefined, serviceTypeId: undefined, serviceTypeName: undefined,
  typeList: [], settlement: undefined, umId: undefined, umName: undefined, invoice: undefined, remark: undefined, ranging: undefined
})
const form = reactive(initForm())

const formRules = {
  name: [
    { required: true, message: '项目中文名称不能为空', trigger: 'blur' },
    { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  alias: [
    { required: true, message: '项目英文名称不能为空', trigger: 'blur' },
    {
      validator(rule, value, callback) {
        const reg = /[一-龥]/
        if (!value) callback(new Error('英文名称不能为空'))
        else if (reg.test(value)) callback(new Error('英文名称不能有中文'))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  serviceTypeId: [{ required: true, message: '请选择服务类型', trigger: 'change' }],
  typeList: [{ required: true, message: '请选择项目类型', trigger: 'change' }],
  settlement: [{ required: true, message: '请选择结算单位', trigger: 'change' }],
  invoice: [{ required: true, message: '发票描述不能为空', trigger: 'blur' }],
  ranging: [{ required: true, message: '请选择是否按区间计费', trigger: 'change' }]
}

// 服务类型联动重置（源 onReset 三分支：SELECT_TYPE 列表筛选 / FORM_TYPE 表单）
const onReset = async action => {
  if (action === 'SELECT_TYPE') {
    query.typeId = ''
    costitemTypeList.value = []
    if (query.serviceTypeId) costitemTypeList.value = (await getCostitemTypeList({ typeId: query.serviceTypeId })).data || []
  } else if (action === 'FORM_TYPE') {
    form.typeList = []
    formTypeList.value = []
    form.ranging = undefined
    if (form.serviceTypeId) {
      form.serviceTypeName = (serviceTypeList.value.find(it => it.id === form.serviceTypeId) || {}).name
      formTypeList.value = (await getCostitemTypeList({ typeId: form.serviceTypeId })).data || []
    }
  }
}

const openAdd = () => {
  isEdit.value = false
  Object.assign(form, initForm())
  dialog.visible = true
  nextTick(() => firstInput.value && firstInput.value.focus())
}
const openEdit = async row => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, initForm(), {
    ...row,
    typeList: (row.types || []).map(item => item.typeId).filter(Boolean)
  })
  if (row.serviceTypeId) formTypeList.value = (await getCostitemTypeList({ typeId: row.serviceTypeId })).data || []
  dialog.visible = true
}
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', closeOnClickModal: false })
    .then(async () => { await deleteCostitem(row.id); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}
const saveConfirm = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    dialog.loading = true
    try {
      const types = form.typeList.map(id => ({ typeId: id, typeName: (formTypeList.value.find(c => c.id === id) || {}).name || '' }))
      const { typeList, ...rest } = form
      const params = { ...rest, types }
      if (isEdit.value) params.id = currentId.value
      await saveCostitem(params)
      ElMessage.success('操作成功')
      dialog.visible = false
      loadData()
    } finally {
      dialog.loading = false
    }
  })
}
const close = () => {
  Object.assign(form, initForm())
  formRef.value && formRef.value.clearValidate()
}
</script>
