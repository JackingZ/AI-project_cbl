<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="司机姓名"><el-input v-model="query.name" placeholder="请输入姓名" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px"><el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" /></el-select>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="140" @change="loadData">
        <template #col-cert="{ row }">{{ row.certType }} | {{ row.certNo }}</template>
        <template #col-region="{ row }">{{ [row.state, row.city, row.county].filter(Boolean).join(' / ') }}</template>
        <template #col-status="{ row }">
          <el-switch :model-value="row.status === '启用'" active-text="启用" inactive-text="禁用" :disabled="!can('enable')" :before-change="() => beforeStatusChange(row)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑司机' : '新增司机'" width="760px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="driver-form">
        <el-form-item label="司机姓名" prop="name"><el-input v-model="form.name" :maxlength="20" placeholder="请输入姓名" /></el-form-item>
        <el-form-item label="证件号码" prop="certNo">
          <el-input v-model="form.certNo" placeholder="请输入证件号码">
            <template #prepend>
              <el-select v-model="form.certType" style="width: 120px"><el-option v-for="t in CERT_TYPES" :key="t" :label="t" :value="t" /></el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="联系手机" prop="phone"><el-input v-model="form.phone" placeholder="请输入手机号" /></el-form-item>
        <el-form-item label="电子邮箱" prop="email"><el-input v-model="form.email" placeholder="请输入邮箱" /></el-form-item>
        <el-form-item label="省/州" prop="state"><el-input v-model="form.state" placeholder="请输入省/州" /></el-form-item>
        <el-form-item label="城市" prop="city"><el-input v-model="form.city" placeholder="请输入城市" /></el-form-item>
        <el-form-item label="区/县" prop="county"><el-input v-model="form.county" placeholder="请输入区/县" /></el-form-item>
        <el-form-item label="驾照日期" prop="expire">
          <el-date-picker v-model="form.expire" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否加班" prop="overtime">
          <el-radio-group v-model="form.overtime"><el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="是否长途" prop="distance">
          <el-radio-group v-model="form.distance"><el-radio v-for="y in YES_NO" :key="y" :value="y">{{ y }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="驾照照片" class="driver-form__full">
          <div v-if="form.photo" class="photo-item">
            <img :src="form.photo" alt="驾照照片" @click="preview.visible = true" />
            <i class="photo-del" @click="form.photo = ''"><el-icon><Close /></el-icon></i>
          </div>
          <el-upload v-else :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="onPhotoChange">
            <div class="photo-add"><el-icon><Plus /></el-icon><span>上传</span></div>
          </el-upload>
          <div class="photo-tip">支持 jpg/png，单张 ≤ 2MB（本地存储）</div>
        </el-form-item>
      </el-form>
    </Modal>

    <el-dialog v-model="preview.visible" width="560px" append-to-body title="驾照照片">
      <img :src="form.photo" style="width: 100%" alt="驾照照片" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus, Close } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required, phoneRule, emailRule } from '@/utils/validate'
import { confirmDelete } from '@/utils'
import { driverApi, CERT_TYPES, STATUS_OPTIONS } from '@/api/modules/system'

defineOptions({ name: 'SysDriver' })
const { can } = usePagePerms()
const YES_NO = ['是', '否']
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(driverApi.list, { name: '', status: '' })

const columns = [
  { prop: 'name', label: '姓名', minWidth: 110 },
  { prop: 'cert', label: '证件号码', minWidth: 200 },
  { prop: 'phone', label: '联系手机', width: 140 },
  { prop: 'email', label: '电子邮箱', minWidth: 170 },
  { prop: 'region', label: '所在地区', minWidth: 170 },
  { prop: 'expire', label: '驾照日期', width: 120 },
  { prop: 'status', label: '状态', width: 120, align: 'center', fixed: 'right' }
]

const rules = {
  name: [required('请输入司机姓名')],
  phone: [phoneRule],
  email: [emailRule]
}
const defaultForm = () => ({ name: '', certType: '身份证', certNo: '', phone: '', email: '', state: '', city: '', county: '', expire: '', photo: '', overtime: '否', distance: '否' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())
const preview = reactive({ visible: false })

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, defaultForm())
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const onPhotoChange = file => {
  const raw = file.raw
  if (raw.size > 2 * 1024 * 1024) return ElMessage.warning('照片不能超过 2MB')
  const reader = new FileReader()
  reader.onload = e => { form.photo = e.target.result }
  reader.readAsDataURL(raw)
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) await driverApi.update(dialog.id, { ...form })
    else await driverApi.add({ ...form, status: '启用' })
    ElMessage.success(dialog.isEdit ? '修改成功' : '新增成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const beforeStatusChange = row => {
  const next = row.status === '启用' ? '禁用' : '启用'
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(`确定要${next}该司机吗？`, '温馨提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
      .then(async () => {
        await driverApi.update(row.id, { status: next })
        row.status = next
        ElMessage.success('操作成功')
        resolve(true)
      }).catch(() => reject(new Error('cancel')))
  })
}
const remove = row =>
  confirmDelete(async () => { await driverApi.remove(row.id); loadData() }, `确定删除司机「${row.name}」吗？`)
</script>

<style scoped lang="scss">
.driver-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.9%; }
  &__full { width: 100% !important; }
}
.photo-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid $border-color;
  border-radius: $radius-base;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
  .photo-del {
    position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.5); color: #fff; border-radius: 50%; cursor: pointer; font-size: $font-xs;
  }
}
.photo-add {
  width: 100px; height: 100px;
  border: 1px dashed $border-color; border-radius: $radius-base;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: $text-placeholder; cursor: pointer; font-size: $font-xs;
  &:hover { border-color: $primary-color; color: $primary-color; }
}
.photo-tip { color: $text-placeholder; font-size: $font-xs; margin-top: $space-xs; }
</style>
