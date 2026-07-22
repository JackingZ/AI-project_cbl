<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="申请单号"><el-input v-model="query.applyNo" placeholder="请输入单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="申请人"><el-input v-model="query.applicant" placeholder="请输入申请人" clearable style="width: 150px" /></el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.audit" placeholder="全部" clearable style="width: 120px"><el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-amount="{ row }">{{ formatMoney(row.amount) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="申请单号" prop="applyNo"><el-input v-model="form.applyNo" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="申请人" prop="applicant"><el-input v-model="form.applicant" placeholder="请输入申请人" /></el-form-item>
        <el-form-item label="金额" prop="amount"><el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="审核状态" prop="audit">
          <el-select v-model="form.audit" style="width: 100%"><el-option v-for="a in AUDIT_STATUS" :key="a" :label="a" :value="a" /></el-select>
        </el-form-item>
        <el-form-item label="申请日期" prop="date"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, useCrudForm } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { formatMoney } from '@/utils/format'
import { cashApi, AUDIT_STATUS } from '@/api/modules/financial'

defineOptions({ name: 'FinCash' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(cashApi.list, { applyNo: '', applicant: '', audit: '' })
const columns = [
  { prop: 'applyNo', label: '申请单号', width: 130 },
  { prop: 'applicant', label: '申请人', minWidth: 130 },
  { prop: 'amount', label: '金额', width: 140 },
  { prop: 'audit', label: '审核状态', width: 100, align: 'center' },
  { prop: 'date', label: '申请日期', width: 130 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { applyNo: [required('请输入单号')], applicant: [required('请输入申请人')] }
const defaultForm = () => ({ applyNo: '', applicant: '', amount: 0, audit: '待审核', date: '' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: cashApi, defaultForm, reload: loadData, label: '申请单' })
</script>
