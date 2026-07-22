<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="航线名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="航空公司">
        <el-select v-model="query.airline" placeholder="全部" clearable style="width: 120px"><el-option v-for="a in AIRLINES" :key="a" :label="a" :value="a" /></el-select>
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
        <el-form-item label="航线名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="航班号" prop="flightNo"><el-input v-model="form.flightNo" placeholder="请输入航班号" /></el-form-item>
        <el-form-item label="起飞港" prop="fromPort"><el-input v-model="form.fromPort" placeholder="请输入起飞港" /></el-form-item>
        <el-form-item label="到达港" prop="toPort"><el-input v-model="form.toPort" placeholder="请输入到达港" /></el-form-item>
        <el-form-item label="航空公司" prop="airline">
          <el-select v-model="form.airline" style="width: 100%"><el-option v-for="a in AIRLINES" :key="a" :label="a" :value="a" /></el-select>
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
import { flightApi, AIRLINES, STATUS_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpFlight' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(flightApi.list, { name: '', airline: '', status: '' })
const columns = [
  { prop: 'name', label: '航线名称', minWidth: 150 },
  { prop: 'flightNo', label: '航班号', width: 110 },
  { prop: 'fromPort', label: '起飞港', width: 100 },
  { prop: 'toPort', label: '到达港', width: 100 },
  { prop: 'airline', label: '航空公司', width: 110 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')], airline: [required('请选择航空公司', 'change')] }
const defaultForm = () => ({ name: '', flightNo: '', fromPort: '', toPort: '', airline: '国航', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: flightApi, defaultForm, reload: loadData, label: '航线' })
</script>
