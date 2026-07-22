<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="验货单号"><el-input v-model="query.applyNo" placeholder="请输入单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="验货结果">
        <el-select v-model="query.result" placeholder="全部" clearable style="width: 110px"><el-option label="合格" value="合格" /><el-option label="不合格" value="不合格" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.taskStatus" placeholder="全部" clearable style="width: 120px"><el-option label="待验货" value="待验货" /><el-option label="已验货" value="已验货" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="验货单号" prop="applyNo"><el-input v-model="form.applyNo" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="订单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="请输入订单号" /></el-form-item>
        <el-form-item label="验货结果" prop="result">
          <el-select v-model="form.result" style="width: 100%"><el-option label="合格" value="合格" /><el-option label="不合格" value="不合格" /></el-select>
        </el-form-item>
        <el-form-item label="状态" prop="taskStatus">
          <el-select v-model="form.taskStatus" style="width: 100%"><el-option label="待验货" value="待验货" /><el-option label="已验货" value="已验货" /></el-select>
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
import { examineApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhExamine' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(examineApi.list, { applyNo: '', result: '', taskStatus: '' })
const columns = [
  { prop: 'applyNo', label: '验货单号', width: 140 },
  { prop: 'orderNo', label: '订单号', width: 130 },
  { prop: 'result', label: '验货结果', width: 110, align: 'center' },
  { prop: 'taskStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { applyNo: [required('请输入单号')] }
const defaultForm = () => ({ applyNo: '', orderNo: '', result: '合格', taskStatus: '待验货' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: examineApi, defaultForm, reload: loadData, label: '验货单' })
</script>
