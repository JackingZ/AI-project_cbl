<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="来源">
        <el-select v-model="query.source" placeholder="全部" clearable style="width: 130px"><el-option v-for="s in FEEDBACK_SOURCES" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <el-form-item label="处理状态">
        <el-select v-model="query.handle" placeholder="全部" clearable style="width: 130px"><el-option v-for="h in FEEDBACK_HANDLE_STATUS" :key="h" :label="h" :value="h" /></el-select>
      </el-form-item>
      <el-form-item label="提交时间">
        <el-date-picker v-model="query.dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="起始" end-placeholder="截止" style="width: 240px" />
      </el-form-item>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="200" @change="loadData">
        <template #col-handle="{ row }">
          <el-tag size="small" :type="handleTag(row.handle)">{{ row.handle }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
          <el-button v-if="row.handle === '待处理'" link type="warning" size="small" :disabled="!can('handle')" @click="handleFeedback(row, '已忽略')">忽略</el-button>
          <el-button v-if="row.handle === '待处理'" link type="success" size="small" :disabled="!can('handle')" @click="handleFeedback(row, '已处理')">已处理</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 详情（只读 + 处理动作） -->
    <el-dialog v-model="detail.visible" title="反馈详情" width="640px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="来源">{{ detail.row.source }}</el-descriptions-item>
        <el-descriptions-item label="所属公司">{{ detail.row.companyName }}</el-descriptions-item>
        <el-descriptions-item label="反馈类型">{{ detail.row.type }}</el-descriptions-item>
        <el-descriptions-item label="反馈内容">{{ detail.row.content }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag size="small" :type="handleTag(detail.row.handle)">{{ detail.row.handle }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detail.row.createTime }}</el-descriptions-item>
        <el-descriptions-item label="页面截图">
          <img v-if="detail.row.screenshot" :src="detail.row.screenshot" class="shot-thumb" alt="页面截图" @click="preview.visible = true" />
          <span v-else class="shot-empty">无截图</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
        <template v-if="detail.row.handle === '待处理'">
          <el-button type="warning" :disabled="!can('handle')" @click="handleFeedback(detail.row, '已忽略', true)">忽略</el-button>
          <el-button type="primary" :disabled="!can('handle')" @click="handleFeedback(detail.row, '已处理', true)">已处理</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 截图大图预览 -->
    <el-dialog v-model="preview.visible" width="720px" append-to-body title="页面截图">
      <img :src="detail.row.screenshot" style="width: 100%" alt="页面截图" />
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete, confirmThen } from '@/utils'
import { feedbackApi, FEEDBACK_SOURCES, FEEDBACK_HANDLE_STATUS } from '@/api/modules/system'

defineOptions({ name: 'SysFeedback' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(feedbackApi.list, { source: '', handle: '', dateRange: [] })

const columns = [
  { prop: 'source', label: '来源', width: 100 },
  { prop: 'companyName', label: '所属公司', minWidth: 140 },
  { prop: 'type', label: '反馈类型', width: 100 },
  { prop: 'content', label: '反馈内容', minWidth: 220 },
  { prop: 'handle', label: '处理状态', width: 110, align: 'center' },
  { prop: 'createTime', label: '提交时间', width: 170 }
]
const handleTag = h => ({ 待处理: 'warning', 已处理: 'success', 已忽略: 'info' }[h] || 'info')

const detail = reactive({ visible: false, row: {} })
const preview = reactive({ visible: false })
const openDetail = row => { detail.row = row; detail.visible = true }

const handleFeedback = (row, target, fromDetail = false) =>
  confirmThen(`确定将该反馈标记为「${target}」吗？`, async () => {
    await feedbackApi.update(row.id, { handle: target })
    row.handle = target
    if (fromDetail) detail.visible = false
    loadData()
  }, { title: '温馨提示', success: '操作成功' })

const remove = row =>
  confirmDelete(async () => { await feedbackApi.remove(row.id); loadData() }, '确定删除该条反馈吗？')
</script>

<style scoped lang="scss">
.shot-thumb { width: 80px; height: 60px; object-fit: cover; border: 1px solid $border-color; border-radius: $radius-base; cursor: pointer; }
.shot-empty { color: $text-placeholder; }
</style>
