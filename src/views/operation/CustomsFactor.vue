<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
        <div class="op-filters">
          <el-select v-model="query.countryId" placeholder="国家" clearable filterable style="width: 130px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
          <el-select v-model="query.enabled" placeholder="状态" clearable filterable style="width: 130px">
            <el-option label="启用" value="0" />
            <el-option label="禁用" value="1" />
          </el-select>
          <el-input v-model="query.keyword" placeholder="请输入内容" style="width: 250px">
            <template #prepend>
              <el-select v-model="query.keyType" style="width: 110px">
                <el-option label="中文名称" value="1" />
                <el-option label="英文名称" value="2" />
                <el-option label="海关编码" value="3" />
              </el-select>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </div>
      </div>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="130"
        @change="loadData"
      >
        <template #col-goodsName="{ row }">
          <div class="item-word">{{ row.cnName || '--' }}</div>
          <div class="item-word">{{ row.enName || '--' }}</div>
        </template>
        <template #col-customCode="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openCode(row)">海关编码</el-button>
        </template>
        <template #col-meterial="{ row }">
          <div class="item-word">{{ row.cnMeterial || '--' }}</div>
          <div class="item-word">{{ row.enMeterial || '--' }}</div>
        </template>
        <template #col-usage="{ row }">
          <div class="item-word">{{ row.cnUsage || '--' }}</div>
          <div class="item-word">{{ row.enUsage || '--' }}</div>
        </template>
        <template #col-deleted="{ row }">
          <el-switch
            :model-value="row.deleted === 0"
            active-text="启用" inactive-text="禁用"
            :disabled="!can('edit')"
            :before-change="() => beforeStatusChange(row)"
          />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openCopy(row)">复制</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialogTitle" width="960px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="factor-form">
        <el-form-item label="中文名称" prop="cnName">
          <el-input v-model="form.cnName" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="英文名称" prop="enName">
          <el-input v-model="form.enName" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="form.brand" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="form.model" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="材质中文">
          <el-input v-model="form.cnMeterial" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="材质英文">
          <el-input v-model="form.enMeterial" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="用途中文">
          <el-input v-model="form.cnUsage" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="用途英文">
          <el-input v-model="form.enUsage" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="备注" class="factor-form__full">
          <el-input v-model="form.remarks" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" :maxlength="100" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <Modal v-model="codeDialog.visible" title="海关编码" width="800px" @confirm="saveCode">
      <div class="code-form">
        <div v-for="(item, index) in sections" :key="index" class="code-row">
          <span class="code-row__label">国家:</span>
          <el-select v-model="item.countryId" filterable clearable placeholder="请选择" style="width: 180px">
            <el-option v-for="c in COUNTRY_OPTIONS" :key="c.id" :label="`${c.name}-${c.alias}`" :value="c.id" />
          </el-select>
          <span class="code-row__label">不包税:</span>
          <el-input v-model="item.customCode" :maxlength="20" style="width: 150px" />
          <span class="code-row__label">包税:</span>
          <el-input v-model="item.customCodeN" :maxlength="20" style="width: 150px" />
          <el-icon v-if="index === 0" class="code-row__icon" @click="addRange"><CirclePlus /></el-icon>
          <el-icon v-else class="code-row__icon" @click="removeRange(index)"><Remove /></el-icon>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus, CirclePlus, Remove } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required, noChineseRule } from '@/utils/validate'
import { factorApi, COUNTRY_OPTIONS } from '@/api/modules/operation'

