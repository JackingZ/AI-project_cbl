<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="handleAddLevel">新增库区</el-button>
      <el-button :disabled="!can('export')" @click="openExport">导出库位码</el-button>
    </div>

    <el-table :data="tree" row-key="id" border default-expand-all :tree-props="{ children: 'children' }" style="width: 100%">
      <el-table-column prop="code" label="库位编号" min-width="180" />
      <el-table-column label="类型" min-width="120">
        <template #default="{ row }">
          {{ LOC_TYPE[row.type] }}<span v-if="row.level === 1 && row.binType"> ({{ binName(row.binType) }})</span>
        </template>
      </el-table-column>
      <el-table-column label="限制货物类型" min-width="120">
        <template #default="{ row }">{{ LOC_LIMIT[row.limitType] || '--' }}</template>
      </el-table-column>
      <el-table-column prop="serviceName" label="服务类型" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.serviceName || '--' }}</template>
      </el-table-column>
      <el-table-column prop="custName" label="分配客户" min-width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.custName || '--' }}</template>
      </el-table-column>
      <el-table-column label="商品规则" min-width="110">
        <template #default="{ row }">{{ LOC_RULE[row.rule] || '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.type !== '5' && row.binType === 20 && can('add')" link type="primary" size="small" @click="handleAdd(row)">新增{{ LOC_TYPE[String(Number(row.type) + 1)] }}</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑库位（对齐 locationForm 分支字段） -->
    <Modal v-model="dlg.visible" :title="dlg.title" width="560px" :confirm-loading="dlg.loading" @confirm="saveConfirm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="库位编号" prop="code"><el-input v-model="form.code" :maxlength="50" placeholder="请输入库位编号" /></el-form-item>
        <el-form-item v-if="form.type === '1'" label="库区类型" prop="binType">
          <el-select v-model="form.binType" :disabled="dlg.isEdit" placeholder="请选择" style="width: 100%">
            <el-option v-for="b in BIN_TYPE_LIST" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="限制货物类型">
          <el-select v-model="form.limitType" clearable placeholder="请选择" style="width: 100%">
            <el-option label="带电" :value="1" />
            <el-option label="带磁" :value="2" />
            <el-option label="液体" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type !== '5'" label="服务类型">
          <el-input v-model="form.serviceName" readonly placeholder="请选择服务类型">
            <template #append><el-button :icon="Search" @click="svcDlg = true" /></template>
          </el-input>
        </el-form-item>
        <!-- 分配客户：源整块（el-input+穿梭）已注释，保持注释 -->
        <!-- <el-form-item label="分配客户"><el-input v-model="form.custName" readonly /></el-form-item> -->
        <el-form-item v-if="form.type === '3'" label="货架位置" prop="position">
          <el-select v-model="form.position" placeholder="请选择" style="width: 100%">
            <el-option label="巷道左边" :value="1" />
            <el-option label="巷道右边" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === '5'" label="商品规则">
          <el-select v-model="form.rule" clearable placeholder="请选择" style="width: 100%">
            <el-option label="一位一品" :value="1" />
            <el-option label="一位多品" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 服务类型穿梭 -->
    <Modal v-model="svcDlg" title="服务类型" width="560px" @confirm="confirmSvc">
      <el-transfer v-model="svcSel" :data="SVC_DATA" :titles="['服务类型', '已选择']" filterable />
    </Modal>

    <!-- 导出库位码（对齐 codeForm：导出方式二选一） -->
    <Modal v-model="exp.visible" title="导出库位码" width="440px" @confirm="doExport">
      <el-form label-width="90px">
        <el-form-item label="导出方式" class="is-required">
          <el-select v-model="exp.measure" placeholder="请选择" style="width: 100%">
            <el-option label="下载库位条码压缩包" :value="1" />
            <el-option label="导出库位条码PDF" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { Plus, Search } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { usePagePerms } from '@/utils/hooks'
