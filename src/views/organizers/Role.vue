<template>
  <el-row :gutter="16">
    <!-- 左：角色列表 -->
    <el-col :span="6">
      <PageCard title="角色列表">
        <template #extra>
          <el-button link type="primary" :icon="Plus" @click="openAdd">新增角色</el-button>
        </template>
        <el-menu :default-active="String(activeId)" class="role-menu">
          <el-menu-item
            v-for="role in roles"
            :key="role.id"
            :index="String(role.id)"
            @click="selectRole(role)"
          >
            <span class="role-name">{{ role.name }}</span>
            <el-tag size="small" effect="plain" class="role-tag">{{ role.custType }}</el-tag>
            <span class="role-ops">
              <el-button link type="primary" size="small" @click.stop="openEdit(role)">编辑</el-button>
              <el-button link type="danger" size="small" @click.stop="handleDelete(role)">删除</el-button>
            </span>
          </el-menu-item>
        </el-menu>
        <Empty v-if="!roles.length" description="暂无角色" />
      </PageCard>
    </el-col>

    <!-- 右：权限矩阵 -->
    <el-col :span="18">
      <PageCard :title="activeRole ? `权限设置 · ${activeRole.name}` : '权限设置'">
        <template #extra>
          <template v-if="activeRole && !isSuperAdmin">
            <el-button link type="primary" size="small" @click="checkAll(true)">全选</el-button>
            <el-button link type="info" size="small" @click="checkAll(false)">清空</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="savePerms">保存权限</el-button>
          </template>
        </template>
        <el-empty v-if="!activeRole" description="请选择左侧角色进行权限配置" />
        <el-alert
          v-else-if="isSuperAdmin"
          type="info"
          :closable="false"
          title="超级管理员默认拥有全部权限，无需配置"
          show-icon
        />
        <div v-else class="perm-matrix">
          <div class="matrix-head">
            <span class="col-menu">菜单页面</span>
            <span class="col-actions">操作权限</span>
          </div>
          <div v-for="mod in PERM_MATRIX" :key="mod.id" class="matrix-module">
            <div class="module-row">
              <el-checkbox
                :model-value="moduleChecked(mod)"
                :indeterminate="moduleIndeterminate(mod)"
                @change="v => toggleModule(mod, v)"
              >{{ mod.label }}</el-checkbox>
            </div>
            <div v-for="page in mod.children" :key="page.id" class="page-row">
              <span class="col-menu">
                <el-checkbox
                  :model-value="checkedPages.includes(page.id)"
                  @change="v => togglePage(page, v)"
                >{{ page.label }}</el-checkbox>
              </span>
              <span class="col-actions">
                <el-checkbox
                  v-for="btn in page.buttons"
                  :key="btn.id"
                  :model-value="checkedPerms.includes(btn.id)"
                  :disabled="!checkedPages.includes(page.id)"
                  @change="v => togglePerm(btn.id, v)"
                >{{ btn.label }}</el-checkbox>
              </span>
            </div>
          </div>
        </div>
      </PageCard>
    </el-col>
  </el-row>

  <Modal v-model="dialog.visible" :title="dialog.title" width="440px" :confirm-loading="dialog.loading" @confirm="submit">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="公司类型" prop="custType">
        <el-select v-model="form.custType" placeholder="请选择" style="width: 100%">
          <el-option v-for="c in CUST_TYPES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
      </el-form-item>
    </el-form>
  </Modal>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useActivatedRefresh } from '@/utils/hooks'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import Empty from '@/components/Common/Empty.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import { useUserStore } from '@/store/user'
import { usePermissionStore } from '@/store/permission'
import {
  getRoleList, addRole, updateRole, deleteRole,
  PERM_MATRIX, ALL_MENU_PATHS, ALL_PERM_IDS, CUST_TYPES
} from '@/api/modules/organizers'

defineOptions({ name: 'OrgRole' })

const userStore = useUserStore()
const permStore = usePermissionStore()

const roles = ref([])
const activeRole = ref(null)
const activeId = ref('')
const saving = ref(false)

// 当前角色勾选的页面 path 与按钮 id（矩阵双向绑定）
const checkedPages = ref([])
const checkedPerms = ref([])

const isSuperAdmin = computed(() => activeRole.value?.menuPerms?.includes('*'))

const moduleChecked = mod => mod.children.every(p => checkedPages.value.includes(p.id))
const moduleIndeterminate = mod => {
  const n = mod.children.filter(p => checkedPages.value.includes(p.id)).length
  return n > 0 && n < mod.children.length
}

