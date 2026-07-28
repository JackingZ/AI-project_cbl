import { reactive, ref, onMounted, onActivated } from 'vue'
import { useRoute } from 'vue-router'
import { confirmDelete } from './index'
import { usePermissionStore } from '@/store/permission'

// 列表页数据加载 hook：
// - 首次进入执行一次（onMounted）
// - 被 keep-alive 缓存的页面再次激活时刷新（onActivated），实现“组件状态保留 + 数据进入即刷新”
// - 跳过首次挂载后紧随的 onActivated，避免与 onMounted 重复加载
// 用法：useActivatedRefresh(loadData) 替代 onMounted(loadData)
export function useActivatedRefresh(loader) {
  let skipFirstActivate = true
  onMounted(loader)
  onActivated(() => {
    if (skipFirstActivate) {
      skipFirstActivate = false
      return
    }
    loader()
  })
}

// 列表查询 hook：统一封装 query/list/total/loading + 查询/重置/加载，消除各列表页样板代码。
// fetchFn(query) 需返回 { data: { list, total } }（与 mock/persist 一致）。
// initialQuery 为业务筛选字段初值（不含分页），重置时恢复这些字段。
export function useListQuery(fetchFn, initialQuery = {}) {
  const query = reactive({ page: 1, size: 10, ...initialQuery })
  const list = ref([])
  const total = ref(0)
  const loading = ref(false)

  const loadData = async () => {
    loading.value = true
    try {
      const res = await fetchFn(query)
      list.value = res.data.list
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => { query.page = 1; loadData() }
  const handleReset = () => {
    Object.keys(initialQuery).forEach(k => { query[k] = initialQuery[k] })
    query.page = 1
    loadData()
  }

  // 缓存页再次进入自动刷新
  useActivatedRefresh(loadData)

  return { query, list, total, loading, loadData, handleSearch, handleReset }
}

// 新增/编辑弹窗 + 状态切换 + 删除的通用逻辑（仅逻辑，UI 仍由各页自行编写）。
// api 需提供 { add, update, remove }；defaultForm 返回表单初值；reload 为列表刷新函数。
export function useCrudForm({ api, defaultForm, reload, label = '记录' }) {
  const formRef = ref(null)
  const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
  const form = reactive(defaultForm())
  const reset = () => Object.assign(form, defaultForm())

  const openAdd = () => {
    reset()
    Object.assign(dialog, { visible: true, title: `新增${label}`, isEdit: false, id: null })
    formRef.value?.clearValidate()
  }
  const openEdit = row => {
    reset()
    Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
    Object.assign(dialog, { visible: true, title: `编辑${label}`, isEdit: true, id: row.id })
    formRef.value?.clearValidate()
  }
  const submit = async () => {
    await formRef.value.validate()
    dialog.loading = true
    try {
      if (dialog.isEdit) {
        await api.update(dialog.id, { ...form })
        ElMessage.success('修改成功')
      } else {
        await api.add({ ...form })
        ElMessage.success('新增成功')
      }
      dialog.visible = false
      reload()
    } finally {
      dialog.loading = false
    }
  }
  const toggle = async (row, v) => {
    await api.update(row.id, { status: v })
    row.status = v
    ElMessage.success(`已${v}`)
  }
  const remove = row =>
    confirmDelete(async () => {
      await api.remove(row.id)
      reload()
    }, `确定删除该${label}吗？`)

  return { formRef, dialog, form, openAdd, openEdit, submit, toggle, remove }
}

// 页面按钮权限 hook：按当前路由 path 拼 `${path}:${action}` 校验角色 perms。
// 用法：const { can } = usePagePerms()；模板 :disabled="!can('add')"。
// 超管/未加载全放行，其余严格按已保存 perms（默认拒绝）。basePath 可覆盖路由 path。
export function usePagePerms(basePath) {
  const route = useRoute()
  const permStore = usePermissionStore()
  const path = basePath || route.path
  const can = action => permStore.hasBtn(`${path}:${action}`)
  return { can }
}