defineOptions({ name: 'OpFactor' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(factorApi.list, {
  countryId: '', enabled: '', keyword: '', keyType: '1'
})

const columns = [
  { prop: 'goodsName', label: '商品名称(中文/英文)', minWidth: 180 },
  { prop: 'customCode', label: '海关编码', width: 100 },
  { prop: 'brand', label: '品牌', minWidth: 120 },
  { prop: 'model', label: '型号', minWidth: 120 },
  { prop: 'meterial', label: '材质(中文/英文)', minWidth: 180 },
  { prop: 'usage', label: '用途(中文/英文)', minWidth: 180 },
  { prop: 'remarks', label: '备注', minWidth: 180 },
  { prop: 'deleted', label: '启用状态', width: 150, fixed: 'right' }
]

const rules = {
  cnName: [required('商品中文名称不能为空')],
  enName: [required('商品英文名称不能为空'), noChineseRule('商品英文名称不能有中文')]
}

// 新增/编辑/复制 三态
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, mode: 'add', id: null }) // add|edit|copy
const dialogTitle = computed(() => ({ add: '新增报关要素', edit: '编辑报关要素', copy: '复制报关要素' }[dialog.mode]))
const defaultForm = () => ({ cnName: '', enName: '', brand: '', model: '', cnMeterial: '', enMeterial: '', cnUsage: '', enUsage: '', remarks: '' })
const form = reactive(defaultForm())

const pick = row => ({
  cnName: row.cnName, enName: row.enName, brand: row.brand, model: row.model,
  cnMeterial: row.cnMeterial, enMeterial: row.enMeterial, cnUsage: row.cnUsage, enUsage: row.enUsage, remarks: row.remarks
})
const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, mode: 'add', id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, pick(row))
  Object.assign(dialog, { visible: true, mode: 'edit', id: row.id })
  formRef.value?.clearValidate()
}
const openCopy = row => {
  Object.assign(form, pick(row))
  Object.assign(dialog, { visible: true, mode: 'copy', id: null })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    if (dialog.mode === 'edit') {
      await factorApi.update(dialog.id, { ...form })
    } else {
      // 新增/复制均落新记录
      await factorApi.add({ ...form, deleted: 0, codes: [] })
    }
    ElMessage.success('操作成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

// 启用状态开关（deleted 0启用/1禁用）：before-change 变更前确认，取消不变、初始化不触发
const beforeStatusChange = row => {
  const next = row.deleted === 0 ? 1 : 0
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(`此操作将${next === 1 ? '禁用' : '开启'}该报关要素，是否继续？`, '温馨提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
      await factorApi.update(row.id, { deleted: next })
      row.deleted = next
      ElMessage.success('操作成功')
      resolve(true)
    }).catch(() => reject(new Error('cancel')))
  })
}

// 海关编码动态 sections
const codeDialog = reactive({ visible: false, id: null })
const sections = ref([{ countryId: undefined, customCode: undefined, customCodeN: undefined }])
const openCode = row => {
  codeDialog.id = row.id
  const codes = row.codes || []
  sections.value = codes.length
    ? codes.map(c => ({ countryId: c.countryId, customCode: c.customCode, customCodeN: c.customCodeN }))
    : [{ countryId: undefined, customCode: undefined, customCodeN: undefined }]
  codeDialog.visible = true
}
const addRange = () => sections.value.push({ countryId: undefined, customCode: undefined, customCodeN: undefined })
const removeRange = i => sections.value.splice(i, 1)
const saveCode = async () => {
  const rows = sections.value
  if (!rows.every(it => it.countryId && it.customCode && it.customCodeN)) {
    return ElMessage.error('请填写完整国家和海关编码')
  }
  const ids = rows.map(it => it.countryId)
  if (new Set(ids).size < rows.length) {
    return ElMessage.error('国家不能重复')
  }
  await factorApi.update(codeDialog.id, { codes: rows.map(it => ({ ...it })) })
  ElMessage.success('操作成功')
  codeDialog.visible = false
  loadData()
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; flex-wrap: wrap; gap: $space-sm; justify-content: flex-end; }
.item-word { line-height: 1.4; }
.factor-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.9%; }
  &__full { width: 100% !important; }
}
.code-form { max-height: 400px; overflow-y: auto; }
.code-row {
  display: flex;
  align-items: center;
  gap: $space-xs;
  margin-bottom: $space-sm;
  &__label { color: $text-secondary; white-space: nowrap; }
  &__icon { font-size: 20px; cursor: pointer; color: var(--el-color-primary); }
}
</style>
