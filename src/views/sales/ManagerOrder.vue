<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="经理人"><el-input v-model="query.name" placeholder="请输入姓名" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-performance="{ row }">{{ formatMoney(row.performance) }}</template>
        <template #col-status="{ row }"><el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" @change="v => toggle(row, v)" /></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="经理人姓名" prop="name"><el-input v-model="form.name" placeholder="请输入姓名" /></el-form-item>
        <el-form-item label="联系电话" prop="phone"><el-input v-model="form.phone" placeholder="请输入电话" /></el-form-item>
        <el-form-item label="团队规模" prop="teamSize"><el-input-number v-model="form.teamSize" :min="0" :controls="false" style="width: 100%" /></el-form-item>
        <el-form-item label="业绩" prop="performance"><el-input-number v-model="form.performance" :min="0" :precision="2" :controls="false" style="width: 100%" /></el-form-item>
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
import { required, phoneRule } from '@/utils/validate'
import { formatMoney } from '@/utils/format'
import { managerApi, STATUS_OPTIONS } from '@/api/modules/sales'

defineOptions({ name: 'SalesManager' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(managerApi.list, { name: '', status: '' })
const columns = [
  { prop: 'name', label: '经理人姓名', minWidth: 140 },
  { prop: 'phone', label: '联系电话', width: 140 },
  { prop: 'teamSize', label: '团队规模', width: 100, align: 'center' },
  { prop: 'performance', label: '业绩', width: 140 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入姓名')], phone: [phoneRule] }
const defaultForm = () => ({ name: '', phone: '', teamSize: 0, performance: 0, status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: managerApi, defaultForm, reload: loadData, label: '经理人' })
</script>
