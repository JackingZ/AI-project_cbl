<template>
  <div>
    <!-- 详情内嵌（对账明细/银行数据），非路由跳转 -->
    <CheckDetail v-if="detail.show" :row-id="detail.id" @back="detail.show = false" />
    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="年度">
          <el-date-picker v-model="query.year" type="year" value-format="YYYY" placeholder="选择年度" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="会计期间">
          <el-select v-model="query.fisCalId" placeholder="全部" clearable style="width: 180px">
            <el-option v-for="f in fiscalOptions" :key="f.id" :label="f.fiscalPeriod" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="t in CHECK_TYPE_LIST" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否关账">
          <el-select v-model="query.ifClose" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="c in CLOSE_LIST" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增对账单</el-button>
        </template>
      </SearchBar>
      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="240" @change="loadData">
          <template #col-type="{ row }">{{ lookup(CHECK_TYPE_LIST, row.type) }}</template>
          <template #col-ifClose="{ row }">
            <el-tag size="small" :type="row.ifClose === 1 ? 'success' : 'info'">{{ lookup(CLOSE_LIST, row.ifClose) }}</el-tag>
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看详情</el-button>
            <el-button v-if="row.ifClose !== 1" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.ifClose !== 1" link type="warning" size="small" :disabled="!can('close')" @click="close(row)">关账</el-button>
            <el-button v-if="row.ifClose !== 1" link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>

      <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑对账单' : '新增对账单'" width="600px" :confirm-loading="dialog.loading" @confirm="submit">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
          <el-form-item label="年度" prop="year">
            <el-date-picker v-model="form.year" type="year" value-format="YYYY" placeholder="请选择年度" style="width: 100%" />
          </el-form-item>
          <el-form-item label="会计期间" prop="fisCalId">
            <el-select v-model="form.fisCalId" placeholder="请选择会计期间" style="width: 100%" @change="onFiscal">
              <el-option v-for="f in fiscalOptions" :key="f.id" :label="f.fiscalPeriod" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-radio-group v-model="form.type">
              <el-radio v-for="t in CHECK_TYPE_LIST" :key="t.id" :value="t.id">{{ t.name }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" :maxlength="100" show-word-limit placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </Modal>
    </template>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import CheckDetail from './components/CheckDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete, confirmAction } from '@/utils/index'
import { required } from '@/utils/validate'
import { checkApi, getFiscalOptions, CHECK_TYPE_LIST, CLOSE_LIST, lookup } from '@/api/modules/financial'

defineOptions({ name: 'FinCheck' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(checkApi.list, { year: '', fisCalId: '', type: '', ifClose: '' })
const columns = [
  { prop: 'fisCalName', label: '会计期间', minWidth: 160 },
  { prop: 'year', label: '年度', width: 100 },
  { prop: 'type', label: '类型', width: 100 },
  { prop: 'ifClose', label: '是否关账', width: 110, align: 'center' },
  { prop: 'creator', label: '创建人', width: 110 },
  { prop: 'createTime', label: '创建时间', width: 170 },
  { prop: 'updateTime', label: '更新时间', width: 170 },
  { prop: 'remark', label: '备注', minWidth: 140 }
]

// 会计期间下拉
const fiscalOptions = ref([])
onMounted(async () => { fiscalOptions.value = (await getFiscalOptions()).data })

/* 详情内嵌 */
const detail = reactive({ show: false, id: null })
const openView = row => { detail.id = row.id; detail.show = true }

/* 新增/编辑弹窗 */
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const defaultForm = () => ({ year: '', fisCalId: '', fisCalName: '', type: 'R', remark: '' })
const form = reactive(defaultForm())
const rules = {
  year: [required('请选择年度', 'change')],
  fisCalId: [required('请选择会计期间', 'change')],
  type: [required('请选择类型', 'change')]
}
// 会计期间变化：同步 fisCalId + fisCalName
const onFiscal = id => {
  const f = fiscalOptions.value.find(o => o.id === id)
  form.fisCalName = f ? f.fiscalPeriod : ''
}
const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { year: row.year, fisCalId: row.fisCalId, fisCalName: row.fisCalName, type: row.type, remark: row.remark })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { year: form.year, fisCalId: form.fisCalId, fisCalName: form.fisCalName, type: form.type, remark: form.remark }
    if (dialog.isEdit) await checkApi.update(dialog.id, payload)
    else await checkApi.add({ ...payload, ifClose: 0, creator: '当前用户', custTag: '1', companyId: '' })
    ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally { dialog.loading = false }
}
// 关账
const close = async row => {
  try { await confirmAction('确认关账？', '关账确认') } catch { return }
  await checkApi.close(row.id)
  ElMessage.success('关账成功')
  loadData()
}
const remove = row => confirmDelete(async () => { await checkApi.remove(row.id); loadData() }, '请确认是否删除该条数据?')
</script>
