<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 300px">
          <template #prepend>
            <el-select v-model="query.selectType" style="width: 120px">
              <el-option label="订阅人姓名" value="1" />
              <el-option label="手机号" value="2" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增订阅人</el-button>
        <el-button type="primary" :disabled="!can('batch')" @click="batchFlight">批量订阅航线</el-button>
        <el-button type="primary" :disabled="!can('batch')" @click="batchStore">批量订阅仓库</el-button>
      </template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="130" @change="loadData">
        <template #col-bySms="{ row }">{{ row.bySms ? '√' : '--' }}</template>
        <template #col-byWechat="{ row }">{{ row.byWechat ? '√' : '--' }}</template>
        <template #col-byEmail="{ row }">{{ row.byEmail ? '√' : '--' }}</template>
        <template #col-plan="{ row }">{{ row.plan ? '√' : '--' }}</template>
        <template #col-loaded="{ row }">{{ row.loaded ? '√' : '--' }}</template>
        <template #col-cost="{ row }">{{ row.cost ? '√' : '--' }}</template>
        <template #col-flightSub="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('batch')" @click="subFlight(row)">订阅航线</el-button>
        </template>
        <template #col-storeSub="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('batch')" @click="subStore(row)">订阅仓库</el-button>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" width="560px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="订阅人姓名" prop="name"><el-input v-model="form.name" :disabled="dialog.isEdit" :maxlength="30" placeholder="请输入" /></el-form-item>
        <el-form-item label="手机号" prop="phone"><el-input v-model="form.phone" :maxlength="11" placeholder="请输入" /></el-form-item>
        <el-form-item label="微信号" prop="wechat"><el-input v-model="form.wechat" :maxlength="30" placeholder="请输入" /></el-form-item>
        <el-form-item label="电子邮箱" prop="email"><el-input v-model="form.email" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="订阅内容" prop="bookArr">
          <el-checkbox-group v-model="form.bookArr">
            <el-checkbox v-for="b in BOOK_OPTIONS" :key="b.value" :value="b.value">{{ b.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="通知方式" prop="infoArr">
          <el-checkbox-group v-model="form.infoArr">
            <el-checkbox v-for="n in INFO_OPTIONS" :key="n.value" :value="n.value">{{ n.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 订阅航线/仓库 穿梭弹窗（行级/批量共用） -->
    <Modal v-model="sub.visible" :title="sub.title" width="640px" :confirm-loading="sub.loading" @confirm="submitSub">
      <div class="sub-tip">{{ sub.batch ? `批量应用到全部订阅人（${total} 人）` : `订阅人：${sub.row.name}` }}</div>
      <el-transfer
        v-model="sub.selected"
        :data="sub.options"
        :titles="[sub.kind === 'flight' ? '可选航线' : '可选仓库', '已订阅']"
        filterable
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required, phoneRule, emailRule } from '@/utils/validate'
import { confirmDelete } from '@/utils/index'
import { subscribeApi, SUB_FLIGHTS, SUB_STORES } from '@/api/modules/system'

defineOptions({ name: 'SysSubscribe' })
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(subscribeApi.list, { keyword: '', selectType: '1' })
const { can } = usePagePerms()

const BOOK_OPTIONS = [{ label: '计划信息', value: 'plan' }, { label: '装载信息', value: 'loaded' }, { label: '实时成本', value: 'cost' }]
const INFO_OPTIONS = [{ label: '手机', value: 'bySms' }, { label: '微信', value: 'byWechat' }, { label: '邮件', value: 'byEmail' }]

const columns = [
  { prop: 'name', label: '订阅人姓名', minWidth: 110 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'wechat', label: '微信号', width: 110 },
  { prop: 'email', label: '电子邮箱', minWidth: 150 },
  { prop: 'bySms', label: '手机通知', width: 90, align: 'center' },
  { prop: 'byWechat', label: '微信通知', width: 90, align: 'center' },
  { prop: 'byEmail', label: '邮件通知', width: 90, align: 'center' },
  { prop: 'plan', label: '计划信息', width: 90, align: 'center' },
  { prop: 'loaded', label: '装载信息', width: 90, align: 'center' },
  { prop: 'cost', label: '实时成本', width: 90, align: 'center' },
  { prop: 'flightSub', label: '订阅航线', width: 100, align: 'center' },
  { prop: 'storeSub', label: '订阅仓库', width: 100, align: 'center' }
]

const rules = {
  name: [required('请输入订阅人姓名')],
  phone: [required('请输入手机号'), phoneRule],
  wechat: [required('请输入微信号'), { pattern: /^[a-zA-Z0-9]+$/, message: '微信号只能包含字母数字', trigger: 'blur' }],
  email: [required('请输入电子邮箱'), emailRule],
  bookArr: [required('请选择订阅内容', 'change')],
  infoArr: [required('请选择通知方式', 'change')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({ name: '', phone: '', wechat: '', email: '', bookArr: [], infoArr: [] })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增订阅人', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    name: row.name, phone: row.phone, wechat: row.wechat, email: row.email,
    bookArr: BOOK_OPTIONS.filter(b => row[b.value]).map(b => b.value),
    infoArr: INFO_OPTIONS.filter(n => row[n.value]).map(n => n.value)
  })
  Object.assign(dialog, { visible: true, title: '编辑订阅人', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    // 订阅内容/通知方式多选还原为布尔字段
    const payload = {
      name: form.name, phone: form.phone, wechat: form.wechat, email: form.email,
      plan: form.bookArr.includes('plan'), loaded: form.bookArr.includes('loaded'), cost: form.bookArr.includes('cost'),
      bySms: form.infoArr.includes('bySms'), byWechat: form.infoArr.includes('byWechat'), byEmail: form.infoArr.includes('byEmail')
    }
    if (dialog.isEdit) {
      await subscribeApi.update(dialog.id, payload)
      ElMessage.success('修改成功')
    } else {
      await subscribeApi.add(payload)
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row => confirmDelete(async () => {
  await subscribeApi.remove(row.id)
  loadData()
}, '确定删除该订阅人吗？')

// 订阅航线/仓库穿梭（行级/批量共用）
const sub = reactive({ visible: false, loading: false, batch: false, kind: 'flight', title: '', row: {}, options: [], selected: [] })
const optionsOf = kind => (kind === 'flight' ? SUB_FLIGHTS : SUB_STORES).map(v => ({ key: v, label: v }))
const openSub = (kind, row) => {
  sub.kind = kind
  sub.batch = !row
  sub.row = row || {}
  sub.options = optionsOf(kind)
  sub.selected = row ? [...(row[kind === 'flight' ? 'flightIds' : 'storeIds'] || [])] : []
  sub.title = (row ? '订阅' : '批量订阅') + (kind === 'flight' ? '航线' : '仓库')
  sub.visible = true
}
const subFlight = row => openSub('flight', row)
const subStore = row => openSub('store', row)
const batchFlight = () => openSub('flight', null)
const batchStore = () => openSub('store', null)
const submitSub = async () => {
  sub.loading = true
  try {
    const field = sub.kind === 'flight' ? 'flightIds' : 'storeIds'
    if (sub.batch) {
      // 批量：应用到全部订阅人
      const all = list.value
      await Promise.all(all.map(r => subscribeApi.update(r.id, { [field]: [...sub.selected] })))
      ElMessage.success('批量订阅已保存')
    } else {
      await subscribeApi.update(sub.row.id, { [field]: [...sub.selected] })
      ElMessage.success('订阅已保存')
    }
    sub.visible = false
    loadData()
  } finally {
    sub.loading = false
  }
}
</script>

<style scoped lang="scss">
.sub-tip { margin-bottom: 12px; color: $text-secondary; font-size: $font-sm; }
</style>
