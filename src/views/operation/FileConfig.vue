<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增文件</el-button>
        <div class="op-filters">
          <el-select v-model="query.moduleCode" placeholder="所属模块" clearable filterable style="width: 130px" @change="onSearchModule">
            <el-option v-for="m in FILE_MODULES" :key="m.id" :label="m.moduleName" :value="m.id" />
          </el-select>
          <el-select v-model="query.typeCode" placeholder="文件类别" clearable filterable :disabled="!query.moduleCode" style="width: 130px">
            <el-option v-for="t in searchTypeOpts" :key="t.id" :label="t.fileType" :value="t.id" />
          </el-select>
          <el-select v-model="query.countryCode" placeholder="国家" clearable filterable style="width: 130px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
          <el-input v-model="query.fileName" :maxlength="20" clearable placeholder="请输入" style="width: 250px">
            <template #prepend>文件名称</template>
          </el-input>
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
        :action-width="100"
        @change="loadData"
      >
        <template #col-fileExt="{ row }">{{ extLabel(row.fileExt) }}</template>
        <template #col-ifNeed="{ row }">{{ row.ifNeed === 0 ? '否' : '是' }}</template>
        <template #col-ifAudit="{ row }">{{ row.ifAudit === 0 ? '否' : '是' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑文件配置' : '新增文件配置'" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="国家" prop="countryCode">
          <el-select v-model="form.countryCode" filterable clearable :disabled="dialog.isEdit" placeholder="国家" style="width: 100%">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属模块" prop="moduleCode">
          <el-select v-model="form.moduleCode" filterable clearable :disabled="dialog.isEdit" placeholder="所属模块" style="width: 100%" @change="onFormModule">
            <el-option v-for="m in FILE_MODULES" :key="m.id" :label="m.moduleName" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件类别" prop="typeCode">
          <el-select v-model="form.typeCode" filterable clearable :disabled="dialog.isEdit" placeholder="文件类别" style="width: 100%">
            <el-option v-for="t in formTypeOpts" :key="t.id" :label="t.fileType" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名称" prop="dictId">
          <el-select v-model="form.dictId" filterable clearable :disabled="dialog.isEdit" placeholder="文件名称" style="width: 100%" @change="onDictChange">
            <el-option v-for="f in FILE_NAME_DICT" :key="f.value" :label="f.label" :value="f.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件类型" prop="fileExt">
          <el-select v-model="form.fileExt" filterable clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="e in FILE_EXT_OPTIONS" :key="e.value" :label="e.label" :value="e.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否必要" prop="ifNeed">
          <el-radio-group v-model="form.ifNeed">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否审核" prop="ifAudit">
          <el-radio-group v-model="form.ifAudit">
            <el-radio :value="0">否</el-radio>
            <el-radio :value="1">是</el-radio>
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
import { useListQuery } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import {
  fileApi, COUNTRY_OPTIONS, FILE_MODULES, FILE_TYPES_BY_MODULE, FILE_NAME_DICT, FILE_EXT_OPTIONS
} from '@/api/modules/operation'

defineOptions({ name: 'OpFile' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(fileApi.list, {
  moduleCode: '', typeCode: '', countryCode: '', fileName: ''
})

const columns = [
  { prop: 'moduleName', label: '所属模块', width: 140 },
  { prop: 'fileType', label: '文件类别', width: 140 },
  { prop: 'countryName', label: '国家名称', minWidth: 120 },
  { prop: 'fileName', label: '文件名称', minWidth: 120 },
  { prop: 'fileDesc', label: '文件描述', width: 120 },
  { prop: 'fileExt', label: '文件类型', width: 140 },
  { prop: 'ifNeed', label: '是否必要', width: 120 },
  { prop: 'ifAudit', label: '是否审核', width: 120 },
  { prop: 'createTime', label: '添加时间', width: 180 }
]
const extLabel = v => FILE_EXT_OPTIONS.find(e => e.value === v)?.label || v

const rules = {
  countryCode: [required('请选择国家', 'change')],
  moduleCode: [required('请选择所属模块', 'change')],
  typeCode: [required('请选择文件类别', 'change')],
  dictId: [required('请输入文件名称', 'change')],
  fileExt: [required('请选择文件类型', 'change')],
  ifNeed: [{ required: true, message: '请选择是否必要', trigger: 'change' }],
  ifAudit: [{ required: true, message: '请选择是否审核', trigger: 'change' }]
}

// 筛选区模块→类别级联
const searchTypeOpts = computed(() => query.moduleCode ? (FILE_TYPES_BY_MODULE[query.moduleCode] || []) : [])
const onSearchModule = () => { query.typeCode = '' }

// 表单模块→类别级联
const formTypeOpts = computed(() => form.moduleCode ? (FILE_TYPES_BY_MODULE[form.moduleCode] || []) : [])
const onFormModule = () => { form.typeCode = undefined }

const defaultForm = () => ({
  countryCode: undefined, moduleCode: undefined, typeCode: undefined, dictId: undefined,
  fileExt: undefined, ifNeed: 0, ifAudit: 0, fileName: '', fileDesc: ''
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

// 文件名称选择带出描述/名称
const onDictChange = val => {
  const dict = FILE_NAME_DICT.find(f => f.value === val)
  form.fileName = dict?.label || ''
  form.fileDesc = dict?.description || ''
}

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    countryCode: row.countryCode, moduleCode: row.moduleCode, typeCode: row.typeCode, dictId: row.dictId,
    fileExt: row.fileExt, ifNeed: row.ifNeed, ifAudit: row.ifAudit, fileName: row.fileName, fileDesc: row.fileDesc
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const mod = FILE_MODULES.find(m => m.id === form.moduleCode)
    const t = (FILE_TYPES_BY_MODULE[form.moduleCode] || []).find(x => x.id === form.typeCode)
    const country = COUNTRY_OPTIONS.find(c => c.id === form.countryCode)
    const payload = {
      ...form,
      moduleName: mod?.moduleName || '',
      fileType: t?.fileType || '',
      countryName: country?.name || ''
    }
    if (dialog.isEdit) {
      await fileApi.update(dialog.id, payload)
    } else {
      await fileApi.add(payload)
    }
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('请确认是否删除该条数据?', async () => { await fileApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })
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
</style>
