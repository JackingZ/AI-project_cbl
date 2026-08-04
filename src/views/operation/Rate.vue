<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" @click="openAdd">新增记录</el-button>
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
        <template #col-records="{ row }">
          <el-button link type="primary" size="small" @click="openRecords(row)">汇率记录</el-button>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增/编辑货币对 -->
    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑记录' : '新增记录'" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="本币" prop="lcId">
          <el-select v-model="form.lcId" filterable clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="c in currencyOptions" :key="c.id" :label="`${c.name}-${c.sign}`" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标币种" prop="fcId">
          <el-select v-model="form.fcId" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in currencyOptions" :key="c.id" :label="`${c.name}-${c.sign}`" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 汇率记录子弹窗（生效日期 + 汇率明细） -->
    <el-dialog v-model="recordsDialog.visible" :title="recordsDialog.title" width="960px" :close-on-click-modal="false" @closed="loadData">
      <el-form ref="recordFormRef" :model="recordForm" :inline="true" :rules="recordRules" size="small">
        <el-form-item label="生效日期" prop="effective">
          <el-date-picker v-model="recordForm.effective" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="保留小数">
          <el-input-number v-model="decimals" controls-position="right" :min="2" :max="5" :step="1" step-strictly />
        </el-form-item>
        <el-form-item label="汇率" prop="rate">
          <el-input-number v-model="recordForm.rate" controls-position="right" :min="0" :precision="decimals" placeholder="请输入汇率" />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetRecordForm">清 空</el-button>
          <el-button type="primary" @click="saveRecord">{{ recordForm.id ? '保 存' : '新 增' }}</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="recordsLoading" :data="recordList" height="450" border style="width: 100%; margin: 10px 0">
        <el-table-column label="生效日期" prop="effective" />
        <el-table-column label="汇率" prop="rate" />
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="editRecord(scope.row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="removeRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import { rateApi, exRateApi, currencyApi } from '@/api/modules/operation'

defineOptions({ name: 'OpRate' })
const { query, list, total, loading, loadData } = useListQuery(rateApi.list, {})

const columns = [
  { prop: 'lcName', label: '本币', minWidth: 120 },
  { prop: 'lcCode', label: '本币编码', width: 120 },
  { prop: 'fcName', label: '目标币', minWidth: 120 },
  { prop: 'fcCode', label: '目标币编码', width: 120 },
  { prop: 'records', label: '汇率记录', width: 120 },
  { prop: 'rate', label: '最新汇率', width: 120 },
  { prop: 'updateTime', label: '最后更新', width: 200 }
]

// 货币下拉（取货币管理数据）
const currencyOptions = currencyApi.res.raw()

const rules = {
  lcId: [required('请选择本币', 'change')],
  fcId: [required('请选择目标币种', 'change')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive({ lcId: '', fcId: '' })

const findCur = id => currencyOptions.find(c => c.id === id) || {}
const openAdd = () => {
  Object.assign(form, { lcId: '', fcId: '' })
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { lcId: row.lcId ?? '', fcId: row.fcId ?? '' })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const lc = findCur(form.lcId)
    const fc = findCur(form.fcId)
    const payload = {
      lcId: form.lcId, lcName: lc.name, lcCode: lc.ccode,
      fcId: form.fcId, fcName: fc.name, fcCode: fc.ccode
    }
    if (dialog.isEdit) {
      await rateApi.update(dialog.id, payload)
    } else {
      await rateApi.add({ ...payload, rate: 0 })
    }
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('请确认是否删除该条数据?', async () => { await rateApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })

// ===== 汇率记录子弹窗 =====
const recordsDialog = reactive({ visible: false, title: '', exchangeId: null })
const recordsLoading = ref(false)
const recordList = ref([])
const decimals = ref(2)
const recordFormRef = ref(null)
const recordForm = reactive({ effective: '', rate: 0, id: null })
const recordRules = {
  effective: [{ required: true, message: '请选择生效日期' }],
  rate: [{ required: true, message: '请输入汇率' }]
}

const openRecords = row => {
  recordsDialog.exchangeId = row.id
  recordsDialog.title = `汇率记录（${row.lcName}兑${row.fcName}）`
  recordsDialog.visible = true
  resetRecordForm()
  loadRecords()
}
const loadRecords = async () => {
  recordsLoading.value = true
  try {
    const res = await exRateApi.list({ exchangeId: recordsDialog.exchangeId, size: 999 })
    // 按生效日期倒序
    recordList.value = [...res.data.list].sort((a, b) => (a.effective < b.effective ? 1 : -1))
  } finally {
    recordsLoading.value = false
  }
}
const resetRecordForm = () => {
  Object.assign(recordForm, { effective: '', rate: 0, id: null })
  decimals.value = 2
  recordFormRef.value?.clearValidate()
}
// 保存子记录后，同步主表最新汇率（取最近生效日期）
const syncLatest = async () => {
  const rows = recordList.value
  if (rows.length) {
    await rateApi.update(recordsDialog.exchangeId, { rate: rows[0].rate, updateTime: rows[0].effective })
  }
}
const saveRecord = async () => {
  await recordFormRef.value.validate()
  if (recordForm.id) {
    await exRateApi.update(recordForm.id, { effective: recordForm.effective, rate: recordForm.rate })
  } else {
    await exRateApi.add({ exchangeId: recordsDialog.exchangeId, effective: recordForm.effective, rate: recordForm.rate })
  }
  ElMessage.success('操作成功')
  resetRecordForm()
  await loadRecords()
  await syncLatest()
}
const editRecord = row => {
  Object.assign(recordForm, { effective: row.effective, rate: row.rate, id: row.id })
}
const removeRecord = row =>
  confirmThen('请确认是否删除该条数据?', async () => {
    await exRateApi.remove(row.id)
    await loadRecords()
    await syncLatest()
  }, { title: '温馨提示', success: '删除成功' })
</script>

<style scoped lang="scss">
.op-toolbar { margin-bottom: $space-md; }
</style>
