<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="目的国">
        <el-select v-model="query.countryName" placeholder="全部" clearable filterable style="width: 130px">
          <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="query.state" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(s, i) in PRODUCT_STATE" :key="i" :label="s" :value="i" />
        </el-select>
      </el-form-item>
      <el-form-item label="价格定义">
        <el-select v-model="query.ifPrice" placeholder="全部" clearable style="width: 120px">
          <el-option label="未配置" :value="0" />
          <el-option label="已配置" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 300px">
          <template #prepend>
            <el-select v-model="query.selectType" style="width: 120px">
              <el-option label="海关编码" value="1" />
              <el-option label="中文名称" value="2" />
              <el-option label="英文名称" value="3" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="320" @change="loadData">
        <template #col-state="{ row }">
          <el-tag :type="STATE_TAG[row.state]" size="small">{{ PRODUCT_STATE[row.state] }}</el-tag>
        </template>
        <template #col-goodsName="{ row }">
          <div class="item-word">{{ row.cnName || '--' }}</div>
          <div class="item-word">{{ row.enName || '--' }}</div>
        </template>
        <template #col-material="{ row }">
          <div class="item-word">{{ row.cnMaterial || '--' }}</div>
          <div class="item-word">{{ row.enMaterial || '--' }}</div>
        </template>
        <template #col-purpose="{ row }">
          <div class="item-word">{{ row.cnPurpose || '--' }}</div>
          <div class="item-word">{{ row.enPurpose || '--' }}</div>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('price')" @click="goPrice(row)">
            <span class="price-dot" :class="row.ifPrice === 1 ? 'price-dot--on' : 'price-dot--off'"></span>定义价格
          </el-button>
          <el-button v-if="row.state !== 1" link type="primary" size="small" :disabled="!can('audit')" @click="goAudit(row)">审核</el-button>
          <el-button v-else link type="primary" size="small" @click="goView(row)">查看</el-button>
          <el-button link type="primary" size="small" @click="goFiles(row)">认证文件</el-button>
          <el-button link type="primary" size="small" @click="goCustomers(row)">查看客户</el-button>
        </template>
      </ProTable>
    </PageCard>
  </div>
</template>

<script setup>
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { commodityApi, PRODUCT_STATE } from '@/api/modules/system'
import { COUNTRIES } from '@/api/modules/orderlist'
import { demoAction } from '@/utils/index'

defineOptions({ name: 'SysCommodity' })
const STATE_TAG = ['info', 'success', 'danger']
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(commodityApi.list, { countryName: '', state: '', ifPrice: '', keyword: '', selectType: '1' })
const { can } = usePagePerms()
const columns = [
  { prop: 'startCountryName', label: '起运国', width: 90 },
  { prop: 'countryName', label: '目的国', width: 90 },
  { prop: 'state', label: '审核状态', width: 100, align: 'center' },
  { prop: 'code', label: '海关编码', width: 110 },
  { prop: 'goodsName', label: '商品名称(中文/英文)', minWidth: 180 },
  { prop: 'brand', label: '品牌', width: 100 },
  { prop: 'size', label: '规格', width: 90 },
  { prop: 'material', label: '材质(中文/英文)', minWidth: 150 },
  { prop: 'purpose', label: '用途(中文/英文)', minWidth: 150 },
  { prop: 'unitName', label: '计量单位', width: 90, align: 'center' },
  { prop: 'title', label: '商品类别', width: 100 },
  { prop: 'createTime', label: '添加时间', width: 160 }
]

// 深业务弹窗（定价/审核/认证文件/查看客户）走占位
const goPrice = () => demoAction('定义价格')
const goAudit = () => demoAction('商品审核')
const goView = () => demoAction('查看商品')
const goFiles = () => demoAction('认证文件')
const goCustomers = () => demoAction('查看客户')
</script>

<style scoped lang="scss">
.item-word { line-height: 1.4; }
.price-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; vertical-align: middle;
  &--on { background: var(--el-color-success); }
  &--off { background: var(--el-color-danger); }
}
</style>
