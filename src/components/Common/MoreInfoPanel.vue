<template>
  <PageCard>
    <template v-if="showBack" #extra>
      <el-button :icon="Back" @click="$emit('back')">返回列表</el-button>
    </template>
    <div class="more-panel__owner">当前主体：<b>{{ owner?.name }}</b></div>
    <el-tabs v-model="active" @tab-change="loadData">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name" />
    </el-tabs>

    <div class="more-panel__bar">
      <el-button type="primary" :icon="Plus" size="small" :disabled="!can('add')" @click="openAdd">{{ current.addText }}</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe style="width: 100%">
      <el-table-column
        v-for="col in current.columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        show-overflow-tooltip
      >
        <template #default="{ row }">{{ render(col, row) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button v-if="active === 'address'" link type="primary" size="small" :disabled="!can('edit')" @click="makeDefault(row)">设为默认</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><Empty /></template>
    </el-table>

    <Modal v-model="dialog.visible" :title="dialog.title" width="640px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-row :gutter="16">
          <el-col v-for="f in current.fields" :key="f.prop" :span="f.span || 12">
            <el-form-item :label="f.label" :prop="f.prop">
              <el-input v-if="f.type === 'text'" v-model="form[f.prop]" :placeholder="`请输入${f.label}`" />
              <el-input v-else-if="f.type === 'textarea'" v-model="form[f.prop]" type="textarea" :rows="2" :placeholder="`请输入${f.label}`" />
              <el-cascader v-else-if="f.type === 'region'" v-model="form[f.prop]" :options="REGIONS" style="width: 100%" placeholder="国家/州省/城市/区县" />
              <el-radio-group v-else-if="f.type === 'bool'" v-model="form[f.prop]">
                <el-radio :value="true">是</el-radio>
                <el-radio :value="false">否</el-radio>
              </el-radio-group>
              <el-select v-else v-model="form[f.prop]" :placeholder="`请选择${f.label}`" style="width: 100%">
                <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </Modal>
  </PageCard>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { Plus, Back } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import Empty from '@/components/Common/Empty.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import { REGIONS } from '@/api/modules/organizers'
import {
  getMoreList, addMore, updateMore, deleteMore, setDefaultAddress,
  ADDRESS_TYPES, SETTING_TYPES, COLLECTION_TYPES, CURRENCIES, FILE_TYPES
} from '@/api/modules/organizerMore'

// 机构“更多”附加信息面板：配置化 6 标签页，客户隐藏收款/开票
const props = defineProps({
  ownerType: { type: String, required: true }, // customer | supplier | agent | jht
  owner: { type: Object, default: null },
  showBack: { type: Boolean, default: true }, // 独立页(如设置)可隐藏“返回列表”
  can: { type: Function, default: () => true } // 按钮权限判定：can(action) -> boolean
})
defineEmits(['back'])

const COUNTRIES = REGIONS.map(r => r.value)
const joinRegion = v => (Array.isArray(v) ? v.filter(Boolean).join(' / ') : v || '-')

