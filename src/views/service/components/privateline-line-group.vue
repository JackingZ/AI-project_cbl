<template>
  <div class="app-panel" style="width: 100%">
    <el-row>
      <el-col :span="2">
        <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="handleAdd">新增</el-button>
      </el-col>
      <el-col :span="22" style="text-align: right">
        <el-button size="small" @click="$emit('back')">返回</el-button>
        <el-button type="primary" size="small" @click="loadData()">刷新</el-button>
      </el-col>
    </el-row>
    <el-table v-loading="loading" :data="tableData" height="calc(100vh - 313px)" style="width: 100%; margin: 10px 0" border>
      <el-table-column prop="name" label="服务组名称" width="200" show-overflow-tooltip />
      <el-table-column prop="countryName" label="目的国" width="200" show-overflow-tooltip />
      <el-table-column prop="lscName" label="服务" min-width="200" show-overflow-tooltip />
      <el-table-column label="开关" width="80" show-overflow-tooltip>
        <template #default="scope">
          <el-switch :model-value="normalizeSwitchValue(scope.row.status)" class="switchStyle" active-value="1" inactive-value="0" @change="value => onStatus(scope.row, value)" />
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="150">
        <template #default="scope">
          <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="primary" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="pagination.page" :page-size="pagination.size" layout="total, prev, pager, next" :total="pagination.total" style="text-align: right" @current-change="loadData()" />

    <PrivatelineGroupForm ref="groupFormRef" :is-edit="isEdit" @save-success="loadData()" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import PrivatelineGroupForm from './privateline-group-form.vue'
import { normalizeSwitchValue } from '@/utils/format'
import { lineGroupApi } from '@/api/modules/service'

defineOptions({ name: 'PrivatelineLineGroup' })
defineEmits(['back'])

const loading = ref(false)
const isEdit = ref(false)
const tableData = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const groupFormRef = ref()

const onStatus = (row, val) => {
  const olds = String(row.status); const news = String(val)
  if (!olds || olds === news) return
  ElMessageBox.confirm(`请确认是否${news === '0' ? '关闭' : '开启'}该条数据?`, '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await lineGroupApi.changeStatus(row.id, val); ElMessage.success('操作成功'); loadData() })
    .catch(() => loadData())
}
const handleAdd = () => { isEdit.value = false; groupFormRef.value.show() }
const handleEdit = row => { isEdit.value = true; groupFormRef.value.show(row) }
const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await lineGroupApi.res.remove(row.id); ElMessage.success('删除成功'); loadData(1) })
    .catch(() => {})
}
const loadData = async page => {
  if (page === 1) pagination.page = 1
  loading.value = true
  try {
    const res = (await lineGroupApi.list({ page: pagination.page, size: pagination.size })).data || {}
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.app-panel { width: 100%; }
</style>