import { confirmDelete } from '@/utils/index'
import { required } from '@/utils/validate'
import { wcLocationApi, BIN_TYPE_LIST, LOC_TYPE, LOC_LIMIT, LOC_RULE, WC_SERVICES } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' }, wsNm: { type: String, default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const flat = ref([])
const SVC_DATA = WC_SERVICES.map((s, i) => ({ key: i + 1, label: s }))
const binName = v => BIN_TYPE_LIST.find(b => b.id === v)?.name || ''

// 由扁平数据组装树（parentId=0 为库区根）
const tree = computed(() => {
  const map = {}, roots = []
  flat.value.forEach(n => { map[n.id] = { ...n, children: [] } })
  flat.value.forEach(n => {
    if (n.parentId && map[n.parentId]) map[n.parentId].children.push(map[n.id])
    else roots.push(map[n.id])
  })
  const prune = arr => arr.forEach(x => { if (!x.children.length) delete x.children; else prune(x.children) })
  prune(roots)
  return roots
})

const load = async () => {
  const res = await wcLocationApi.res.list(o => o.warehouseId === Number(props.wsId))
  flat.value = res.data || res
}
watch(() => props.wsId, load, { immediate: true })

/* 新增/编辑 */
const formRef = ref(null)
const dlg = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({ code: '', binType: '', limitType: '', serviceName: '', custName: '', rule: '', position: '', type: '1', level: 1, parentId: 0, warehouseId: props.wsId })
const form = reactive(defaultForm())
const rules = computed(() => {
  const r = { code: [required('请输入库位编号')] }
  if (form.type === '1') r.binType = [required('请选择库区类型', 'change')]
  if (form.type === '3') r.position = [required('请选择货架位置', 'change')]
  return r
})
const reset = () => Object.assign(form, defaultForm())

// 新增库区（level1）
const handleAddLevel = () => {
  reset()
  Object.assign(form, { type: '1', level: 1, parentId: 0 })
  Object.assign(dlg, { visible: true, title: '新增库区', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
// 新增下级（type+1）
const handleAdd = row => {
  reset()
  const nextType = String(Number(row.type) + 1)
  Object.assign(form, { type: nextType, level: row.level + 1, parentId: row.id })
  Object.assign(dlg, { visible: true, title: `新增${LOC_TYPE[nextType]}`, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const handleEdit = row => {
  reset()
  Object.keys(form).forEach(k => { if (row[k] !== undefined) form[k] = row[k] })
  Object.assign(dlg, { visible: true, title: `编辑${LOC_TYPE[row.type]}`, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const saveConfirm = async () => {
  await formRef.value.validate()
  dlg.loading = true
  try {
    if (dlg.isEdit) await wcLocationApi.update(dlg.id, { ...form })
    else await wcLocationApi.add({ ...form })
    ElMessage.success(dlg.isEdit ? '修改成功' : '新增成功')
    dlg.visible = false
    load()
  } finally { dlg.loading = false }
}
const handleDelete = row => confirmDelete(async () => { await wcLocationApi.remove(row.id); load() }, '确定删除该库位吗？')

/* 服务类型穿梭 */
const svcDlg = ref(false)
const svcSel = ref([])
const confirmSvc = () => {
  form.serviceName = SVC_DATA.filter(d => svcSel.value.includes(d.key)).map(d => d.label).join(',')
  svcDlg.value = false
}

/* 导出库位码 */
const exp = reactive({ visible: false, measure: 1 })
const openExport = () => { exp.visible = true }
const doExport = () => {
  const lines = flat.value.map(n => `${n.code}\t${LOC_TYPE[n.type]}`).join('\n')
  const name = exp.measure === 1 ? `${props.wsNm || '仓库'}-库位条码.txt` : `${props.wsNm || '仓库'}-库位条码PDF.txt`
  const blob = new Blob([`库位编号\t类型\n${lines}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  URL.revokeObjectURL(url)
  exp.visible = false
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; display: flex; gap: 8px; }
</style>