const ALL_TABS = [
  { name: 'contact', label: '联系信息', addText: '新增人员',
    columns: [
      { prop: 'country', label: '所在国家', minWidth: 110 },
      { prop: 'dept', label: '所属部门', width: 100 },
      { prop: 'duty', label: '职务类型', width: 100 },
      { prop: 'name', label: '姓名', width: 100 },
      { prop: 'phone', label: '电话/手机', width: 150 },
      { prop: 'email', label: '电子邮箱', minWidth: 160 },
      { prop: 'address', label: '地址', minWidth: 160 },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'country', type: 'select', label: '所在国家', options: COUNTRIES },
      { prop: 'dept', type: 'text', label: '所属部门' },
      { prop: 'duty', type: 'text', label: '职务类型' },
      { prop: 'name', type: 'text', label: '姓名' },
      { prop: 'alias', type: 'text', label: '英文名' },
      { prop: 'tel', type: 'text', label: '电话' },
      { prop: 'phone', type: 'text', label: '手机' },
      { prop: 'fax', type: 'text', label: '传真' },
      { prop: 'email', type: 'text', label: '电子邮箱' },
      { prop: 'sns', type: 'text', label: '其他联系' },
      { prop: 'address', type: 'text', label: '地址', span: 24 },
      { prop: 'remark', type: 'textarea', label: '备注', span: 24 }
    ],
    required: ['name'] },
  { name: 'address', label: '地址信息', addText: '新增地址',
    columns: [
      { prop: 'isDefault', label: '默认', width: 70, align: 'center' },
      { prop: 'addrType', label: '地址类型', width: 100 },
      { prop: 'name', label: '地址名称', minWidth: 120 },
      { prop: 'region', label: '所在地区', minWidth: 180 },
      { prop: 'address', label: '地址', minWidth: 160 },
      { prop: 'contactName', label: '关联对接人', width: 120 },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'addrType', type: 'select', label: '地址类型', options: ADDRESS_TYPES },
      { prop: 'name', type: 'text', label: '地址名称' },
      { prop: 'region', type: 'region', label: '所在地区', span: 24 },
      { prop: 'address', type: 'text', label: '地址', span: 24 },
      { prop: 'contactName', type: 'text', label: '关联对接人' },
      { prop: 'isDefault', type: 'bool', label: '设为默认' }
    ],
    required: ['name'] },
  { name: 'setting', label: '我的设置', addText: '新增设置',
    columns: [
      { prop: 'settingType', label: '类型', width: 100 },
      { prop: 'contact', label: '联系人', width: 100 },
      { prop: 'region', label: '所在地区', minWidth: 180 },
      { prop: 'company', label: '公司名称', minWidth: 120 },
      { prop: 'phone', label: '联系电话', width: 140 },
      { prop: 'email', label: '电子邮箱', minWidth: 150 },
      { prop: 'valid', label: '是否有效', width: 90, align: 'center' },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'settingType', type: 'select', label: '类型', options: SETTING_TYPES },
      { prop: 'contact', type: 'text', label: '联系人' },
      { prop: 'serviceCountry', type: 'select', label: '服务国家', options: COUNTRIES },
      { prop: 'region', type: 'region', label: '所在地区', span: 24 },
      { prop: 'company', type: 'text', label: '公司名称' },
      { prop: 'phone', type: 'text', label: '联系电话' },
      { prop: 'email', type: 'text', label: '电子邮箱' },
      { prop: 'certType', type: 'select', label: '证件类型', options: ['身份证', '护照', '营业执照'] },
      { prop: 'certNumber', type: 'text', label: '证件号码' },
      { prop: 'postal', type: 'text', label: '邮政编码' },
      { prop: 'address', type: 'text', label: '联系地址', span: 24 },
      { prop: 'isPublic', type: 'bool', label: '是否公开' },
      { prop: 'valid', type: 'select', label: '是否有效', options: ['有效', '无效'] }
    ],
    required: ['contact'] },
  { name: 'collection', label: '收款信息', addText: '新增收款信息', ownerOnly: true,
    columns: [
      { prop: 'collType', label: '收款方式', width: 110 },
      { prop: 'country', label: '国家/地区', width: 110 },
      { prop: 'currency', label: '币种', width: 120 },
      { prop: 'acctNo', label: '收款账号', minWidth: 150 },
      { prop: 'swiftCode', label: 'SWIFT Code', width: 150 },
      { prop: 'remark', label: '备注', minWidth: 120 },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'collType', type: 'select', label: '收款方式', options: COLLECTION_TYPES },
      { prop: 'country', type: 'select', label: '国家/地区', options: COUNTRIES },
      { prop: 'currency', type: 'select', label: '币种', options: CURRENCIES },
      { prop: 'acctName', type: 'text', label: '账户名称' },
      { prop: 'acctNo', type: 'text', label: '收款账号' },
      { prop: 'bankName', type: 'text', label: '银行名称' },
      { prop: 'bankNameEn', type: 'text', label: '银行英文名' },
      { prop: 'bankCode', type: 'text', label: '银行代码' },
      { prop: 'branchCode', type: 'text', label: '分行代码' },
      { prop: 'swiftCode', type: 'text', label: 'SWIFT Code' },
      { prop: 'bankAddress', type: 'text', label: '银行地址', span: 24 },
      { prop: 'remark', type: 'textarea', label: '备注', span: 24 }
    ],
    required: ['acctNo'] },
  { name: 'bill', label: '开票信息', addText: '新增开票信息', ownerOnly: true,
    columns: [
      { prop: 'name', label: '开票名称', minWidth: 120 },
      { prop: 'taxId', label: '纳税识别号', width: 160 },
      { prop: 'bank', label: '开户银行', width: 140 },
      { prop: 'country', label: '国家/地区', width: 110 },
      { prop: 'currency', label: '币种', width: 120 },
      { prop: 'amount', label: '每月额度', width: 100 },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'name', type: 'text', label: '开票名称' },
      { prop: 'taxId', type: 'text', label: '纳税识别号' },
      { prop: 'bank', type: 'text', label: '开户银行' },
      { prop: 'country', type: 'select', label: '国家/地区', options: COUNTRIES },
      { prop: 'currency', type: 'select', label: '币种', options: CURRENCIES },
      { prop: 'amount', type: 'text', label: '每月额度' },
      { prop: 'remark', type: 'textarea', label: '备注', span: 24 }
    ],
    required: ['name'] },
  { name: 'file', label: '文件列表', addText: '新增上传文件',
    columns: [
      { prop: 'name', label: '文件名称', minWidth: 120 },
      { prop: 'fileType', label: '文件类型', width: 130 },
      { prop: 'code', label: '编码/ID', minWidth: 140 },
      { prop: 'des', label: '文件描述', minWidth: 150 },
      { prop: 'updateTime', label: '最后更新', width: 160 }
    ],
    fields: [
      { prop: 'name', type: 'text', label: '文件名称' },
      { prop: 'fileType', type: 'select', label: '文件类型', options: FILE_TYPES },
      { prop: 'code', type: 'text', label: '编码/ID' },
      { prop: 'des', type: 'textarea', label: '文件描述', span: 24 }
    ],
    required: ['name'] }
]

