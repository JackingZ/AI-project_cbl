<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="demoAction('新增发货计划')">新增计划</el-button>
        <div class="op-filters">
          <el-select v-model="query.status" placeholder="计划状态" clearable style="width: 130px">
            <el-option v-for="(s, i) in DELIVERY_PLAN_STATUS" :key="i" :label="s" :value="i" />
          </el-select>
          <el-input v-model="query.bscName" placeholder="订舱服务" clearable style="width: 180px" />
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="200"
        @change="loadData"
      >
        <template #col-dispatch="{ row }">{{ DISPATCH_WAYS[row.dispatch] }}</template>
        <template #col-loaded="{ row }">{{ row.loaded }} / {{ row.quantity }}</template>
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ DELIVERY_PLAN_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="demoAction('编辑发货计划')">编辑</el-button>
          <el-button v-if="row.ifBooking !== 1" link type="primary" size="small" @click="demoAction('生成订舱')">生成订舱</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（只读展示计划信息） -->
    <el-dialog v-model="detail.visible" title="发货计划详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订舱服务">{{ detail.row.bscName }}</el-descriptions-item>
        <el-descriptions-item label="派件方式">{{ DISPATCH_WAYS[detail.row.dispatch] }}</el-descriptions-item>
        <el-descriptions-item label="装载容器">{{ detail.row.containerName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detail.row.quantity }}</el-descriptions-item>
        <el-descriptions-item label="最大限重">{{ detail.row.loadLimit }} KG</el-descriptions-item>
        <el-descriptions-item label="已装载">{{ detail.row.loaded }} / {{ detail.row.quantity }}</el-descriptions-item>
        <el-descriptions-item label="起运日期">{{ detail.row.shipDate }}</el-descriptions-item>
        <el-descriptions-item label="截单日期">{{ detail.row.cutoffDate }}</el-descriptions-item>
        <el-descriptions-item label="运输天数">{{ detail.row.transTime }} 天</el-descriptions-item>
        <el-descriptions-item label="状态">{{ DELIVERY_PLAN_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="发起人">{{ detail.row.createUser }}</el-descriptions-item>
        <el-descriptions-item label="发起部门">{{ detail.row.createDept }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { deliveryApi, DELIVERY_PLAN_STATUS, DISPATCH_WAYS } from '@/api/modules/system'

defineOptions({ name: 'SysDelivery' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(deliveryApi.list, { status: '', bscName: '' })

const columns = [
  { prop: 'bscName', label: '订舱服务', minWidth: 150 },
  { prop: 'dispatch', label: '派件方式', width: 110 },
  { prop: 'containerName', label: '装载容器', width: 120 },
  { prop: 'quantity', label: '数量', width: 80, align: 'center' },
  { prop: 'loadLimit', label: '最大限重', width: 110 },
  { prop: 'loaded', label: '已装载', width: 100, align: 'center' },
  { prop: 'shipDate', label: '起运日期', width: 130 },
  { prop: 'cutoffDate', label: '截单日期', width: 130 },
  { prop: 'transTime', label: '运输天数', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'createUser', label: '发起人', width: 110 }
]
const statusTag = s => ['primary', 'success', 'info', 'danger', 'warning'][s] || 'info'

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }
</script>

<style scoped lang="scss">
.op-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: $space-md; margin-bottom: $space-md; }
.op-filters { display: flex; gap: $space-sm; }
</style>
