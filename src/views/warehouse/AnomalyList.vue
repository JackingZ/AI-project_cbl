<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="异常单号"><el-input v-model="query.code" placeholder="请输入单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="异常类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="width: 120px"><el-option v-for="t in TYPES" :key="t" :label="t" :value="t" /></el-select>
      </el-form-item>
      <el-form-item label="处理状态">
        <el-select v-model="query.handle" placeholder="全部" clearable style="width: 120px"><el-option label="待处理" value="待处理" /><el-option label="已处理" value="已处理" /></el-select>
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
        <el-form-item label="异常单号" prop="code"><el-input v-model="form.code" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="订单号" prop="orderNo"><el-input v-model="form.orderNo" placeholder="请输入订单号" /></el-form-item>
        <el-form-item label="异常类型" prop="type">
          <el-select v-model="form.type" style="width: 100%"><el-option v-for="t in TYPES" :key="t" :label="t" :value="t" /></el-select>
        </el-form-item>
        <el-form-item label="处理状态" prop="handle">
          <el-select v-model="form.handle" style="width: 100%"><el-option label="待处理" value="待处理" /><el-option label="已处理" value="已处理" /></el-select>
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
import { anomalyApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhAnomaly' })
const TYPES = ['破损', '缺件', '超重']
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(anomalyApi.list, { code: '', type: '', handle: '' })
const columns = [
  { prop: 'code', label: '异常单号', width: 140 },
  { prop: 'orderNo', label: '订单号', width: 130 },
  { prop: 'type', label: '异常类型', width: 110 },
  { prop: 'handle', label: '处理状态', width: 110, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { code: [required('请输入单号')] }
const defaultForm = () => ({ code: '', orderNo: '', type: '破损', handle: '待处理' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: anomalyApi, defaultForm, reload: loadData, label: '异常单' })
</script>