// 勾选/取消页面：取消时同步清掉该页面下的按钮权限
const togglePage = (page, v) => {
  if (v) {
    if (!checkedPages.value.includes(page.id)) checkedPages.value.push(page.id)
  } else {
    checkedPages.value = checkedPages.value.filter(p => p !== page.id)
    const ids = page.buttons.map(b => b.id)
    checkedPerms.value = checkedPerms.value.filter(id => !ids.includes(id))
  }
}
const togglePerm = (id, v) => {
  if (v) {
    if (!checkedPerms.value.includes(id)) checkedPerms.value.push(id)
  } else {
    checkedPerms.value = checkedPerms.value.filter(x => x !== id)
  }
}
// 模块级：整块页面勾选/取消（取消时连带清按钮）
const toggleModule = (mod, v) => mod.children.forEach(p => togglePage(p, v))

const checkAll = flag => {
  checkedPages.value = flag ? [...ALL_MENU_PATHS] : []
  checkedPerms.value = flag ? [...ALL_PERM_IDS] : []
}

const loadRoles = async (keepActive = true) => {
  const res = await getRoleList()
  roles.value = res.data
  if (roles.value.length) {
    const keep = keepActive && activeRole.value
      ? roles.value.find(r => r.id === activeRole.value.id)
      : null
    selectRole(keep || roles.value[0])
  } else {
    activeRole.value = null
    activeId.value = ''
  }
}

const selectRole = role => {
  activeRole.value = { ...role }
  activeId.value = role.id
  const paths = role.menuPerms?.includes('*') ? [...ALL_MENU_PATHS] : (role.menuPerms || [])
  checkedPages.value = [...paths]
  checkedPerms.value = [...(role.perms || [])]
}

const savePerms = async () => {
  if (!activeRole.value || isSuperAdmin.value) return
  saving.value = true
  try {
    const menuPerms = [...checkedPages.value]
    const perms = [...checkedPerms.value]
    await updateRole(activeRole.value.id, { menuPerms, perms })
    Object.assign(activeRole.value, { menuPerms, perms })
    const local = roles.value.find(r => r.id === activeRole.value.id)
    if (local) Object.assign(local, { menuPerms, perms })
    // 若改的是当前登录用户的角色，实时刷新侧边栏
    if (activeRole.value.name === userStore.roleName) permStore.setPerms(menuPerms)
    ElMessage.success('权限保存成功')
  } finally {
    saving.value = false
  }
}

/* 角色增删改 */
const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({ name: '', custType: '聚货通', remark: '' })
const form = reactive(defaultForm())
const rules = {
  name: [required('请输入角色名称')],
  custType: [required('请选择公司类型', 'change')]
}

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增角色', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = role => {
  Object.assign(form, { name: role.name, custType: role.custType, remark: role.remark })
  Object.assign(dialog, { visible: true, title: '编辑角色', isEdit: true, id: role.id })
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateRole(dialog.id, { name: form.name, custType: form.custType, remark: form.remark })
      ElMessage.success('修改成功')
    } else {
      await addRole({ name: form.name, custType: form.custType, remark: form.remark, perms: [], menuPerms: [] })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadRoles()
  } finally {
    dialog.loading = false
  }
}

const handleDelete = role =>
  confirmDelete(async () => {
    await deleteRole(role.id)
    if (activeRole.value?.id === role.id) activeRole.value = null
    loadRoles(false)
  }, `确定删除角色「${role.name}」吗？`)

useActivatedRefresh(() => loadRoles())
</script>

<style scoped lang="scss">
.role-menu {
  border-right: none;
  :deep(.el-menu-item) { display: flex; align-items: center; height: 44px; }
  .role-name { flex: 1; }
  .role-tag { margin: 0 $space-sm; }
  .role-ops { display: none; }
  :deep(.el-menu-item:hover) .role-ops { display: inline-flex; }
}
.perm-matrix {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  .matrix-head {
    display: flex;
    background: var(--el-fill-color-light);
    font-weight: 600;
    font-size: 13px;
    .col-menu, .col-actions { padding: 8px 12px; }
  }
  .col-menu { width: 180px; flex-shrink: 0; }
  .col-actions { flex: 1; display: flex; flex-wrap: wrap; gap: 4px 16px; }
  .matrix-module { border-top: 1px solid var(--el-border-color-lighter); }
  .module-row { padding: 8px 12px; background: var(--el-fill-color-lighter); font-weight: 600; }
  .page-row {
    display: flex;
    align-items: center;
    padding: 4px 0;
    border-top: 1px dashed var(--el-border-color-lighter);
    .col-menu { padding-left: 24px; }
  }
}
</style>
