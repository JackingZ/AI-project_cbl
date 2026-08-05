<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="原单号"><el-input v-model="query.originalNo" placeholder="请输入原单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option label="待换单" value="待换单" /><el-option label="已换单" value="已换单" /></el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="180" @change="loadData">
        <template #col-status="{ row }">
          <el-tag :type="row.status === '待换单' ? 'warning' : 'success'" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.status === '待换单'" link type="warning" size="small" :disabled="!can('transfer')" @click="handleTransfer(row)">换单</el-button>
          <el-button link type="primary" size="small" @click="demoAction('下载文件')">下载文件</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="detail.visible" title="换单详情" width="600px">
      <el-descriptions v-if="detail.row" :column="2" border size="small">
        <el-descriptions-item label="原单号">{{ detail.row.originalNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.row.status }}</el-descriptions-item>
        <el-descriptions-item label="原快递单号">{{ detail.row.oldTrackingNo }}</el-descriptions-item>
        <el-descriptions-item label="新快递单号">{{ detail.row.newTrackingNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.row.operator }}</el-descriptions-item>
        <el-descriptions-item label="换单时间">{{ detail.row.transferTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button type="primary" @click="detail.visible = false">关闭</el-button></template>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { transferApi } from '@/api/modules/warehouse'

defineOptions({ name: 'WhTransfer' })

const { can } = usePagePerms()

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(transferApi.list, { originalNo: '', status: '', warehouseName: '' })

const columns = [
  { prop: 'originalNo', label: '原单号', width: 120 },
  { prop: 'oldTrackingNo', label: '原快递单号', width: 150 },
  { prop: 'newTrackingNo', label: '新快递单号', width: 150 },
  { prop: 'warehouseName', label: '仓库', minWidth: 120 },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'operator', label: '操作人', width: 110 },
  { prop: 'transferTime', label: '换单时间', width: 170 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const detail = reactive({ visible: false, row: null })
const openDetail = row => { detail.row = row; detail.visible = true }

const handleTransfer = () => demoAction('扫码换单')
</script>
