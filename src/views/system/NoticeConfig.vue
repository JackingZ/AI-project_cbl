<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="通知名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="渠道">
        <el-select v-model="query.channel" placeholder="全部" clearable style="width: 110px"><el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" /></el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" @change="loadData">
        <template #col-status="{ row }"><el-switch :model-value="row.status" active-value="启用" inactive-value="禁用" :disabled="!can('edit')" @change="v => toggle(row, v)" /></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>
    <Modal v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="通知名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="渠道" prop="channel">
          <el-select v-model="form.channel" style="width: 100%"><el-option v-for="c in CHANNELS" :key="c" :label="c" :value="c" /></el-select>
        </el-form-item>
        <el-form-item label="触发事件" prop="event">
          <el-select v-model="form.event" style="width: 100%"><el-option v-for="e in NOTICE_EVENTS" :key="e" :label="e" :value="e" /></el-select>
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
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { noticeCfgApi, CHANNELS, NOTICE_EVENTS, STATUS_OPTIONS } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeCfg' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(noticeCfgApi.list, { name: '', channel: '', status: '' })
const { can } = usePagePerms()
const columns = [
  { prop: 'name', label: '通知名称', minWidth: 160 },
  { prop: 'channel', label: '渠道', width: 100 },
  { prop: 'event', label: '触发事件', width: 110 },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]
const rules = { name: [required('请输入名称')] }
const defaultForm = () => ({ name: '', channel: '站内', event: '下单', status: '启用' })
const { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove } = useCrudForm({ api: noticeCfgApi, defaultForm, reload: loadData, label: '通知配置' })
</script>
