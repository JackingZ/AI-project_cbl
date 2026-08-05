<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="计量单号"><el-input v-model="query.applyNo" placeholder="请输入单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.taskStatus" placeholder="全部" clearable style="width: 120px"><el-option label="待计量" value="待计量" /><el-option label="已计量" value="已计量" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="计量单号" prop="applyNo"><el-input v-model="form.applyNo" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="订单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="请输入订单号" /></el-form-item>
        <el-form-item label="重量(kg)" prop="weight"><el-input-number v-model="form.weight" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="体积(m³)" prop="volume"><el-input-number v-model="form.volume" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" prop="taskStatus">
          <el-select v-model="form.taskStatus" style="width: 100%"><el-option label="待计量" value="待计量" /><el-option label="已计量" value="已计量" /></el-select>
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
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { measureApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhMeasure' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(measureApi.list, { applyNo: '', taskStatus: '' })
const columns = [
  { prop: 'applyNo', label: '计量单号', width: 140 },
  { prop: 'orderNo', label: '订单号', minWidth: 130 },
  { prop: 'weight', label: '重量(kg)', width: 100, align: 'center' },
  { prop: 'volume', label: '体积(m³)', width: 100, align: 'center' },
  { prop: 'taskStatus', label: '状态', width: 100, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { applyNo: [required('请输入单号')] }
const defaultForm = () => ({ applyNo: '', orderNo: '', weight: 0, volume: 0, taskStatus: '待计量' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: measureApi, defaultForm, reload: loadData, label: '计量单' })
</script>
