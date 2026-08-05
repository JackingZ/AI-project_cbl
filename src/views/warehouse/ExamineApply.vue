<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="原单号"><el-input v-model="query.originalNo" placeholder="请输入原单号" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="验货结果">
        <el-select v-model="query.examineResult" placeholder="全部" clearable style="width: 120px"><el-option v-for="r in EXAMINE_RESULT" :key="r" :label="r" :value="r" /></el-select>
      </el-form-item>
      <el-form-item label="仓库"><el-input v-model="query.warehouseName" placeholder="请输入仓库" clearable style="width: 140px" /></el-form-item>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="110" @change="loadData">
        <template #col-examineResult="{ row }">
          <el-tag :type="row.examineResult === '合格' ? 'success' : 'danger'" size="small">{{ row.examineResult }}</el-tag>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openDetail(row)">查看详情</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="detail.visible" title="验货详情" width="720px">
      <template v-if="detail.row">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="原单号">{{ detail.row.originalNo }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ detail.row.warehouseName }}</el-descriptions-item>
          <el-descriptions-item label="验货方式">{{ detail.row.examineType }}</el-descriptions-item>
          <el-descriptions-item label="验货结果">{{ detail.row.examineResult }}</el-descriptions-item>
          <el-descriptions-item label="验货员">{{ detail.row.executorName }}</el-descriptions-item>
          <el-descriptions-item label="验货时间">{{ detail.row.examineTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="examine-goods">
          <div class="examine-goods__title">商品列表</div>
          <el-table :data="detail.row.goodsItems" border size="small" style="width: 100%">
            <el-table-column prop="skuCode" label="SKU" width="130" />
            <el-table-column prop="cnName" label="名称" min-width="140" />
            <el-table-column prop="packages" label="件数" width="90" align="center" />
            <el-table-column prop="result" label="结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.result === '合格' ? 'success' : 'danger'" size="small">{{ row.result }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="examine-photos">
          <span class="examine-photos__label">验货照片：</span>
          <el-button link type="primary" @click="demoAction('查看验货照片')">查看照片</el-button>
        </div>
      </template>
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
import { examineApi, EXAMINE_RESULT } from '@/api/modules/warehouse'

defineOptions({ name: 'WhExamine' })

const { can } = usePagePerms()

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(examineApi.list, { originalNo: '', examineResult: '', warehouseName: '' })

const columns = [
  { prop: 'originalNo', label: '原单号', width: 130 },
  { prop: 'warehouseName', label: '仓库', width: 110 },
  { prop: 'examineType', label: '验货方式', width: 120 },
  { prop: 'examineResult', label: '验货结果', width: 110, align: 'center' },
  { prop: 'executorName', label: '验货员', minWidth: 140 },
  { prop: 'examineTime', label: '验货时间', width: 170 },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

const detail = reactive({ visible: false, row: null })
const openDetail = row => { detail.row = row; detail.visible = true }
</script>

<style scoped lang="scss">
.examine-goods {
  margin-top: $space-lg;
  &__title { font-size: $font-base; font-weight: 600; margin-bottom: $space-sm; }
}
.examine-photos {
  margin-top: $space-md;
  display: flex;
  align-items: center;
  &__label { color: $text-secondary; font-size: $font-base; }
}
</style>
