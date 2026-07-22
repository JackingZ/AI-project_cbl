<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="统计周期"><el-input v-model="query.period" placeholder="如 2024-06" clearable style="width: 170px" /></el-form-item>
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
        <el-form-item label="统计周期" prop="period"><el-input v-model="form.period" placeholder="如 2024-06" /></el-form-item>
        <el-form-item label="订单数" prop="orderCount"><el-input-number v-model="form.orderCount" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="订单金额" prop="amount"><el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="客户" prop="customer"><el-input v-model="form.customer" placeholder="请输入客户" /></el-form-item>
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
import { statApi } from '@/api/modules/sales'

defineOptions({ name: 'SalesStat' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(statApi.list, { period: '' })
const columns = [
  { prop: 'period', label: '统计周期', width: 140 },
  { prop: 'orderCount', label: '订单数', width: 110, align: 'center' },
  { prop: 'amount', label: '订单金额', width: 150 },
  { prop: 'customer', label: '客户', minWidth: 140 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { period: [required('请输入统计周期')] }
const defaultForm = () => ({ period: '', orderCount: 0, amount: 0, customer: '' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: statApi, defaultForm, reload: loadData, label: '统计' })
</script>
