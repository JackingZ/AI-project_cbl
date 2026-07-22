<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="计划名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.planStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in PLAN_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-target="{ row }">{{ formatMoney(row.target) }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="计划名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="销售员" prop="salesman"><el-input v-model="form.salesman" placeholder="请输入销售员" /></el-form-item>
        <el-form-item label="目标额" prop="target"><el-input-number v-model="form.target" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="截止日期" prop="deadline"><el-date-picker v-model="form.deadline" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" prop="planStatus">
          <el-select v-model="form.planStatus" style="width: 100%"><el-option v-for="s in PLAN_STATUS" :key="s" :label="s" :value="s" /></el-select>
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
import { planApi, PLAN_STATUS } from '@/api/modules/sales'

defineOptions({ name: 'SalesPlan' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(planApi.list, { name: '', planStatus: '' })
const columns = [
  { prop: 'name', label: '计划名称', minWidth: 160 },
  { prop: 'salesman', label: '销售员', width: 120 },
  { prop: 'target', label: '目标额', width: 130 },
  { prop: 'deadline', label: '截止日期', width: 130 },
  { prop: 'planStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')] }
const defaultForm = () => ({ name: '', salesman: '', target: 0, deadline: '', planStatus: '进行中' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: planApi, defaultForm, reload: loadData, label: '销售计划' })
</script>
