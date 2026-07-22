<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="接口名称">
        <el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="快递公司">
        <el-select v-model="query.company" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="c in EXPRESS_COMPANIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-status="{ row }">
          <el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" @change="v => toggle(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="接口名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="快递公司" prop="company">
          <el-select v-model="form.company" placeholder="请选择" style="width: 100%">
            <el-option v-for="c in EXPRESS_COMPANIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口地址" prop="apiUrl"><el-input v-model="form.apiUrl" placeholder="请输入接口地址" /></el-form-item>
        <el-form-item label="环境" prop="env">
          <el-radio-group v-model="form.env"><el-radio v-for="e in ENVS" :key="e" :value="e">{{ e }}</el-radio></el-radio-group>
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
import { getExpressPortList, addExpressPort, updateExpressPort, deleteExpressPort, EXPRESS_COMPANIES, ENVS, STATUS_OPTIONS } from '@/api/modules/business'

defineOptions({ name: 'BizExpressPort' })

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getExpressPortList, { name: '', company: '', status: '' })

const columns = [
  { prop: 'name', label: '接口名称', minWidth: 160 },
  { prop: 'company', label: '快递公司', width: 120 },
  { prop: 'apiUrl', label: '接口地址', minWidth: 220 },
  { prop: 'env', label: '环境', width: 90, align: 'center' },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const rules = { name: [required('请输入名称')], company: [required('请选择快递公司', 'change')], apiUrl: [required('请输入接口地址')] }
const defaultForm = () => ({ name: '', company: 'DHL', apiUrl: '', env: '测试', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } =
  useCrudForm({ api: { add: addExpressPort, update: updateExpressPort, remove: deleteExpressPort }, defaultForm, reload: loadData, label: '接口' })
</script>
