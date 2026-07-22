<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="换单号"><el-input v-model="query.taskNo" placeholder="请输入换单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.taskStatus" placeholder="全部" clearable style="width: 120px"><el-option label="待换单" value="待换单" /><el-option label="已换单" value="已换单" /></el-select>
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
        <el-form-item label="换单号" prop="taskNo"><el-input v-model="form.taskNo" placeholder="请输入换单号" /></el-form-item>
        <el-form-item label="原单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="请输入原单号" /></el-form-item>
        <el-form-item label="新单号" prop="newNo"><el-input v-model="form.newNo" placeholder="请输入新单号" /></el-form-item>
        <el-form-item label="状态" prop="taskStatus">
          <el-select v-model="form.taskStatus" style="width: 100%"><el-option label="待换单" value="待换单" /><el-option label="已换单" value="已换单" /></el-select>
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
import { transferApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhTransfer' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(transferApi.list, { taskNo: '', taskStatus: '' })
const columns = [
  { prop: 'taskNo', label: '换单号', width: 140 },
  { prop: 'orderNo', label: '原单号', width: 130 },
  { prop: 'newNo', label: '新单号', width: 130 },
  { prop: 'taskStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { taskNo: [required('请输入换单号')] }
const defaultForm = () => ({ taskNo: '', orderNo: '', newNo: '', taskStatus: '待换单' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: transferApi, defaultForm, reload: loadData, label: '换单' })
</script>
