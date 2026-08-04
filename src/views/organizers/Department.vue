<template>
  <div>
    <SearchBar :model="{}" @search="loadData" @reset="loadData">
      <el-form-item label="部门名称">
        <el-input v-model="keyword" placeholder="输入名称过滤" clearable style="width: 200px" @input="loadData" />
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd(0)">新增部门</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable :data="treeData" :columns="columns" :loading="loading" :action-width="200">
        <template #col-name="{ row }">
          <el-icon class="dept-icon"><OfficeBuilding /></el-icon>{{ row.name }}
        </template>
        <template #col-manager="{ row }">
          {{ Array.isArray(row.manager) ? row.manager.join('、') : (row.manager || '—') }}
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('add')" @click="openAdd(row.id)">新增下级</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <FormDrawer v-model="dialog.visible" :title="dialog.title" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="所属公司">
          <el-input model-value="聚货通总部" disabled />
        </el-form-item>
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            check-strictly
            :render-after-expand="false"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            style="width: 100%"
            placeholder="请选择上级部门"
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" placeholder="English name" />
        </el-form-item>
        <el-form-item label="部门主管" prop="manager">
          <el-select
            v-model="form.manager"
            multiple
            collapse-tags
            clearable
            filterable
            placeholder="请选择部门主管"
            style="width: 100%"
          >
            <el-option v-for="m in managerOptions" :key="m" :label="m" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
    </FormDrawer>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { Plus, OfficeBuilding } from '@element-plus/icons-vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import FormDrawer from '@/components/Common/FormDrawer.vue'
import { confirmDelete } from '@/utils'
import { required } from '@/utils/validate'
import { getDeptTree, addDept, updateDept, deleteDept, getStaffOptions } from '@/api/modules/organizers'

defineOptions({ name: 'OrgDepartment' })

const { can } = usePagePerms()
const flat = ref([])
const keyword = ref('')
const loading = ref(false)
const managerOptions = ref([])

const columns = [
  { prop: 'name', label: '部门名称', minWidth: 260 },
  { prop: 'alias', label: '英文名称', width: 140 },
  { prop: 'manager', label: '部门主管', width: 120 },
  { prop: 'createTime', label: '添加时间', width: 180 }
]

// 扁平数据构建树
const buildTree = (items, parentId = 0) =>
  items
    .filter(d => d.parentId === parentId)
    .map(d => {
      const children = buildTree(items, d.id)
      return children.length ? { ...d, children } : { ...d }
    })

const treeData = computed(() => {
  const kw = keyword.value.trim()
  const src = kw ? flat.value.filter(d => d.name.includes(kw)) : flat.value
  return kw ? src : buildTree(flat.value)
})

// 上级部门下拉：带“顶级部门”根节点
const parentOptions = computed(() => [{ id: 0, name: '顶级部门', children: buildTree(flat.value) }])

const rules = {
  parentId: [{ required: true, message: '请选择上级部门', trigger: 'change' }],
  name: [required('请输入部门名称')]
}

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({ parentId: 0, name: '', alias: '', manager: [], remark: '' })
const form = reactive(defaultForm())

const loadData = async () => {
  loading.value = true
  try {
    const res = await getDeptTree()
    flat.value = res.data
  } finally {
    loading.value = false
  }
}

const openAdd = parentId => {
  Object.assign(form, defaultForm(), { parentId })
  Object.assign(dialog, { visible: true, title: '新增部门', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  // 兼容旧数据：manager 可能是字符串，规范化为数组供多选绑定
  const manager = Array.isArray(row.manager) ? [...row.manager] : (row.manager ? [row.manager] : [])
  Object.assign(form, { parentId: row.parentId, name: row.name, alias: row.alias, manager, remark: row.remark })
  Object.assign(dialog, { visible: true, title: '编辑部门', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateDept(dialog.id, { ...form })
      ElMessage.success('修改成功')
    } else {
      await addDept({ ...form })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

const handleDelete = row =>
  confirmDelete(async () => {
    await deleteDept(row.id)
    loadData()
  }, `确定删除部门「${row.name}」及其下级吗？`)

const loadManagerOptions = async () => {
  const res = await getStaffOptions()
  managerOptions.value = [...new Set(res.data.map(s => s.realName))]
}

useActivatedRefresh(() => { loadManagerOptions(); loadData() })
</script>

<style scoped lang="scss">
.dept-icon {
  margin-right: $space-xs;
  color: $primary-color;
  vertical-align: middle;
}
</style>
