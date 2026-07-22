<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="任务号"><el-input v-model="query.taskNo" placeholder="请输入任务号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.taskStatus" placeholder="全部" clearable style="width: 120px"><el-option label="待拆柜" value="待拆柜" /><el-option label="已拆柜" value="已拆柜" /></el-select>
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
        <el-form-item label="任务号" prop="taskNo"><el-input v-model="form.taskNo" placeholder="请输入任务号" /></el-form-item>
        <el-form-item label="柜号" prop="containerNo"><el-input v-model="form.containerNo" placeholder="请输入柜号" /></el-form-item>
        <el-form-item label="仓库" prop="warehouse"><el-input v-model="form.warehouse" placeholder="请输入仓库" /></el-form-item>
        <el-form-item label="状态" prop="taskStatus">
          <el-select v-model="form.taskStatus" style="width: 100%"><el-option label="待拆柜" value="待拆柜" /><el-option label="已拆柜" value="已拆柜" /></el-select>
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
import { removalApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhRemoval' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(removalApi.list, { taskNo: '', taskStatus: '' })
const columns = [
  { prop: 'taskNo', label: '任务号', width: 140 },
  { prop: 'containerNo', label: '柜号', width: 130 },
  { prop: 'warehouse', label: '仓库', minWidth: 120 },
  { prop: 'taskStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { taskNo: [required('请输入任务号')] }
const defaultForm = () => ({ taskNo: '', containerNo: '', warehouse: '', taskStatus: '待拆柜' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: removalApi, defaultForm, reload: loadData, label: '拆柜任务' })
</script>
