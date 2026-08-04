<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <div class="op-filters">
          <el-select v-model="query.serviceTypeId" placeholder="服务大类" filterable clearable style="width: 130px">
            <el-option v-for="s in SERVICE_TYPES" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-input v-model="query.name" placeholder="请输入" style="width: 280px">
            <template #prepend>下单配置</template>
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
        :action-width="1"
        @change="loadData"
      >
        <template #col-serviceName="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openServiceName(row)">服务名称</el-button>
        </template>
        <template #col-serviceProject="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openAdded(row)">服务项目</el-button>
        </template>
        <template #col-additionalService="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('view')" @click="openAdditional(row)">附加服务</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 服务名称弹窗 -->
    <Modal v-model="nameDialog.visible" title="服务名称" width="600px" @confirm="saveServiceName">
      <el-form ref="nameFormRef" :model="nameForm" :rules="nameRules" label-width="120px">
        <el-form-item label="服务名称" prop="serviceId">
          <el-select v-model="nameForm.serviceId" placeholder="请选择" style="width: 100%">
            <el-option v-for="s in PLO_SERVICE_NAMES" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 服务项目关联弹窗 -->
    <el-dialog v-model="addedDialog.visible" title="服务项目" width="960px" :close-on-click-modal="false">
      <el-button type="primary" link :icon="Plus" :disabled="!can('add')" @click="openItemForm('added')">新增服务项目</el-button>
      <el-table :data="addedList" height="450" border style="width: 100%; margin: 10px 0">
        <el-table-column prop="itemName" label="服务项目" />
        <el-table-column label="是否上传附件" width="140">
          <template #default="s">{{ s.row.attachment ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="附件是否必传" width="140">
          <template #default="s">{{ s.row.required ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="服务标识" width="140">
          <template #default="s">{{ s.row.type === '0' ? '标准服务' : '增值服务' }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="s">
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="editItem('added', s.$index)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="removeItem('added', s.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 附加服务关联弹窗（无服务标识列） -->
    <el-dialog v-model="additionalDialog.visible" title="附加服务" width="960px" :close-on-click-modal="false">
      <el-button type="primary" link :icon="Plus" :disabled="!can('add')" @click="openItemForm('additional')">新增附加服务</el-button>
      <el-table :data="additionalList" height="450" border style="width: 100%; margin: 10px 0">
        <el-table-column prop="itemName" label="附加服务" />
        <el-table-column label="是否上传附件" width="140">
          <template #default="s">{{ s.row.attachment ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="附件是否必传" width="140">
          <template #default="s">{{ s.row.required ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="s">
            <el-button link type="primary" size="small" :disabled="!can('edit')" @click="editItem('additional', s.$index)">编辑</el-button>
            <el-button link type="danger" size="small" :disabled="!can('del')" @click="removeItem('additional', s.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 服务项目/附加服务 新增编辑行弹窗 -->
    <Modal v-model="itemDialog.visible" :title="itemDialogTitle" width="600px" append-to-body @confirm="saveItem">
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="130px">
        <el-form-item :label="itemDialog.kind === 'added' ? '服务项目' : '附加服务'" prop="itemId">
          <el-select v-model="itemForm.itemId" placeholder="请选择" style="width: 100%">
            <el-option v-for="o in (itemDialog.kind === 'added' ? PLO_SERVICE_ITEMS : PLO_ADDITIONAL_ITEMS)" :key="o.id" :label="o.name" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否上传附件" prop="attachment">
          <el-radio-group v-model="itemForm.attachment">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="itemForm.attachment" label="附件是否必传" prop="required">
          <el-radio-group v-model="itemForm.required">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="itemDialog.kind === 'added'" label="服务标识" prop="type">
          <el-radio-group v-model="itemForm.type">
            <el-radio value="0">标准服务</el-radio>
            <el-radio value="1">增值服务</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import {
  orderTypeApi, SERVICE_TYPES, PLO_SERVICE_NAMES, PLO_SERVICE_ITEMS, PLO_ADDITIONAL_ITEMS
} from '@/api/modules/operation'

defineOptions({ name: 'OpOrderType' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(orderTypeApi.list, { serviceTypeId: '', name: '' })

const columns = [
  { prop: 'serviceTypeName', label: '服务大类', minWidth: 140 },
  { prop: 'name', label: '下单配置', minWidth: 140 },
  { prop: 'serviceName', label: '服务名称', width: 120 },
  { prop: 'serviceProject', label: '服务项目', width: 120 },
  { prop: 'additionalService', label: '附加服务', width: 120 },
  { prop: 'remark', label: '备注', minWidth: 120 },
  { prop: 'updateTime', label: '最后更新时间', width: 170 }
]

// ===== 服务名称 =====
const nameFormRef = ref(null)
const nameDialog = reactive({ visible: false, id: null })
const nameForm = reactive({ serviceId: undefined })
const nameRules = { serviceId: [required('请选择服务名称', 'change')] }
const openServiceName = row => {
  nameDialog.id = row.id
  nameForm.serviceId = PLO_SERVICE_NAMES.find(s => s.name === row.serviceName)?.id
  nameDialog.visible = true
  nameFormRef.value?.clearValidate()
}
const saveServiceName = async () => {
  await nameFormRef.value.validate()
  const serviceName = PLO_SERVICE_NAMES.find(s => s.id === nameForm.serviceId)?.name || ''
  await orderTypeApi.update(nameDialog.id, { serviceName })
  ElMessage.success('操作成功')
  nameDialog.visible = false
  loadData()
}

// ===== 服务项目 / 附加服务 关联 =====
const addedDialog = reactive({ visible: false, id: null })
const additionalDialog = reactive({ visible: false, id: null })
const addedList = ref([])
const additionalList = ref([])
const currentRow = ref(null)

const openAdded = row => {
  currentRow.value = row
  addedDialog.id = row.id
  addedList.value = [...(row.addedItems || [])]
  addedDialog.visible = true
}
const openAdditional = row => {
  currentRow.value = row
  additionalDialog.id = row.id
  additionalList.value = [...(row.additionalItems || [])]
  additionalDialog.visible = true
}

// 行新增/编辑弹窗
const itemFormRef = ref(null)
const itemDialog = reactive({ visible: false, kind: 'added', index: -1 })
const itemDialogTitle = computed(() => {
  const label = itemDialog.kind === 'added' ? '服务项目' : '附加服务'
  return (itemDialog.index >= 0 ? '编辑' : '新增') + label
})
const defaultItem = () => ({ itemId: undefined, attachment: false, required: false, type: '0' })
const itemForm = reactive(defaultItem())
const itemRules = {
  itemId: [required('请选择', 'change')],
  attachment: [{ required: true, message: '请选择是否上传附件', trigger: 'change' }],
  type: [{ required: true, message: '请选择服务标识', trigger: 'change' }]
}
const openItemForm = kind => {
  itemDialog.kind = kind
  itemDialog.index = -1
  Object.assign(itemForm, defaultItem())
  itemDialog.visible = true
  itemFormRef.value?.clearValidate()
}
const editItem = (kind, index) => {
  itemDialog.kind = kind
  itemDialog.index = index
  const src = kind === 'added' ? addedList.value[index] : additionalList.value[index]
  Object.assign(itemForm, { itemId: src.itemId, attachment: src.attachment, required: src.required, type: src.type })
  itemDialog.visible = true
  itemFormRef.value?.clearValidate()
}
const removeItem = async (kind, index) => {
  const listRef = kind === 'added' ? addedList : additionalList
  listRef.value.splice(index, 1)
  await persist(kind)
}
const saveItem = async () => {
  await itemFormRef.value.validate()
  const opts = itemDialog.kind === 'added' ? PLO_SERVICE_ITEMS : PLO_ADDITIONAL_ITEMS
  const itemName = opts.find(o => o.id === itemForm.itemId)?.name || ''
  const record = {
    itemId: itemForm.itemId, itemName,
    attachment: itemForm.attachment,
    required: itemForm.attachment ? itemForm.required : false,
    type: itemDialog.kind === 'added' ? itemForm.type : '2'
  }
  const listRef = itemDialog.kind === 'added' ? addedList : additionalList
  if (itemDialog.index >= 0) listRef.value.splice(itemDialog.index, 1, record)
  else listRef.value.push(record)
  await persist(itemDialog.kind)
  ElMessage.success('操作成功')
  itemDialog.visible = false
}
// 关联变更落库
const persist = async kind => {
  if (kind === 'added') {
    await orderTypeApi.update(addedDialog.id, { addedItems: [...addedList.value] })
  } else {
    await orderTypeApi.update(additionalDialog.id, { additionalItems: [...additionalList.value] })
  }
  loadData()
}
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
</style>
