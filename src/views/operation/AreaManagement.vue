<template>
  <div class="area-page">
    <!-- 左侧行政区域树 -->
    <div class="area-tree">
      <div class="area-tree__head">
        <span>行政区域</span>
        <el-input v-model="filterText" size="small" placeholder="关键字" style="width: 130px" clearable>
          <template #append><el-button :icon="Search" @click="filterTree" /></template>
        </el-input>
      </div>
      <el-tree
        ref="treeRef"
        :data="treeData"
        node-key="id"
        :props="{ label: 'name', children: 'children', isLeaf: 'leaf' }"
        :expand-on-click-node="false"
        :filter-node-method="filterNode"
        highlight-current
        accordion
        @node-click="onNodeClick"
      />
    </div>

    <!-- 右侧表格 -->
    <div class="area-main">
      <PageCard>
        <div class="op-toolbar">
          <div>
            <el-button type="primary" :icon="Plus" :disabled="!canAdd" @click="openAdd">新增</el-button>
            <el-button :disabled="!canAdd" @click="openBatch">批量新增</el-button>
          </div>
          <el-input v-model="search" clearable size="default" placeholder="地区代码/地区名称/地区简称/英文名称" style="width: 280px" @input="loadChildren" />
        </div>
        <div class="area-tip">{{ currentNode ? `当前：${currentNode.name}（下级）` : '点击左侧的行政区域节点' }}</div>
        <ProTable :data="list" :columns="columns" :loading="loading" :total="0" :action-width="150" @change="() => {}">
          <template #actions="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>

    <!-- 单条 新增/编辑 -->
    <Modal v-model="dialog.visible" title="行政地区" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="地区代码" prop="code">
          <el-input v-model="form.code" :disabled="dialog.isEdit" :maxlength="30" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="地区名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="地区简称" prop="abbr">
          <el-input v-model="form.abbr" :maxlength="10" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="alias">
          <el-input v-model="form.alias" :maxlength="50" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 批量新增 -->
    <el-dialog v-model="batchDialog.visible" title="批量新增行政区域" width="1000px" :close-on-click-modal="false">
      <div class="batch-query">
        <el-select v-model="batchForm.countryId" placeholder="国家" clearable size="small" style="width: 130px">
          <el-option label="美国" value="US" />
          <el-option label="加拿大" value="CA" />
        </el-select>
        <el-input :model-value="`添加到${currentNode ? currentNode.name : ''}下级`" readonly size="small" style="width: 200px" />
        <el-input v-model="batchForm.name" size="small" placeholder="请输入英文名称" style="width: 200px" clearable />
        <el-button type="primary" size="small" @click="genBatch">查询</el-button>
      </div>
      <el-table :data="batchData" height="400" border style="width: 100%; margin: 10px 0">
        <el-table-column label="地区名称">
          <template #default="s"><el-input v-model="s.row.name" size="small" placeholder="请输入" /></template>
        </el-table-column>
        <el-table-column label="地区简称">
          <template #default="s"><el-input v-model="s.row.abbr" size="small" placeholder="请输入" /></template>
        </el-table-column>
        <el-table-column label="英文名称">
          <template #default="s"><el-input v-model="s.row.alias" size="small" placeholder="请输入" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="s"><el-button link type="danger" size="small" @click="batchData.splice(s.$index, 1)">删除</el-button></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="confirmBatch">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { required, noChineseRule } from '@/utils/validate'
import { confirmThen } from '@/utils'
import { areaApi } from '@/api/modules/operation'

defineOptions({ name: 'OpArea' })

// ===== 树 =====
const treeRef = ref(null)
const treeData = ref([])
const filterText = ref('')
// 递归构建完整树（数据量小，一次性构建）
const buildTree = (parentId = 0) => {
  const rows = areaApi.res.raw().filter(o => o.parentId === parentId)
  return rows.map(r => {
    const children = buildTree(r.id)
    return { ...r, leaf: r.level >= 4, children: children.length ? children : undefined }
  })
}
const refreshTree = () => { treeData.value = buildTree(0) }
const filterTree = () => treeRef.value?.filter(filterText.value)
const filterNode = (value, data) => !value || data.name.includes(value)

