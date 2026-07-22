<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="通知标题"><el-input v-model="query.name" placeholder="请输入标题" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="width: 110px"><el-option label="系统" value="系统" /><el-option label="公告" value="公告" /></el-select>
      </el-form-item>
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
        <el-form-item label="通知标题" prop="name"><el-input v-model="form.name" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width: 100%"><el-option label="系统" value="系统" /><el-option label="公告" value="公告" /></el-select>
        </el-form-item>
        <el-form-item label="发布人" prop="publisher"><el-input v-model="form.publisher" placeholder="请输入发布人" /></el-form-item>
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
import { noticeMngApi, STATUS_OPTIONS } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeMng' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(noticeMngApi.list, { name: '', type: '', status: '' })
const columns = [
  { prop: 'name', label: '通知标题', minWidth: 180 },
  { prop: 'type', label: '类型', width: 110 },
  { prop: 'publisher', label: '发布人', width: 120 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入标题')] }
const defaultForm = () => ({ name: '', type: '系统', publisher: '', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: noticeMngApi, defaultForm, reload: loadData, label: '通知' })
</script>
