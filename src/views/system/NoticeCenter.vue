<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="通知类型">
        <el-radio-group v-model="query.type" @change="handleSearch">
          <el-radio-button :value="''">全部</el-radio-button>
          <el-radio-button v-for="t in NOTICE_TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="搜索标题" clearable style="width: 200px" />
      </el-form-item>
      <template #actions>
        <el-button :icon="Setting" @click="goConfig">通知配置</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <div class="notice-ctr__head">
        <el-tabs v-model="query.read" @tab-change="handleSearch">
          <el-tab-pane :name="''">
            <template #label>全部<el-badge :value="counts.all" :max="99" class="notice-ctr__badge" type="info" /></template>
          </el-tab-pane>
          <el-tab-pane name="未读">
            <template #label>未读<el-badge :value="counts.unread" :max="99" class="notice-ctr__badge" /></template>
          </el-tab-pane>
          <el-tab-pane name="已读">
            <template #label>已读<el-badge :value="counts.read" :max="99" class="notice-ctr__badge" type="info" /></template>
          </el-tab-pane>
        </el-tabs>
        <div class="notice-ctr__actions">
          <el-button size="small" :disabled="!can('read') || !selection.length" @click="markSelected">标记为已读</el-button>
          <el-button size="small" type="primary" :disabled="!can('read')" @click="markAll">全部标为已读</el-button>
        </div>
      </div>

      <ProTable
        ref="tableRef"
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        selectable
        :action-width="120"
        @change="loadData"
        @selection-change="rows => (selection.value = rows)"
      >
        <template #col-title="{ row }">
          <el-icon v-if="row.read === '未读'" class="notice-ctr__dot"><Bell /></el-icon>
          <el-icon v-else class="notice-ctr__dot notice-ctr__dot--read"><BellFilled /></el-icon>
          <span :class="{ 'notice-ctr__unread': row.read === '未读' }">{{ row.title }}</span>
        </template>
        <template #col-read="{ row }">
          <el-tag size="small" :type="row.read === '已读' ? 'info' : 'warning'">{{ row.read }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openDetail(row)">查看</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="detail.visible" :title="detail.row?.title" width="560px">
      <div class="notice-ctr__detail">
        <p class="notice-ctr__meta">
          <el-tag size="small">{{ detail.row?.type }}</el-tag>
          <span>{{ detail.row?.subType }}</span>
          <span>{{ detail.row?.receiveTime }}</span>
        </p>
        <div class="notice-ctr__content">{{ detail.row?.content }}</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detail.visible = false">关闭</el-button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Bell, BellFilled } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { noticeCtrApi, NOTICE_TYPES } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeCtr' })
const { can } = usePagePerms()
const router = useRouter()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(noticeCtrApi.list, { type: '', read: '', keyword: '' })

const columns = [
  { prop: 'title', label: '消息标题', minWidth: 240 },
  { prop: 'type', label: '消息类型', width: 110 },
  { prop: 'subType', label: '消息子类型', width: 120 },
  { prop: 'read', label: '状态', width: 90, align: 'center' },
  { prop: 'receiveTime', label: '接收时间', width: 170 }
]

// 全部/未读/已读 计数（全量统计，不受分页影响）
const counts = computed(() => {
  const all = noticeCtrApi.res.raw()
  return {
    all: all.length,
    unread: all.filter(r => r.read === '未读').length,
    read: all.filter(r => r.read === '已读').length
  }
})

const tableRef = ref(null)
const selection = ref([])

const openDetail = row => {
  detail.row = row
  detail.visible = true
  if (row.read === '未读') markRead([row.id])
}
const detail = reactive({ visible: false, row: null })

const markRead = async ids => {
  for (const id of ids) await noticeCtrApi.update(id, { read: '已读' })
  loadData()
}
const markSelected = async () => {
  const ids = selection.value.filter(r => r.read === '未读').map(r => r.id)
  if (!ids.length) return ElMessage.info('所选消息均已读')
  await markRead(ids)
  tableRef.value?.clearSelection()
  ElMessage.success('已标记为已读')
}
const markAll = async () => {
  const ids = noticeCtrApi.res.raw().filter(r => r.read === '未读').map(r => r.id)
  if (!ids.length) return ElMessage.info('暂无未读消息')
  await markRead(ids)
  ElMessage.success('已全部标为已读')
}

const goConfig = () => router.push('/system/notice-config').catch(() => {})
</script>

<style scoped lang="scss">
.notice-ctr__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  :deep(.el-tabs) { flex: 1; }
  :deep(.el-tabs__header) { margin-bottom: 0; }
}
.notice-ctr__badge { margin-left: 4px; }
.notice-ctr__actions { display: flex; gap: $space-sm; }
.notice-ctr__dot { margin-right: 6px; vertical-align: -2px; color: $primary-color; }
.notice-ctr__dot--read { color: $text-placeholder; }
.notice-ctr__unread { font-weight: 600; }
.notice-ctr__meta {
  display: flex;
  align-items: center;
  gap: $space-md;
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
.notice-ctr__content { line-height: 1.8; color: $text-primary; }
</style>
