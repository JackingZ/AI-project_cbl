<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="计量单号"><el-input v-model="query.measureNo" placeholder="请输入计量单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="原单号"><el-input v-model="query.originalNo" placeholder="请输入原单号" clearable style="width: 160px" /></el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, val) in MEASURE_STATUS" :key="val" :label="label" :value="Number(val)" />
        </el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
      <template #actions>
        <el-button :disabled="!can('export')" @click="demoAction('导出计量单')">导出</el-button>
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
        :action-width="280"
        @change="loadData"
      >
        <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ MEASURE_STATUS[row.status] }}</el-tag></template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.status < 2" link type="primary" size="small" :disabled="!can('measure')" @click="openWeigh(row)">称重录入</el-button>
          <el-button v-if="row.status < 2" link type="primary" size="small" :disabled="!can('measure')" @click="completeMeasure(row)">完成计量</el-button>
          <el-button v-if="row.status === 2" link type="primary" size="small" :disabled="!can('audit')" @click="openReview(row)">复核</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情弹窗（头部字段 + 计量明细子表） -->
    <el-dialog v-model="detail.visible" title="计量单详情" width="860px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="计量单号">{{ detail.row.measureNo }}</el-descriptions-item>
        <el-descriptions-item label="原单号">{{ detail.row.originalNo }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ MEASURE_STATUS[detail.row.status] }}</el-descriptions-item>
        <el-descriptions-item label="总件数">{{ detail.row.totalNumber }}</el-descriptions-item>
        <el-descriptions-item label="总重量">{{ detail.row.totalWeight }} KGS</el-descriptions-item>
        <el-descriptions-item label="总体积">{{ detail.row.totalVolume }} CBM</el-descriptions-item>
        <el-descriptions-item label="计量员">{{ detail.row.executorName }}</el-descriptions-item>
        <el-descriptions-item label="复核员">{{ detail.row.reviewerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.row.createTime }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">计量明细</el-divider>
      <el-table :data="detail.row.items || []" border size="small">
        <el-table-column label="箱号" prop="boxNo" min-width="120" />
        <el-table-column label="长(cm)" prop="length" width="90" align="center" />
        <el-table-column label="宽(cm)" prop="width" width="90" align="center" />
        <el-table-column label="高(cm)" prop="height" width="90" align="center" />
        <el-table-column label="重量(kg)" prop="weight" width="100" align="center" />
        <el-table-column label="体积(m³)" prop="volume" width="100" align="center" />
      </el-table>
    </el-dialog>

    <!-- 复核弹窗 -->
    <!-- 逐箱称重录入（录长宽高重量→自动算体积，保存汇总总重/总体积/总件数并置计量完成） -->
    <el-dialog v-model="weigh.visible" title="逐箱称重录入" width="860px">
      <div style="margin-bottom: 8px">
        <el-button type="primary" link :icon="Plus" @click="addBox">新增箱</el-button>
      </div>
      <el-table :data="weigh.rows" border size="small" style="width: 100%">
        <el-table-column label="箱号" min-width="120">
          <template #default="{ row }"><el-input v-model="row.boxNo" size="small" placeholder="箱号" /></template>
        </el-table-column>
        <el-table-column label="长(cm)" width="110" align="center">
          <template #default="{ row }"><el-input-number v-model="row.length" :controls="false" :min="0" size="small" style="width: 90px" @change="calcVol(row)" /></template>
        </el-table-column>
        <el-table-column label="宽(cm)" width="110" align="center">
          <template #default="{ row }"><el-input-number v-model="row.width" :controls="false" :min="0" size="small" style="width: 90px" @change="calcVol(row)" /></template>
        </el-table-column>
        <el-table-column label="高(cm)" width="110" align="center">
          <template #default="{ row }"><el-input-number v-model="row.height" :controls="false" :min="0" size="small" style="width: 90px" @change="calcVol(row)" /></template>
        </el-table-column>
        <el-table-column label="重量(kg)" width="110" align="center">
          <template #default="{ row }"><el-input-number v-model="row.weight" :controls="false" :min="0" :precision="2" size="small" style="width: 90px" /></template>
        </el-table-column>
        <el-table-column label="体积(m³)" prop="volume" width="100" align="center" />
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ $index }"><el-button link type="danger" size="small" @click="weigh.rows.splice($index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="weigh.visible = false">取 消</el-button>
        <el-button type="primary" :loading="weigh.loading" @click="submitWeigh">保存并完成计量</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="review.visible" title="计量复核" width="440px">
      <p style="margin: 0 0 12px">确认对计量单 {{ review.measureNo }} 完成复核？复核通过后单据将标记为已完成。</p>
      <template #footer>
        <el-button @click="review.visible = false">取 消</el-button>
        <el-button type="primary" :loading="review.loading" @click="submitReview">复核通过</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { demoAction } from '@/utils'
import { measureApi, MEASURE_STATUS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhMeasure' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(measureApi.list, { measureNo: '', originalNo: '', status: '', warehouseName: '' })

const columns = [
  { prop: 'measureNo', label: '计量单号', width: 130, fixed: 'left' },
  { prop: 'originalNo', label: '原单号', width: 130 },
  { prop: 'warehouseName', label: '仓库', minWidth: 120 },
  { prop: 'status', label: '审核状态', width: 100, align: 'center' },
  { prop: 'totalNumber', label: '总件数', width: 90, align: 'center' },
  { prop: 'totalWeight', label: '总重量', width: 90, align: 'center' },
  { prop: 'totalVolume', label: '总体积', width: 90, align: 'center' },
  { prop: 'executorName', label: '计量员', width: 100 },
  { prop: 'createTime', label: '创建时间', width: 160 }
]
const statusTag = s => ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'warning', 4: 'primary' }[s] || 'info')

