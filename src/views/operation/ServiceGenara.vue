<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增服务大类</el-button>
        <div class="op-filters">
          <el-select v-model="query.type" placeholder="公司类型" clearable style="width: 200px">
            <el-option label="供应商" value="3" />
            <el-option label="代理商" value="2" />
            <el-option label="客户" value="1" />
          </el-select>
          <el-input v-model="query.name" :maxlength="20" placeholder="请输入" style="width: 300px">
            <template #prepend>服务大类</template>
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
        <template #col-supplier="{ row }">{{ row.supplier ? '√' : '--' }}</template>
        <template #col-agent="{ row }">{{ row.agent ? '√' : '--' }}</template>
        <template #col-customer="{ row }">{{ row.customer ? '√' : '--' }}</template>
        <template #col-subtype="{ row }">
          <el-button link type="primary" size="small" @click="openSubType(row)">服务类型</el-button>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 服务大类 新增/编辑 -->
    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑服务大类' : '新增服务大类'" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="服务大类" prop="name">
          <el-input v-model="form.name" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="公司类型" prop="type">
          <el-select v-model="form.type" multiple clearable placeholder="请选择" style="width: 100%">
            <el-option label="供应商" value="3" />
            <el-option label="代理商" value="2" />
            <el-option label="客户" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number v-model="form.sort" :controls="false" :min="0" :max="9999" :step="1" step-strictly placeholder="请输入" style="width: 100%" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 服务类型子弹窗 -->
    <el-dialog v-model="subDialog.visible" :title="`服务类型【${subDialog.typeName}】`" width="600px" :close-on-click-modal="false">
      <el-button type="primary" link :icon="Plus" @click="openSubForm()">新增服务类型</el-button>
      <el-table :data="subList" height="450" border style="width: 100%; margin: 10px 0">
        <el-table-column prop="name" label="服务类型" />
        <el-table-column label="逾期计费" width="100">
          <template #default="s">{{ overdueLabel(s.row.overdue) }}</template>
        </el-table-column>
        <el-table-column label="计费区间" width="180">
          <template #default="s">{{ chargesText(s.row.overdueCharges) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="s">
            <el-button link type="primary" size="small" @click="editSub(s.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 服务类型 新增/编辑 -->
    <Modal v-model="subFormDialog.visible" :title="subFormDialog.isEdit ? '编辑服务类型' : '新增服务类型'" width="600px" append-to-body @confirm="saveSub">
      <el-form ref="subFormRef" :model="subForm" :rules="subRules" label-width="90px">
        <el-form-item label="服务类型" prop="name">
          <el-input v-model="subForm.name" maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="逾期计费" prop="overdue">
          <el-select v-model="subForm.overdue" placeholder="请选择" style="width: 100%">
            <el-option label="按重量" value="0" />
            <el-option label="按体积" value="1" />
            <el-option label="按比例" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="计费区间" prop="overdueCharges">
          <div v-for="(item, index) in subForm.overdueCharges" :key="index" class="charge-row">
            <el-input-number v-model="item.lower" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="输入下限" style="width: 120px" />
            <el-input-number v-model="item.upper" :controls="false" :min="0" :max="999999" :step="1" step-strictly placeholder="输入上限" style="width: 120px" />
            <el-input-number v-model="item.amount" :controls="false" :min="0" :max="999999" :precision="2" placeholder="单位金额" style="width: 120px" />
            <el-icon v-if="index === 0" class="charge-row__icon" @click="addRange"><CirclePlus /></el-icon>
            <el-icon v-else class="charge-row__icon" @click="removeRange(index)"><Remove /></el-icon>
          </div>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, CirclePlus, Remove } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { generaApi, subtypeApi } from '@/api/modules/operation'

defineOptions({ name: 'OpGenera' })
const { query, list, total, loading, loadData, handleSearch } = useListQuery(generaApi.list, { type: '', name: '' })

const columns = [
  { prop: 'name', label: '服务大类', minWidth: 120 },
  { prop: 'supplier', label: '供应商', width: 120 },
  { prop: 'agent', label: '代理商', width: 140 },
  { prop: 'customer', label: '客户', width: 140 },
  { prop: 'sort', label: '排序值', width: 150 },
  { prop: 'subtype', label: '添加类型', width: 120 },
  { prop: 'createTime', label: '添加时间', width: 180 }
]

