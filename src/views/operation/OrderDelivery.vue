<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="派送单号"><el-input v-model="query.name" placeholder="请输入单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-status="{ row }"><el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" @change="v => toggle(row, v)" /></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="派送单号" prop="name"><el-input v-model="form.name" placeholder="请输入单号" /></el-form-item>
        <el-form-item label="客户" prop="customer"><el-input v-model="form.customer" placeholder="请输入客户" /></el-form-item>
        <el-form-item label="派送地址" prop="address"><el-input v-model="form.address" placeholder="请输入地址" /></el-form-item>
        <el-form-item label="派送方式" prop="mode">
          <el-select v-model="form.mode" style="width: 100%"><el-option v-for="m in DELIVERY_MODES" :key="m" :label="m" :value="m" /></el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status"><el-radio v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</el-radio></el-radio-group>
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
import { deliveryApi, DELIVERY_MODES, STATUS_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpDelivery' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(deliveryApi.list, { name: '', status: '' })
const columns = [
  { prop: 'name', label: '派送单号', width: 140 },
  { prop: 'customer', label: '客户', width: 130 },
  { prop: 'address', label: '派送地址', minWidth: 150 },
  { prop: 'mode', label: '派送方式', width: 110 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入单号')] }
const defaultForm = () => ({ name: '', customer: '', address: '', mode: '自提', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: deliveryApi, defaultForm, reload: loadData, label: '订单派送' })
</script>
