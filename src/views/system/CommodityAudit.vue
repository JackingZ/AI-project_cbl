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

    <!-- 审核弹窗（通过/拒绝，落库 state） -->
    <Modal v-model="auditDlg.visible" title="商品审核" width="600px" :confirm-loading="auditDlg.loading" @confirm="submitAudit">
      <el-form ref="auditRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="商品名称">{{ auditDlg.row.cnName }} / {{ auditDlg.row.enName }}</el-form-item>
        <el-form-item label="审核结果" prop="state">
          <el-radio-group v-model="auditForm.state">
            <el-radio :value="1">通过</el-radio>
            <el-radio :value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.state === 2" label="拒绝原因" prop="remark">
          <el-input v-model="auditForm.remark" type="textarea" :rows="3" :maxlength="100" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 定义价格弹窗（落库 ifPrice + price） -->
    <Modal v-model="priceDlg.visible" title="定义价格" width="600px" :confirm-loading="priceDlg.loading" @confirm="submitPrice">
      <el-form ref="priceRef" :model="priceForm" :rules="priceRules" label-width="100px">
        <el-form-item label="商品名称">{{ priceDlg.row.cnName }}</el-form-item>
        <el-form-item label="销售价格" prop="price">
          <el-input-number v-model="priceForm.price" :controls="false" :min="0" :max="9999999" :precision="2" style="width: 100%" placeholder="请输入价格" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 查看详情 -->
    <el-dialog v-model="viewDlg.visible" title="商品详情" width="720px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="起运国">{{ viewDlg.row.startCountryName }}</el-descriptions-item>
        <el-descriptions-item label="目的国">{{ viewDlg.row.countryName }}</el-descriptions-item>
        <el-descriptions-item label="海关编码">{{ viewDlg.row.code }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ PRODUCT_STATE[viewDlg.row.state] }}</el-descriptions-item>
        <el-descriptions-item label="中文名称">{{ viewDlg.row.cnName }}</el-descriptions-item>
        <el-descriptions-item label="英文名称">{{ viewDlg.row.enName }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ viewDlg.row.brand }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewDlg.row.size }}</el-descriptions-item>
        <el-descriptions-item label="中文材质">{{ viewDlg.row.cnMaterial }}</el-descriptions-item>
        <el-descriptions-item label="英文材质">{{ viewDlg.row.enMaterial }}</el-descriptions-item>
        <el-descriptions-item label="中文用途">{{ viewDlg.row.cnPurpose }}</el-descriptions-item>
        <el-descriptions-item label="英文用途">{{ viewDlg.row.enPurpose }}</el-descriptions-item>
        <el-descriptions-item label="计量单位">{{ viewDlg.row.unitName }}</el-descriptions-item>
        <el-descriptions-item label="商品类别">{{ viewDlg.row.title }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 认证文件（展示商品认证文件列表） -->
    <el-dialog v-model="filesDlg.visible" title="认证文件" width="640px">
      <el-table :data="filesDlg.rows" border size="small">
        <el-table-column prop="name" label="文件名称" min-width="180" />
        <el-table-column prop="type" label="文件类型" width="120" />
        <el-table-column prop="uploadTime" label="上传时间" width="160" />
        <el-table-column label="操作" width="90" align="center">
          <template #default><el-button link type="primary" size="small" @click="demoAction('下载文件')">下载</el-button></template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 查看客户（展示关联客户列表） -->
    <el-dialog v-model="custDlg.visible" title="查看客户" width="560px">
      <el-table :data="custDlg.rows" border size="small">
        <el-table-column prop="customerName" label="客户名称" min-width="160" />
        <el-table-column prop="auditState" label="审核状态" width="120" align="center" />
        <el-table-column prop="bindTime" label="关联时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
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

// 审核（通过/拒绝，落库 state）
const auditRef = ref(null)
const auditDlg = reactive({ visible: false, loading: false, row: {} })
const auditForm = reactive({ state: 1, remark: '' })
const auditRules = { state: [{ required: true, message: '请选择审核结果', trigger: 'change' }] }
const goAudit = row => {
  auditDlg.row = row
  Object.assign(auditForm, { state: 1, remark: '' })
  auditDlg.visible = true
  auditRef.value?.clearValidate()
}
const submitAudit = async () => {
  await auditRef.value.validate()
  auditDlg.loading = true
  try {
    await commodityApi.update(auditDlg.row.id, { state: auditForm.state, auditRemark: auditForm.remark })
    ElMessage.success('审核完成')
    auditDlg.visible = false
    loadData()
  } finally {
    auditDlg.loading = false
  }
}

// 定义价格（落库 ifPrice + price）
const priceRef = ref(null)
const priceDlg = reactive({ visible: false, loading: false, row: {} })
const priceForm = reactive({ price: undefined })
const priceRules = { price: [required('请输入价格')] }
const goPrice = row => {
  priceDlg.row = row
  priceForm.price = row.price
  priceDlg.visible = true
  priceRef.value?.clearValidate()
}
const submitPrice = async () => {
  await priceRef.value.validate()
  priceDlg.loading = true
  try {
    await commodityApi.update(priceDlg.row.id, { ifPrice: 1, price: priceForm.price })
    ElMessage.success('价格已定义')
    priceDlg.visible = false
    loadData()
  } finally {
    priceDlg.loading = false
  }
}

// 查看详情
const viewDlg = reactive({ visible: false, row: {} })
const goView = row => { viewDlg.row = row; viewDlg.visible = true }

// 认证文件（展示该商品认证文件列表，派生占位数据）
const filesDlg = reactive({ visible: false, rows: [] })
const goFiles = row => {
  filesDlg.rows = [
    { name: `${row.cnName}-CE认证.pdf`, type: 'CE认证', uploadTime: row.createTime },
    { name: `${row.cnName}-质检报告.pdf`, type: '质检报告', uploadTime: row.createTime }
  ]
  filesDlg.visible = true
}
// 查看客户（展示关联客户列表，派生占位数据）
const custDlg = reactive({ visible: false, rows: [] })
const goCustomers = row => {
  custDlg.rows = [
    { customerName: `${row.countryName}贸易客户A`, auditState: PRODUCT_STATE[row.state], bindTime: row.createTime },
    { customerName: `${row.countryName}电商客户B`, auditState: PRODUCT_STATE[row.state], bindTime: row.createTime }
  ]
  custDlg.visible = true
}
</script>

<style scoped lang="scss">
.item-word { line-height: 1.4; }
.price-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 4px; vertical-align: middle;
  &--on { background: var(--el-color-success); }
  &--off { background: var(--el-color-danger); }
}
</style>