// ===== 主表 新增/编辑 =====
const rules = {
  name: [required('服务大类不能为空')],
  sort: [required('排序值不能为空')]
}
const defaultForm = () => ({ name: '', type: [], sort: undefined })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  const type = []
  if (row.customer) type.push('1')
  if (row.agent) type.push('2')
  if (row.supplier) type.push('3')
  Object.assign(form, { name: row.name, sort: row.sort, type })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = {
      name: form.name, sort: form.sort,
      customer: form.type.includes('1'), agent: form.type.includes('2'), supplier: form.type.includes('3')
    }
    if (dialog.isEdit) await generaApi.update(dialog.id, payload)
    else await generaApi.add(payload)
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

// ===== 服务类型子弹窗 =====
const subDialog = reactive({ visible: false, typeId: null, typeName: '' })
const subList = ref([])
const overdueLabel = v => ({ 0: '按重量', 1: '按体积', 2: '按比例' }[v] || '')
const chargesText = arr => (arr || []).filter(c => c.lower != null && c.upper).map(c => `${c.lower}-${c.upper}`).join(', ')

const openSubType = row => {
  subDialog.typeId = row.id
  subDialog.typeName = row.name
  subDialog.visible = true
  loadSub()
}
const loadSub = async () => {
  const res = await subtypeApi.list({ typeId: subDialog.typeId, size: 999 })
  subList.value = res.data.list
}

// 服务类型 新增/编辑
const subFormRef = ref(null)
const subFormDialog = reactive({ visible: false, isEdit: false, id: null })
const defaultSubForm = () => ({ name: '', overdue: undefined, overdueCharges: [{ lower: undefined, upper: undefined, amount: undefined }] })
const subForm = reactive(defaultSubForm())
const subRules = {
  name: [required('服务类型不能为空')],
  overdue: [required('请选择逾期计费', 'change')]
}
const openSubForm = () => {
  Object.assign(subForm, defaultSubForm())
  Object.assign(subFormDialog, { visible: true, isEdit: false, id: null })
  subFormRef.value?.clearValidate()
}
const editSub = row => {
  Object.assign(subForm, {
    name: row.name, overdue: row.overdue,
    overdueCharges: (row.overdueCharges && row.overdueCharges.length)
      ? row.overdueCharges.map(c => ({ ...c }))
      : [{ lower: undefined, upper: undefined, amount: undefined }]
  })
  Object.assign(subFormDialog, { visible: true, isEdit: true, id: row.id })
  subFormRef.value?.clearValidate()
}
const addRange = () => subForm.overdueCharges.push({ lower: undefined, upper: undefined, amount: undefined })
const removeRange = i => subForm.overdueCharges.splice(i, 1)
const saveSub = async () => {
  await subFormRef.value.validate()
  const charges = subForm.overdueCharges
  // 三段业务校验（对齐源）
  if (!charges.every(c => c.lower >= 0 && c.upper && c.amount)) {
    return ElMessage.error('请完整填写计费值&单位金额')
  }
  if (charges.some(c => c.upper <= c.lower)) {
    return ElMessage.error('下限值不能大于等于上限值')
  }
  const overlap = charges.some((it, index) =>
    charges.some((r, i) => i !== index &&
      ((r.lower <= it.lower && it.lower < r.upper) || (r.lower < it.upper && it.upper <= r.upper))))
  if (overlap) {
    return ElMessage.error('区间范围不能重叠')
  }
  const payload = {
    typeId: subDialog.typeId, typeName: subDialog.typeName,
    name: subForm.name, overdue: subForm.overdue, overdueCharges: charges.map(c => ({ ...c }))
  }
  if (subFormDialog.isEdit) await subtypeApi.update(subFormDialog.id, payload)
  else await subtypeApi.add(payload)
  ElMessage.success('操作成功')
  subFormDialog.visible = false
  loadSub()
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
.op-filters { display: flex; gap: $space-sm; }
.charge-row {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-sm;
  &__icon { font-size: 20px; cursor: pointer; color: var(--el-color-primary); }
}
</style>
