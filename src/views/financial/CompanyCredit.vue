<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="公司名称"><el-input v-model="query.company" placeholder="请输入公司" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="信用等级">
        <el-select v-model="query.level" placeholder="全部" clearable style="width: 110px"><el-option v-for="l in CREDIT_LEVELS" :key="l" :label="l" :value="l" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-creditLimit="{ row }">{{ formatMoney(row.creditLimit) }}</template>
        <template #col-used="{ row }">{{ formatMoney(row.used) }}</template>
        <template #col-status="{ row }"><el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" @change="v => toggle(row, v)" /></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="公司名称" prop="company"><el-input v-model="form.company" placeholder="请输入公司" /></el-form-item>
        <el-form-item label="信用额度" prop="creditLimit"><el-input-number v-model="form.creditLimit" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="已用额度" prop="used"><el-input-number v-model="form.used" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="信用等级" prop="level">
          <el-select v-model="form.level" style="width: 100%"><el-option v-for="l in CREDIT_LEVELS" :key="l" :label="l" :value="l" /></el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"><el-radio v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</el-radio></el-radio-group>
        </el-form-item>
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
import { creditApi, CREDIT_LEVELS, STATUS_OPTIONS } from '@/api/modules/financial'

defineOptions({ name: 'FinCredit' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(creditApi.list, { company: '', level: '', status: '' })
const columns = [
  { prop: 'company', label: '公司名称', minWidth: 160 },
  { prop: 'creditLimit', label: '信用额度', width: 140 },
  { prop: 'used', label: '已用额度', width: 140 },
  { prop: 'level', label: '信用等级', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { company: [required('请输入公司')] }
const defaultForm = () => ({ company: '', creditLimit: 0, used: 0, level: 'A', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: creditApi, defaultForm, reload: loadData, label: '公司信用' })
</script>
