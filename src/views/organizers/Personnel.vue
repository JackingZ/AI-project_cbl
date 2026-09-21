<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" placeholder="姓名/手机/账号" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="公司类型">
        <el-select v-model="query.custType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="c in CUST_TYPES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属公司">
        <el-select v-model="query.custName" placeholder="全部" clearable filterable style="width: 200px">
          <el-option v-for="c in custNameOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属部门">
        <el-select v-model="query.dept" placeholder="全部" clearable style="width: 160px">
          <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="s in STATUS_OPTIONS" :key="s" :label="s" :value="s" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增人员</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="220"
        @change="loadData"
      >
        <template #col-status="{ row }">
          <el-switch
            v-if="!isProtected(row)"
            :model-value="normalizeSwitchValue(row.status, '启用', '禁用')"
            active-value="启用"
            inactive-value="禁用"
            :disabled="!can('edit')"
            @change="v => toggleStatus(row, v)"
          />
          <span v-else>{{ row.status }}</span>
        </template>
        <template #actions="{ row }">
          <template v-if="!isProtected(row)">
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="doReset(row)">重置密码</el-button>
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
          </template>
          <span v-else style="color: var(--el-text-color-placeholder)">—</span>
        </template>
      </ProTable>
    </PageCard>

    <FormDrawer v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="所属公司">
          <el-input model-value="聚货通总部" disabled />
        </el-form-item>
        <el-form-item label="所属部门" prop="deptName">
          <el-select v-model="form.deptName" placeholder="请选择部门" style="width: 100%">
            <el-option v-for="d in deptOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属岗位" prop="postName">
          <el-select v-model="form.postName" placeholder="请选择岗位" style="width: 100%">
            <el-option v-for="p in POST_OPTIONS" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" :disabled="dialog.isEdit" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item v-if="!dialog.isEdit" label="设置密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入初始密码" />
        </el-form-item>
        <el-form-item v-if="!dialog.isEdit" label="强制改密">
          <el-radio-group v-model="form.forceReset">
            <el-radio :value="true">是</el-radio>
            <el-radio :value="false">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="用户权限" prop="roleName">
          <el-select v-model="form.roleName" placeholder="请选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </FormDrawer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import FormDrawer from '@/components/Common/FormDrawer.vue'
import { confirmDelete } from '@/utils'
import { normalizeSwitchValue } from '@/utils/format'
import { required, phoneRule } from '@/utils/validate'
import { useUserStore } from '@/store/user'
import {
  getPersonnelList, addPersonnel, updatePersonnel, deletePersonnel,
  togglePersonnelStatus, resetPassword, getDeptTree, getRoleList, getCustNameOptions,
  STATUS_OPTIONS, POST_OPTIONS, CUST_TYPES
} from '@/api/modules/organizers'

// 组件名需与路由 name 一致，供 keep-alive include 白名单命中
defineOptions({ name: 'OrgPersonnel' })

const userStore = useUserStore()
const { can } = usePagePerms()

// 行级保护：内置 admin 账号与当前登录本人不可重置密码/编辑/删除/切换状态（对齐源）
const isProtected = row => row.username === 'admin' || row.username === userStore.userInfo?.username

const query = reactive({ keyword: '', custType: '', custName: '', dept: '', status: '', page: 1, size: 10 })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const deptOptions = ref([])
const roleOptions = ref([])
const custNameOptions = ref([])

const columns = [
  { prop: 'realName', label: '姓名', width: 120 },
  { prop: 'username', label: '登录名', width: 120 },
  { prop: 'phone', label: '手机号', width: 140 },
  { prop: 'custType', label: '公司类型', width: 100 },
  { prop: 'custName', label: '所属公司', minWidth: 160 },
  { prop: 'deptName', label: '所属部门', width: 110 },
  { prop: 'postName', label: '所属岗位', width: 110 },
  { prop: 'roleName', label: '用户权限', width: 120 },
  { prop: 'createTime', label: '添加时间', width: 170 },
  { prop: 'status', label: '状态', width: 90, align: 'center' }
]

const rules = {
  realName: [required('请输入姓名')],
  username: [required('请输入登录账号')],
  password: [required('请输入初始密码')],
  phone: [required('请输入手机号'), phoneRule],
  deptName: [required('请选择部门', 'change')],
  roleName: [required('请选择角色', 'change')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({ realName: '', username: '', password: '', forceReset: false, phone: '', custName: '聚货通总部', deptName: '', postName: '', roleName: '', status: '启用' })
const form = reactive(defaultForm())

const loadData = async () => {
  loading.value = true
  try {
    const res = await getPersonnelList(query)
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { query.page = 1; loadData() }
const handleReset = () => { Object.assign(query, { keyword: '', custType: '', custName: '', dept: '', status: '', page: 1 }); loadData() }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增人员', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { realName: row.realName, username: row.username, phone: row.phone, custName: row.custName, deptName: row.deptName, postName: row.postName, roleName: row.roleName, status: row.status })
  Object.assign(dialog, { visible: true, title: '编辑人员', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updatePersonnel(dialog.id, { ...form })
      // 若修改的是当前登录用户本人，实时按新角色重载菜单权限
      if (form.username === userStore.userInfo?.username) {
        await userStore.syncRole(form.roleName)
      }
      ElMessage.success('修改成功')
    } else {
      await addPersonnel({ ...form })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

const toggleStatus = async (row, v) => {
  await togglePersonnelStatus(row.id, v)
  row.status = v
  ElMessage.success(`已${v}`)
}

const doReset = async row => {
  const res = await resetPassword(row.id)
  ElMessageBox.alert(`「${row.realName}」的新密码为：${res.data.password}`, '重置密码成功', { confirmButtonText: '知道了' })
}

const handleDelete = row =>
  confirmDelete(async () => {
    await deletePersonnel(row.id)
    loadData()
  }, `确定删除人员「${row.realName}」吗？`)

const loadOptions = async () => {
  const [depts, roles, custNames] = await Promise.all([getDeptTree(), getRoleList(), getCustNameOptions()])
  deptOptions.value = depts.data.map(d => d.name)
  roleOptions.value = roles.data.map(r => r.name)
  custNameOptions.value = custNames.data
}

useActivatedRefresh(() => { loadOptions(); loadData() })
</script>
