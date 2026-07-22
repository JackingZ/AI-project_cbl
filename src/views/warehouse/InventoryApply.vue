<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="盘点单号"><el-input v-model="query.applyNo" placeholder="请输入单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="盘点类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="width: 110px"><el-option label="全盘" value="全盘" /><el-option label="抽盘" value="抽盘" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.taskStatus" placeholder="全部" clearable style="width: 120px"><el-option label="盘点中" value="盘点中" /><el-option label="已完成" value="已完成" /></el-select>
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
        <el-form-item label="盘点单号" prop="applyNo"><el-input v-model="form.applyNo" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="仓库" prop="warehouse"><el-input v-model="form.warehouse" placeholder="请输入仓库" /></el-form-item>
        <el-form-item label="盘点类型" prop="type">
          <el-select v-model="form.type" style="width: 100%"><el-option label="全盘" value="全盘" /><el-option label="抽盘" value="抽盘" /></el-select>
        </el-form-item>
        <el-form-item label="状态" prop="taskStatus">
          <el-select v-model="form.taskStatus" style="width: 100%"><el-option label="盘点中" value="盘点中" /><el-option label="已完成" value="已完成" /></el-select>
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
import { inventoryApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhInventory' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(inventoryApi.list, { applyNo: '', type: '', taskStatus: '' })
const columns = [
  { prop: 'applyNo', label: '盘点单号', width: 140 },
  { prop: 'warehouse', label: '仓库', minWidth: 120 },
  { prop: 'type', label: '盘点类型', width: 110 },
  { prop: 'taskStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { applyNo: [required('请输入单号')] }
const defaultForm = () => ({ applyNo: '', warehouse: '', type: '全盘', taskStatus: '盘点中' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: inventoryApi, defaultForm, reload: loadData, label: '盘点单' })
</script>
