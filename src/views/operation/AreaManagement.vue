<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="层级">
        <el-select v-model="query.level" placeholder="全部" clearable style="width: 110px"><el-option v-for="l in AREA_LEVELS" :key="l" :label="l" :value="l" /></el-select>
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
        <el-form-item label="名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="区域编码" prop="code"><el-input v-model="form.code" placeholder="请输入编码" /></el-form-item>
        <el-form-item label="层级" prop="level">
          <el-select v-model="form.level" style="width: 100%"><el-option v-for="l in AREA_LEVELS" :key="l" :label="l" :value="l" /></el-select>
        </el-form-item>
        <el-form-item label="英文名称" prop="alias"><el-input v-model="form.alias" placeholder="English name" /></el-form-item>
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
import { areaApi, AREA_LEVELS, STATUS_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpArea' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(areaApi.list, { name: '', level: '', status: '' })
const columns = [
  { prop: 'name', label: '名称', minWidth: 150 },
  { prop: 'code', label: '区域编码', width: 120 },
  { prop: 'level', label: '层级', width: 100 },
  { prop: 'alias', label: '英文名称', width: 120 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')] }
const defaultForm = () => ({ name: '', code: '', level: '国家', alias: '', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: areaApi, defaultForm, reload: loadData, label: '区域' })
</script>
