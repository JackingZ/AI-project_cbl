<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="标题"><el-input v-model="query.name" placeholder="请输入标题" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.type" placeholder="全部" clearable style="width: 110px"><el-option v-for="t in NOTICE_TYPES" :key="t" :label="t" :value="t" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.read" placeholder="全部" clearable style="width: 110px"><el-option v-for="r in READ_STATUS" :key="r" :label="r" :value="r" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-read="{ row }">
          <el-tag size="small" :type="row.read === '已读' ? 'info' : 'warning'">{{ row.read }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="标题" prop="name"><el-input v-model="form.name" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width: 100%"><el-option v-for="t in NOTICE_TYPES" :key="t" :label="t" :value="t" /></el-select>
        </el-form-item>
        <el-form-item label="状态" prop="read">
          <el-select v-model="form.read" style="width: 100%"><el-option v-for="r in READ_STATUS" :key="r" :label="r" :value="r" /></el-select>
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
import { noticeCtrApi, NOTICE_TYPES, READ_STATUS } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeCtr' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(noticeCtrApi.list, { name: '', type: '', read: '' })
const { can } = usePagePerms()
const columns = [
  { prop: 'name', label: '标题', minWidth: 180 },
  { prop: 'type', label: '类型', width: 110 },
  { prop: 'read', label: '状态', width: 100, align: 'center' },
  { prop: 'date', label: '时间', width: 170 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入标题')] }
const defaultForm = () => ({ name: '', type: '系统', read: '未读' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: noticeCtrApi, defaultForm, reload: loadData, label: '通知' })
</script>
