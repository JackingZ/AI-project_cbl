<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="看板名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
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
        <el-form-item label="看板名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="销售员" prop="salesman"><el-input v-model="form.salesman" placeholder="请输入销售员" /></el-form-item>
        <el-form-item label="销售额" prop="amount"><el-input-number v-model="form.amount" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="订单数" prop="orders"><el-input-number v-model="form.orders" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="排名" prop="rank"><el-input v-model="form.rank" placeholder="如：第1名" /></el-form-item>
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
import { boardApi } from '@/api/modules/sales'

defineOptions({ name: 'SalesBillboard' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(boardApi.list, { name: '' })
const columns = [
  { prop: 'name', label: '看板名称', minWidth: 160 },
  { prop: 'salesman', label: '销售员', width: 120 },
  { prop: 'amount', label: '销售额', width: 140 },
  { prop: 'orders', label: '订单数', width: 100, align: 'center' },
  { prop: 'rank', label: '排名', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')] }
const defaultForm = () => ({ name: '', salesman: '', amount: 0, orders: 0, rank: '' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: boardApi, defaultForm, reload: loadData, label: '看板' })
</script>