const detail = reactive({ visible: false, row: {} })
const openDetail = row => { detail.row = row; detail.visible = true }

// 逐箱称重录入：录长宽高重量→算体积,保存汇总总重/总体积/总件数并置已计量(status=2)
const weigh = reactive({ visible: false, loading: false, id: null, rows: [] })
const calcVol = row => {
  const v = (Number(row.length) || 0) * (Number(row.width) || 0) * (Number(row.height) || 0) / 1e6
  row.volume = Number(v.toFixed(3))
}
const addBox = () => weigh.rows.push({ boxNo: `BX${weigh.rows.length + 1}`, length: 0, width: 0, height: 0, weight: 0, volume: 0 })
const openWeigh = row => {
  weigh.id = row.id
  weigh.rows = (row.items || []).map(it => ({ ...it }))
  if (!weigh.rows.length) addBox()
  weigh.visible = true
}
const submitWeigh = async () => {
  weigh.loading = true
  try {
    const rows = weigh.rows.map(it => ({ ...it, weight: Number(it.weight) || 0, volume: Number(it.volume) || 0 }))
    const totalWeight = Number(rows.reduce((a, it) => a + it.weight, 0).toFixed(2))
    const totalVolume = Number(rows.reduce((a, it) => a + it.volume, 0).toFixed(3))
    await measureApi.update(weigh.id, { items: rows, totalNumber: rows.length, totalWeight, totalVolume, status: 2 })
    ElMessage.success('称重录入已保存，计量完成')
    weigh.visible = false
    loadData()
  } finally {
    weigh.loading = false
  }
}

const completeMeasure = async row => {
  await measureApi.update(row.id, { status: 2 })
  ElMessage.success('已完成计量')
  loadData()
}

const review = reactive({ visible: false, loading: false, id: null, measureNo: '' })
const openReview = row => { Object.assign(review, { visible: true, id: row.id, measureNo: row.measureNo }) }
const submitReview = async () => {
  review.loading = true
  try {
    await measureApi.update(review.id, { status: 4 })
    ElMessage.success('复核通过')
    review.visible = false
    loadData()
  } finally {
    review.loading = false
  }
}
</script>
