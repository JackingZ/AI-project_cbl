<template>
  <div>
    <!-- 内嵌详情（对齐源 detailShow v-show 切换，非路由跳转） -->
    <CollectionDetail v-if="detail.show" :mode="detail.mode" :row-id="detail.id" @back="detail.show = false" @saved="onSaved" />

    <template v-else>
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item label="公司类型">
          <el-select v-model="query.comType" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="c in COMPANY_TYPE_LIST" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属公司">
          <el-select v-model="query.comId" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="c in comOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="s in RECEIVE_STATUS_LIST" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款方式">
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
                <el-option label="原单号" value="1" />
                <el-option label="客户名称" value="2" />
                <el-option label="收款单号" value="3" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <template #actions>
          <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增收款单</el-button>
          <el-button :disabled="!can('export')" @click="handleExport">导出当前数据</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="240" @change="loadData">
          <template #col-checked="{ row }"><el-tag size="small" :type="checkedTag(row.checked)">{{ lookup(RECEIVE_CHECK_LIST, row.checked) }}</el-tag></template>
          <template #col-status="{ row }">{{ lookup(RECEIVE_STATUS_LIST, row.status) }}</template>
          <template #col-clientProperty="{ row }">{{ clientProperty(row.custType, row.custSubtype) }}</template>
          <template #col-settleAccount="{ row }">{{ row.settleAccount || '--' }}</template>
          <template #col-payMethod="{ row }">{{ lookup(SOURCE_LIST, row.payMethod) }}</template>
          <template #col-surplus="{ row }">{{ row.checked === 1 ? row.surplus : '--' }}</template>
          <template #actions="{ row }">
            <el-button v-if="row.status !== 2 && row.checked !== 3 && row.ifChecking !== 1" link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 2 && row.ifChecking !== 1" link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
            <el-button link type="primary" size="small" :disabled="!can('view')" @click="openView(row)">查看详情</el-button>
            <el-button v-if="row.checked !== 1" link type="primary" size="small" :disabled="!can('audit')" @click="openAudit(row)">审核</el-button>
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
          <el-radio-group v-model="audit.bool">
            <el-radio value="1">通过</el-radio>
            <el-radio value="2">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import CollectionDetail from './components/CollectionDetail.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { confirmDelete } from '@/utils/index'
import { receiveApi, RECEIVE_STATUS_LIST, RECEIVE_CHECK_LIST, SOURCE_LIST, COMPANY_TYPE_LIST, lookup, clientProperty } from '@/api/modules/financial'

defineOptions({ name: 'FinCollect' })
const { can } = usePagePerms()
const checkedTag = c => ({ 0: 'info', 1: 'success', 2: 'danger', 3: 'warning' }[c] || 'info')
const comOptions = ref([])
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(receiveApi.list, { comType: '', comId: '', status: '', payMethod: '', time: [], keyWord: '', selectType: '2' })
const columns = [
  { prop: 'id', label: '收款单号', width: 110 },
  { prop: 'checked', label: '审核状态', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'payDate', label: '回款日期', width: 160 },
  { prop: 'auditTime', label: '审核时间', width: 160 },
  { prop: 'custName', label: '客户名称', minWidth: 130 },
  { prop: 'clientProperty', label: '客户类型', width: 100 },
  { prop: 'settleAccount', label: '结算账户', width: 120 },
  { prop: 'payMethod', label: '来源', width: 100 },
  { prop: 'currencyName', label: '货币', width: 90 },
  { prop: 'amount', label: '金额', width: 110 },
  { prop: 'exRate', label: '汇率', width: 90 },
  { prop: 'selfAmount', label: '本币金额', width: 110 },
  { prop: 'surplus', label: '核销本币结余', width: 120 }
]

const detail = reactive({ show: false, mode: 'add', id: null })
const openAdd = () => Object.assign(detail, { show: true, mode: 'add', id: null })
const openEdit = row => Object.assign(detail, { show: true, mode: 'edit', id: row.id })
const openView = row => Object.assign(detail, { show: true, mode: 'view', id: row.id })
const onSaved = () => { detail.show = false; loadData() }
const remove = row => confirmDelete(async () => { await receiveApi.remove(row.id); loadData() })

const audit = reactive({ visible: false, loading: false, id: null, bool: '1' })
const openAudit = row => Object.assign(audit, { visible: true, id: row.id, bool: '1' })
const confirmAudit = async () => {
  audit.loading = true
  try { await receiveApi.audit(audit.id, audit.bool); ElMessage.success('审核成功'); audit.visible = false; loadData() }
  finally { audit.loading = false }
}
const handleExport = () => ElMessage.success('已导出当前数据')
</script>
