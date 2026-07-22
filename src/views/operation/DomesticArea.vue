<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="区域名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
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
        <el-form-item label="区域名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="区域编码" prop="code"><el-input v-model="form.code" placeholder="请输入编码" /></el-form-item>
        <el-form-item label="省份" prop="province"><el-input v-model="form.province" placeholder="请输入省份" /></el-form-item>
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
import { domesticAreaApi, STATUS_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpDomesticArea' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(domesticAreaApi.list, { name: '', status: '' })
const columns = [
  { prop: 'name', label: '区域名称', minWidth: 160 },
  { prop: 'code', label: '区域编码', width: 120 },
  { prop: 'province', label: '省份', width: 120 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')] }
const defaultForm = () => ({ name: '', code: '', province: '', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: domesticAreaApi, defaultForm, reload: loadData, label: '区域' })
</script>