// ===== 右侧表格 =====
const currentNode = ref(null)
const search = ref('')
const list = ref([])
const loading = ref(false)
const columns = [
  { prop: 'code', label: '地区代码', width: 150 },
  { prop: 'name', label: '地区名称', minWidth: 230 },
  { prop: 'abbr', label: '地区简称', minWidth: 180 },
  { prop: 'alias', label: '英文名称', minWidth: 230 }
]
// 当前节点存在且非末级(区县 level<4)时可新增下级
const canAdd = computed(() => currentNode.value && currentNode.value.level < 4)

const loadChildren = () => {
  const parentId = currentNode.value ? currentNode.value.id : 0
  const kw = search.value
  // 同步从 raw() 过滤，避免异步 Promise 导致空白/卡顿
  list.value = areaApi.res.raw().filter(o =>
    o.parentId === parentId && (!kw || [o.name, o.abbr, o.alias, o.code].some(v => String(v).includes(kw)))
  )
}
const onNodeClick = node => {
  currentNode.value = node
  search.value = ''
  loadChildren()
}

// ===== 单条 新增/编辑 =====
const rules = {
  code: [required('地区代码不能为空'), noChineseRule('地区代码不能有中文')],
  name: [required('地区名称不能为空')],
  abbr: [required('地区简称不能为空')],
  alias: [required('英文名称不能为空'), noChineseRule('英文名称不能有中文')]
}
const defaultForm = () => ({ code: '', name: '', abbr: '', alias: '' })
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, { code: row.code, name: row.name, abbr: row.abbr, alias: row.alias })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await areaApi.update(dialog.id, { code: form.code, name: form.name, abbr: form.abbr, alias: form.alias })
    } else {
      const parent = currentNode.value
      await areaApi.add({
        parentId: parent ? parent.id : 0,
        level: parent ? parent.level + 1 : 1,
        code: form.code, name: form.name, abbr: form.abbr, alias: form.alias
      })
    }
    ElMessage.success('操作成功')
    dialog.visible = false
    refreshTree()
    loadChildren()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('删除将无法恢复，是否继续？', async () => {
    await areaApi.remove(row.id)
    refreshTree()
    loadChildren()
  }, { title: '温馨提示', success: '删除成功' })

// ===== 批量新增 =====
const batchDialog = reactive({ visible: false })
const batchForm = reactive({ countryId: '', name: '' })
const batchData = ref([])
const openBatch = () => {
  batchForm.countryId = ''
  batchForm.name = ''
  batchData.value = []
  batchDialog.visible = true
}
// 模拟按英文名称生成候选城市（对齐源 getCityName）
const genBatch = () => {
  if (!batchForm.countryId) return ElMessage.error('国家不能为空')
  if (!batchForm.name) return ElMessage.error('英文名称不能为空')
  batchData.value = Array.from({ length: 3 }, (_, i) => ({
    name: `${batchForm.name}${i + 1}`, abbr: `${batchForm.name.slice(0, 2)}${i + 1}`, alias: `${batchForm.name}-${i + 1}`
  }))
}
const confirmBatch = async () => {
  if (!batchData.value.length || !batchData.value.every(it => it.name && it.abbr && it.alias)) {
    return ElMessage.error('暂无数据或数据不完整')
  }
  const parent = currentNode.value
  const rows = batchData.value.map(it => ({
    parentId: parent ? parent.id : 0,
    level: parent ? parent.level + 1 : 1,
    code: '', name: it.name, abbr: it.abbr, alias: it.alias
  }))
  await areaApi.res.bulkAdd(rows)
  ElMessage.success('批量新增成功')
  batchDialog.visible = false
  refreshTree()
  loadChildren()
}

onMounted(() => {
  refreshTree()
  loadChildren()
})
</script>

<style scoped lang="scss">
.area-page {
  display: flex;
  gap: $space-md;
  min-height: calc(100vh - 140px);
}
.area-tree {
  width: 300px;
  flex-shrink: 0;
  background: $bg-card;
  border-radius: $card-radius;
  box-shadow: $shadow-sm;
  padding: $space-md;
  overflow: auto;
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-md;
    font-weight: 600;
  }
}
.area-main { flex: 1; min-width: 0; }
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-sm;
}
.area-tip { color: $text-secondary; font-size: $font-sm; margin-bottom: $space-sm; }
</style>
