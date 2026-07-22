<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="禁忌词"><el-input v-model="query.name" placeholder="请输入禁忌词" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="分类">
        <el-select v-model="query.category" placeholder="全部" clearable style="width: 120px"><el-option v-for="c in TABOO_CATEGORIES" :key="c" :label="c" :value="c" /></el-select>
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
        <el-form-item label="禁忌词" prop="name"><el-input v-model="form.name" placeholder="请输入禁忌词" /></el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" style="width: 100%"><el-option v-for="c in TABOO_CATEGORIES" :key="c" :label="c" :value="c" /></el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" /></el-form-item>
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
import { tabooApi, TABOO_CATEGORIES, STATUS_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpTaboo' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(tabooApi.list, { name: '', category: '', status: '' })
const columns = [
  { prop: 'name', label: '禁忌词', minWidth: 160 },
  { prop: 'category', label: '分类', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 140 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入禁忌词')], category: [required('请选择分类', 'change')] }
const defaultForm = () => ({ name: '', category: '政治', remark: '', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: tabooApi, defaultForm, reload: loadData, label: '禁忌词' })
</script>
