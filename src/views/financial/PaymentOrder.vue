<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="付款单号"><el-input v-model="query.orderNo" placeholder="请输入单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="供应商"><el-input v-model="query.supplier" placeholder="请输入供应商" clearable style="width: 150px" /></el-form-item>
      <el-form-item label="付款方式">
        <el-select v-model="query.method" placeholder="全部" clearable style="width: 130px"><el-option v-for="m in PAY_METHODS" :key="m" :label="m" :value="m" /></el-select>
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
        <el-form-item label="付款单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="供应商" prop="supplier"><el-input v-model="form.supplier" placeholder="请输入供应商" /></el-form-item>
        <el-form-item label="金额" prop="amount"><el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="付款方式" prop="method">
          <el-select v-model="form.method" style="width: 100%"><el-option v-for="m in PAY_METHODS" :key="m" :label="m" :value="m" /></el-select>
        </el-form-item>
        <el-form-item label="付款日期" prop="date"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
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
import { paymentApi, PAY_METHODS } from '@/api/modules/financial'

defineOptions({ name: 'FinPayment' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(paymentApi.list, { orderNo: '', supplier: '', method: '' })
const columns = [
  { prop: 'orderNo', label: '付款单号', width: 130 },
  { prop: 'supplier', label: '供应商', minWidth: 140 },
  { prop: 'amount', label: '金额', width: 140 },
  { prop: 'method', label: '付款方式', width: 120 },
  { prop: 'date', label: '付款日期', width: 130 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { orderNo: [required('请输入单号')], supplier: [required('请输入供应商')] }
const defaultForm = () => ({ orderNo: '', supplier: '', amount: 0, method: '银行转账', date: '' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: paymentApi, defaultForm, reload: loadData, label: '付款单' })
</script>