// 客户隐藏收款/开票（ownerOnly），供应商/代理商全部显示
const tabs = computed(() => ALL_TABS.filter(t => !t.ownerOnly || props.ownerType !== 'customer'))
const active = ref('contact')
const current = computed(() => tabs.value.find(t => t.name === active.value) || tabs.value[0])
const rules = computed(() =>
  Object.fromEntries((current.value.required || []).map(p => [p, [required(`请填写${labelOf(p)}`)]]))
)
const labelOf = p => (current.value.fields.find(f => f.prop === p) || {}).label || p

const list = ref([])
const loading = ref(false)

const render = (col, row) => {
  const v = row[col.prop]
  if (col.prop === 'region') return joinRegion(v)
  if (col.prop === 'isDefault') return v ? '默认' : ''
  return v ?? '-'
}

const loadData = async () => {
  if (!props.owner) return
  loading.value = true
  try {
    const res = await getMoreList(props.ownerType, props.owner.id, active.value)
    list.value = res.data
  } finally {
    loading.value = false
  }
}

watch(() => [props.owner, props.ownerType], () => { active.value = 'contact'; loadData() })

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, id: null })
const form = reactive({})

const blankForm = () => {
  const obj = {}
  current.value.fields.forEach(f => { obj[f.prop] = f.type === 'region' ? [] : (f.type === 'bool' ? false : '') })
  return obj
}
const openAdd = () => {
  Object.keys(form).forEach(k => delete form[k])
  Object.assign(form, blankForm())
  Object.assign(dialog, { visible: true, title: '新增' + current.value.label, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.keys(form).forEach(k => delete form[k])
  current.value.fields.forEach(f => { form[f.prop] = row[f.prop] ?? (f.type === 'region' ? [] : (f.type === 'bool' ? false : '')) })
  Object.assign(dialog, { visible: true, title: '编辑' + current.value.label, id: row.id })
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { ...form }
    // region 首级作为 country 便于列表其它场景引用
    if (Array.isArray(payload.region)) payload.country = payload.region[0] || payload.country
    if (dialog.id) await updateMore(dialog.id, payload)
    else await addMore(props.ownerType, props.owner.id, active.value, payload)
    ElMessage.success(dialog.id ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

const makeDefault = async row => {
  await setDefaultAddress(props.ownerType, props.owner.id, row.id)
  ElMessage.success('已设为默认地址')
  loadData()
}
const handleDelete = row =>
  confirmDelete(async () => { await deleteMore(row.id); loadData() }, '确定删除该条记录吗？')

loadData()
</script>

<style scoped lang="scss">
.more-panel__owner {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-sm;
  b { color: $text-primary; }
}
.more-panel__bar {
  margin-bottom: $space-md;
}
</style>
