<template>
  <div>
    <PageCard title="通知管理">
      <p class="notice-mng__tip">配置各通知项对四类客户（聚货通 / 供应商 / 代理商 / 客户）的启用与关联服务，并维护通知模版。</p>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="120"
        @change="loadData"
      >
        <template #col-cust="{ row }">
          <div class="notice-mng__cust">
            <div v-for="c in NOTICE_CUST_TYPES" :key="c.key" class="notice-mng__cust-item">
              <el-checkbox
                :model-value="row[c.key]"
                :label="c.label"
                :disabled="!can('enable')"
                @change="v => toggleCust(row, c.key, v)"
              />
              <el-button link type="primary" size="small" :disabled="!can('editService')" @click="openService(row, c)">
                服务({{ (row[c.key + 'Services'] || []).length }})
              </el-button>
            </div>
          </div>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('editTemplate')" @click="openTemplate(row)">通知模版</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 通知模版弹窗 -->
    <Modal v-model="tplDlg.visible" title="通知模版" :confirm-loading="tplDlg.loading" @confirm="saveTemplate">
      <el-form ref="tplRef" :model="tplForm" :rules="tplRules" label-width="90px">
        <el-form-item label="模板标题" prop="templateTitle">
          <el-input v-model="tplForm.templateTitle" maxlength="20" show-word-limit placeholder="请输入模板标题" />
        </el-form-item>
        <el-form-item label="模板内容" prop="templateContent">
          <el-input v-model="tplForm.templateContent" type="textarea" :rows="5" placeholder="支持占位符，如 {客户名称}" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 关联服务穿梭框弹窗 -->
    <Modal v-model="svcDlg.visible" :title="`关联服务 - ${svcDlg.custLabel}`" width="640px" :confirm-loading="svcDlg.loading" @confirm="saveService">
      <p class="notice-mng__tip">为「{{ svcDlg.row?.msgSubType }}」的{{ svcDlg.custLabel }}关联需要触发该通知的服务。</p>
      <el-transfer
        v-model="svcKeys"
        :data="serviceData"
        :titles="['服务', '已选择']"
        filterable
        filter-placeholder="搜索服务"
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { noticeMngApi, NOTICE_CUST_TYPES, NOTICE_SERVICES } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeMng' })
const { can } = usePagePerms()
// 源为全量表格（无筛选、无分页）
const { query, list, total, loading, loadData } = useListQuery(noticeMngApi.list, {})

const columns = [
  { prop: 'msgType', label: '通知类型', width: 120 },
  { prop: 'msgSubType', label: '通知项', minWidth: 160 },
  { prop: 'cust', label: '关联服务（四类客户）', minWidth: 460 }
]

// 四类客户启用勾选
const toggleCust = async (row, key, val) => {
  await noticeMngApi.update(row.id, { [key]: val })
  row[key] = val
  ElMessage.success(val ? '已启用' : '已停用')
}

// 通知模版弹窗
const tplRef = ref(null)
const tplDlg = reactive({ visible: false, loading: false, id: null })
const tplForm = reactive({ templateTitle: '', templateContent: '' })
const tplRules = { templateTitle: [required('请输入模板标题')], templateContent: [required('请输入模板内容')] }
const openTemplate = row => {
  tplDlg.id = row.id
  tplForm.templateTitle = row.templateTitle
  tplForm.templateContent = row.templateContent
  tplDlg.visible = true
  tplRef.value?.clearValidate()
}
const saveTemplate = async () => {
  await tplRef.value.validate()
  tplDlg.loading = true
  try {
    await noticeMngApi.update(tplDlg.id, { templateTitle: tplForm.templateTitle, templateContent: tplForm.templateContent })
    const row = list.value.find(r => r.id === tplDlg.id)
    if (row) Object.assign(row, { templateTitle: tplForm.templateTitle, templateContent: tplForm.templateContent })
    tplDlg.visible = false
    ElMessage.success('模版已保存')
  } finally {
    tplDlg.loading = false
  }
}

// 关联服务穿梭框
const svcDlg = reactive({ visible: false, loading: false, row: null, custKey: '', custLabel: '' })
const svcKeys = ref([])
const serviceData = computed(() => NOTICE_SERVICES.map(s => ({ key: s, label: s })))
const openService = (row, cust) => {
  Object.assign(svcDlg, { visible: true, row, custKey: cust.key, custLabel: cust.label })
  svcKeys.value = [...(row[cust.key + 'Services'] || [])]
}
const saveService = async () => {
  svcDlg.loading = true
  try {
    const field = svcDlg.custKey + 'Services'
    await noticeMngApi.update(svcDlg.row.id, { [field]: [...svcKeys.value] })
    svcDlg.row[field] = [...svcKeys.value]
    svcDlg.visible = false
    ElMessage.success('关联服务已保存')
  } finally {
    svcDlg.loading = false
  }
}
</script>

<style scoped lang="scss">
.notice-mng__tip {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
.notice-mng__cust {
  display: flex;
  flex-wrap: wrap;
  gap: $space-md;
}
.notice-mng__cust-item {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
