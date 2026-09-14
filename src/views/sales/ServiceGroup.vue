<template>
  <div>
    <!-- 服务组列表：无独立筛选字段，仅「新增」+「查询」（源 app-panel 头部） -->
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <template #actions>
        <el-button type="success" :icon="CirclePlus" :disabled="!can('add')" @click="openAdd">新增</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="150" @change="loadData">
        <template #col-status="{ row }">
          <el-switch :model-value="row.status" active-value="1" inactive-value="0" @change="v => onStatus(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <GroupForm ref="groupFormRef" :is-edit="isEdit" @save-success="loadData" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import GroupForm from './components/group-form.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { groupApi } from '@/api/modules/sales'

defineOptions({ name: 'SalesGroup' })
const { can } = usePagePerms()

const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(groupApi.list, {})

const columns = [
  { prop: 'name', label: '服务组名称', width: 200 },
  { prop: 'countryName', label: '目的国', width: 200 },
  { prop: 'lscName', label: '服务', minWidth: 200 },
  { prop: 'status', label: '开关', width: 80, align: 'center' }
]

const groupFormRef = ref(null)
const isEdit = ref(false)
const openAdd = () => { isEdit.value = false; groupFormRef.value.show() }
const openEdit = row => { isEdit.value = true; groupFormRef.value.show(row) }

// 开关切换：确认后调 setGroupStatus；取消也刷新回滚显示（对齐源 onStatus）
const onStatus = (row, val) => {
  ElMessageBox.confirm(`请确认是否${val === '0' ? '关闭' : '开启'}该条数据?`, '提示', { type: 'warning' })
    .then(async () => {
      await groupApi.setStatus(row.id, val)
      ElMessage.success('操作成功')
      loadData()
    })
    .catch(() => loadData())
}

const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '提示', { type: 'warning' })
    .then(async () => {
      await groupApi.remove(row.id)
      ElMessage.success('删除成功')
      loadData()
    })
    .catch(() => {})
}
</script>
