<template>
  <div>
    <!-- 内嵌详情（对齐源 detailShow v-show 切换，非路由跳转） -->
    <CashDetail v-if="detail.show" :mode="detail.mode" :row-id="detail.id" @back="detail.show = false" @saved="onSaved" />

    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="公司类型">
          <el-select v-model="query.comType" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="c in COMPANY_TYPE_LIST" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="query.comId" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="c in companyOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in INV_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款类型">
          <el-select v-model="query.payType" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="c in CATEGORY_LIST" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款方式">
          <el-select v-model="query.payMethod" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in SOURCE_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="发票时间">
          <el-date-picker v-model="query.time" type="daterange" range-separator="-" start-placeholder="起期" end-placeholder="止期" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.keyWord" placeholder="请输入" clearable style="width: 260px">
            <template #prepend>
              <el-select v-model="query.selectType" style="width: 110px">
                <el-option label="客户名称" value="2" /><el-option label="请款单号" value="3" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增请款申请单</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="240" @change="loadData">
          <template #col-status="{ row }"><el-tag size="small" :type="statusTag(row.status)">{{ lookup(INV_STATUS_LIST, row.status) }}</el-tag></template>
          <template #col-clientProperty="{ row }">{{ clientProperty(row.custType, row.custSubtype) }}</template>
          <template #col-payType="{ row }">{{ lookup(CATEGORY_LIST, row.payType) }}</template>
          <template #col-payMethod="{ row }">{{ lookup(SOURCE_LIST, row.payMethod) }}</template>
          <template #actions="{ row }">
            <el-button v-if="row.status !== '3'" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== '1'" link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
            <el-button link type="primary" size="small" @click="openView(row)">查看详情</el-button>
            <el-button v-if="row.status !== '1'" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
            <!-- 源页注释按钮，保持注释：通过 / 拒绝 / 重新提交 -->
            <!-- <el-button link type="primary" size="small" @click="pass(row)">通过</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="reject(row)">拒绝</el-button> -->
            <!-- <el-button link type="primary" size="small" @click="resubmit(row)">重新提交</el-button> -->
          </template>
        </ProTable>
      </PageCard>
    </template>

    <!-- 审核 -->
    <Modal v-model="audit.visible" title="发票审核" width="440px" :confirm-loading="audit.loading" @confirm="confirmAudit">
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="audit.status">
            <el-radio value="1">通过</el-radio>
            <el-radio value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import CashDetail from './components/CashDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete } from '@/utils/index'
import { requestApi, INV_STATUS_LIST, CATEGORY_LIST, SOURCE_LIST, COMPANY_TYPE_LIST, lookup, clientProperty } from '@/api/modules/financial'

defineOptions({ name: 'FinCash' })
const { can } = usePagePerms()
const statusTag = s => ({ '0': 'info', '1': 'success', '2': 'danger', '3': 'warning' }[s] || 'info')
const companyOptions = []
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(requestApi.list, { comType: '', comId: '', status: '', payType: '', payMethod: '', time: [], keyWord: '', selectType: '2' })
const columns = [
  { prop: 'id', label: '请款申请单号', width: 130, fixed: 'left' },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'applyTime', label: '付款日期', width: 160 },
  { prop: 'custName', label: '客户名称', minWidth: 130 },
  { prop: 'clientProperty', label: '客户类型', width: 100 },
  { prop: 'payType', label: '付款类型', width: 100 },
  { prop: 'payMethod', label: '付款方式', width: 100 },
  { prop: 'currencyName', label: '货币', width: 110 },
  { prop: 'payAmount', label: '金额', width: 110 },
  { prop: 'exRate', label: '汇率', width: 90 },
  { prop: 'selfAmount', label: '本币金额', width: 120 }
]

const detail = reactive({ show: false, mode: 'add', id: null })
const openAdd = () => Object.assign(detail, { show: true, mode: 'add', id: null })
const openEdit = row => Object.assign(detail, { show: true, mode: 'edit', id: row.id })
const openView = row => Object.assign(detail, { show: true, mode: 'view', id: row.id })
const onSaved = () => { detail.show = false; loadData() }
const remove = row => confirmDelete(async () => { await requestApi.remove(row.id); loadData() })

const audit = reactive({ visible: false, loading: false, id: null, status: '1' })
const openAudit = async row => {
  // 两步：未审核(0) 先置为审核中(3) 再打开弹窗
  if (row.status === '0') { await requestApi.audit(row.id, '3'); loadData() }
  Object.assign(audit, { visible: true, id: row.id, status: '1' })
}
const confirmAudit = async () => {
  audit.loading = true
  try { await requestApi.audit(audit.id, audit.status); ElMessage.success('审核成功'); audit.visible = false; loadData() }
  finally { audit.loading = false }
}
</script>
