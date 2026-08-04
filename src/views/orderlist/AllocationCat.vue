<!-- 本页为卡派调度视图的重设计(任务单资源),非源逐字保真 -->
<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="任务状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="s in SCHEDULE_STATUS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="任务单号" clearable style="width: 180px" />
      </el-form-item>
      <template #actions>
        <el-button type="primary" :disabled="!can('add')" @click="openCreate">新建调度任务单</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="100"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="detailVisible" title="调度任务详情" width="520px">
      <el-descriptions v-if="current" :column="1" border size="small">
        <el-descriptions-item label="任务单号">{{ current.taskNo }}</el-descriptions-item>
        <el-descriptions-item label="车队">{{ current.fleet }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ current.driverName }}</el-descriptions-item>
        <el-descriptions-item label="车牌">{{ current.cardId }}</el-descriptions-item>
        <el-descriptions-item label="任务状态">{{ current.status }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ current.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ current.createTime }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button type="primary" @click="detailVisible = false">关闭</el-button></template>
    </Modal>

    <Modal v-model="createVisible" title="新建调度任务单" width="480px" :confirm-loading="saving" @confirm="submitCreate">
      <el-form label-width="80px">
        <el-form-item label="车队">
          <el-select v-model="form.fleet" placeholder="请选择车队" style="width: 100%">
            <el-option v-for="f in FLEETS" :key="f" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="form.driverName" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="车牌">
          <el-input v-model="form.cardId" placeholder="请输入车牌号" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { getScheduleTasks, addScheduleTask, SCHEDULE_STATUS, FLEETS } from '@/api/modules/orderlist'

defineOptions({ name: 'OlAllocation' })

const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(getScheduleTasks, { keyword: '', status: '' })

const columns = [
  { prop: 'taskNo', label: '任务单号', minWidth: 140 },
  { prop: 'fleet', label: '车队', width: 130 },
  { prop: 'driverName', label: '司机', width: 110 },
  { prop: 'cardId', label: '车牌', width: 120 },
  { prop: 'status', label: '任务状态', width: 110, align: 'center' },
  { prop: 'orderCount', label: '订单数', width: 90, align: 'center' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const statusTag = s => ({ 待调度: 'warning', 调度中: 'primary', 已完成: 'success', 已取消: 'info' }[s] || 'info')

const detailVisible = ref(false)
const current = ref(null)
const openDetail = row => { current.value = row; detailVisible.value = true }

const createVisible = ref(false)
const saving = ref(false)
const form = ref({ fleet: '', driverName: '', cardId: '' })
const openCreate = () => { form.value = { fleet: '', driverName: '', cardId: '' }; createVisible.value = true }
const submitCreate = async () => {
  if (!form.value.fleet || !form.value.driverName) return ElMessage.warning('请填写车队与司机')
  saving.value = true
  try {
    await addScheduleTask({ ...form.value, taskNo: `DD${Date.now().toString().slice(-8)}` })
    ElMessage.success('调度任务单已创建')
    createVisible.value = false
    loadData()
  } finally { saving.value = false }
}
</script>
