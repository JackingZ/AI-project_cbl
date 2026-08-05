<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <div>
          <el-button type="primary" :icon="Plus" :disabled="!can('allot')" @click="openAllot">分配</el-button>
          <el-button :icon="Upload" :disabled="!can('import')" @click="demoAction('导入号段')">导入</el-button>
        </div>
        <div class="op-filters">
          <el-select v-model="query.airlineCompany" placeholder="航空公司" clearable filterable style="width: 180px">
            <el-option v-for="a in airlineOptions" :key="a" :label="a" :value="a" />
          </el-select>
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
        :action-width="160"
        @change="loadData"
      >
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openLog(row)">操作日志</el-button>
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 分配号段（给航司增加号段数量，落库 total/surplus） -->
    <Modal v-model="allotDlg.visible" title="分配号段" width="560px" :confirm-loading="allotDlg.loading" @confirm="submitAllot">
      <el-form ref="allotRef" :model="allotForm" :rules="allotRules" label-width="110px">
        <el-form-item label="航空公司" prop="id">
          <el-select v-model="allotForm.id" placeholder="请选择" filterable style="width: 100%">
            <el-option v-for="r in rawList" :key="r.id" :label="r.airlineCompany" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配数量" prop="count">
          <el-input-number v-model="allotForm.count" :controls="false" :min="1" :max="99999" style="width: 100%" placeholder="请输入分配数量" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 查看明细（号段库存统计只读） -->
    <el-dialog v-model="viewDlg.visible" title="号段明细" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="航空公司">{{ viewDlg.row.airlineCompany }}</el-descriptions-item>
        <el-descriptions-item label="总数量">{{ viewDlg.row.total }}</el-descriptions-item>
        <el-descriptions-item label="剩余数量">{{ viewDlg.row.surplus }}</el-descriptions-item>
        <el-descriptions-item label="已分配">{{ viewDlg.row.allocated }}</el-descriptions-item>
        <el-descriptions-item label="已打单">{{ viewDlg.row.printedOrder }}</el-descriptions-item>
        <el-descriptions-item label="已发运">{{ viewDlg.row.shipped }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 操作日志（展示该航司号段操作记录） -->
    <el-dialog v-model="logDlg.visible" :title="`操作日志 - ${logDlg.airline}`" width="680px">
      <el-table :data="logDlg.rows" border size="small">
        <el-table-column prop="time" label="操作时间" width="170" />
        <el-table-column prop="action" label="操作类型" width="110" />
        <el-table-column prop="count" label="数量" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" min-width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { demoAction } from '@/utils'
import { airApi } from '@/api/modules/system'

defineOptions({ name: 'SysAir' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(airApi.list, { airlineCompany: '' })

const rawList = computed(() => airApi.res.raw())
const airlineOptions = computed(() => rawList.value.map(r => r.airlineCompany))

const columns = [
  { prop: 'airlineCompany', label: '航空公司', minWidth: 180 },
  { prop: 'total', label: '总数量', width: 110, align: 'center' },
  { prop: 'surplus', label: '剩余数量', width: 110, align: 'center' },
  { prop: 'allocated', label: '已分配', width: 110, align: 'center' },
  { prop: 'printedOrder', label: '已打单', width: 110, align: 'center' },
  { prop: 'shipped', label: '已发运', width: 110, align: 'center' }
]

// 分配号段：给航司增加总量与剩余
const allotRef = ref(null)
const allotDlg = reactive({ visible: false, loading: false })
const allotForm = reactive({ id: '', count: undefined })
const allotRules = { id: [required('请选择航空公司', 'change')], count: [required('请输入分配数量')] }
const openAllot = () => {
  Object.assign(allotForm, { id: '', count: undefined })
  allotDlg.visible = true
  allotRef.value?.clearValidate()
}
const submitAllot = async () => {
  await allotRef.value.validate()
  allotDlg.loading = true
  try {
    const row = rawList.value.find(r => r.id === allotForm.id)
    await airApi.update(allotForm.id, { total: row.total + allotForm.count, surplus: row.surplus + allotForm.count })
    ElMessage.success('号段已分配')
    allotDlg.visible = false
    loadData()
  } finally {
    allotDlg.loading = false
  }
}

// 查看明细
const viewDlg = reactive({ visible: false, row: {} })
const openView = row => { viewDlg.row = row; viewDlg.visible = true }

// 操作日志（该航司号段操作记录，派生占位）
const logDlg = reactive({ visible: false, airline: '', rows: [] })
const openLog = row => {
  logDlg.airline = row.airlineCompany
  logDlg.rows = [
    { time: row.createTime, action: '导入', count: row.total, operator: '系统管理员' },
    { time: row.createTime, action: '分配', count: row.allocated, operator: '操作员01' },
    { time: row.createTime, action: '打单', count: row.printedOrder, operator: '操作员02' }
  ]
  logDlg.visible = true
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
</style>
