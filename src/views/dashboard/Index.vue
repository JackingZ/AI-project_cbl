<template>
  <div v-loading="loading">
    <!-- 统计卡片 -->
    <el-row :gutter="16" class="stat-row">
      <el-col v-for="card in stats.cards" :key="card.key" :span="6">
        <div class="stat-card" :class="`stat-card--${card.color}`">
          <div class="stat-card__label">{{ card.label }}</div>
          <div class="stat-card__value">
            <span v-if="card.key === 'amount'">{{ formatMoney(card.value) }}</span>
            <span v-else>{{ card.value }}<em>{{ card.unit }}</em></span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="10">
        <PageCard title="订单状态分布">
          <div v-for="item in stats.statusCount" :key="item.status" class="status-item">
            <el-tag :type="orderStatusTag(item.status)" effect="light">{{ item.status }}</el-tag>
            <el-progress
              :percentage="percent(item.count)"
              :stroke-width="10"
              :show-text="false"
              class="status-item__bar"
            />
            <span class="status-item__count">{{ item.count }}</span>
          </div>
        </PageCard>
      </el-col>
      <el-col :span="14">
        <PageCard title="近期订单">
          <template #extra>
            <el-button link type="primary" @click="goList">查看全部</el-button>
          </template>
          <ProTable :data="stats.recent" :columns="columns">
            <template #col-status="{ row }">
              <el-tag :type="orderStatusTag(row.status)">{{ row.status }}</el-tag>
            </template>
            <template #actions="{ row }">
              <el-button link type="primary" size="small" @click="goList">查看</el-button>
            </template>
          </ProTable>
        </PageCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { getDashboardStats } from '@/api/modules/dashboard'
import { formatMoney, orderStatusTag } from '@/utils/format'

const router = useRouter()
const loading = ref(false)
const stats = reactive({ cards: [], statusCount: [], recent: [] })

const columns = [
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'country', label: '目的国', width: 100 },
  { prop: 'status', label: '状态', width: 100 }
]

const maxCount = computed(() => Math.max(...stats.statusCount.map(s => s.count), 1))
const percent = count => Math.round((count / maxCount.value) * 100)

// 订单模块（orderlist）尚未迁移，先跳转其列表占位页
const goList = () => router.push('/orderlist/whole-order')

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    Object.assign(stats, res.data)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.stat-row { margin-bottom: $space-md; }
.stat-card {
  padding: $space-lg;
  border-radius: $card-radius;
  background: $bg-card;
  box-shadow: $shadow-sm;
  border-left: 4px solid $primary-color;

  &--primary { border-left-color: $primary-color; }
  &--warning { border-left-color: $warning-color; }
  &--danger { border-left-color: $danger-color; }
  &--success { border-left-color: $success-color; }

  &__label { font-size: $font-base; color: $text-secondary; }
  &__value {
    font-size: $font-title;
    font-weight: 700;
    color: $text-primary;
    margin-top: $space-sm;
    em { font-size: $font-base; font-weight: 400; color: $text-secondary; margin-left: $space-xs; font-style: normal; }
  }
}
.status-item {
  display: flex;
  align-items: center;
  gap: $space-md;
  padding: $space-sm 0;
  .el-tag { width: 72px; text-align: center; }
  &__bar { flex: 1; }
  &__count { width: 32px; text-align: right; color: $text-secondary; }
}
</style>
