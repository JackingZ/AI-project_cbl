<template>
  <div>
    <PageCard>
      <div class="op-toolbar">
        <el-button type="primary" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增配置</el-button>
        <div class="op-filters">
          <el-select v-model="query.type" placeholder="验货方式" clearable filterable style="width: 130px">
            <el-option v-for="t in EXAMINE_TYPE" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <el-input v-model="query.name" :maxlength="20" placeholder="验货配置名称" style="width: 180px" />
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
        :action-width="180"
        @change="loadData"
      >
        <template #col-type="{ row }">{{ typeLabel(row.type) }}</template>
        <template #col-degree="{ row }">{{ degreeText(row.degreeArr) }}</template>
        <template #col-pick="{ row }">{{ row.pick === '0' ? '随机' : '指定' }}</template>
        <template #col-size="{ row }">{{ row.size ? '是' : '否' }}</template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑验货配置' : '新增验货配置'" width="1000px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px" class="examine-form">
        <el-form-item label="验货配置名称" prop="name">
          <el-input v-model="form.name" :maxlength="20" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="验货方式" prop="type">
          <el-select v-model="form.type" clearable filterable placeholder="请选择" style="width: 100%" @change="form.ratio = undefined">
            <el-option v-for="t in EXAMINE_TYPE" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.type === '2'" label="验货比例" prop="ratio">
          <el-input v-model="form.ratio" placeholder="请输入">
            <template #append>%</template>
          </el-input>
        </el-form-item>
        <el-form-item label="验货程度" prop="degreeArr">
          <el-select v-model="form.degreeArr" multiple collapse-tags clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="d in EXAMINE_DEGREE" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="验货图片保留" prop="retain">
          <el-select v-model="form.retain" clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="t in EXAMINE_IMGTIME" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="需检验项" prop="itemsArr">
          <el-select v-model="form.itemsArr" multiple collapse-tags clearable placeholder="请选择" style="width: 100%">
            <el-option v-for="it in EXAMINE_ITEMS" :key="it.id" :label="it.name" :value="it.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="查验MadeInChina" prop="micArr">
          <el-checkbox-group v-model="form.micArr">
            <el-checkbox v-for="m in EXAMINE_MIC" :key="m.id" :value="m.id">{{ m.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="外箱查验" prop="boxArr">
          <el-checkbox-group v-model="form.boxArr">
            <el-checkbox v-for="c in EXAMINE_CHECK" :key="c.id" :value="c.id">{{ c.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="产品查验" prop="goodsArr">
          <el-checkbox-group v-model="form.goodsArr">
            <el-checkbox v-for="c in EXAMINE_CHECK" :key="c.id" :value="c.id">{{ c.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="抽箱方式" prop="pick">
          <el-radio-group v-model="form.pick">
            <el-radio value="0">随机</el-radio>
            <el-radio value="1">指定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否验证订单尺寸" prop="size">
          <el-radio-group v-model="form.size">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否查验超重标" prop="overweight">
          <el-radio-group v-model="form.overweight">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否查验带电标" prop="electrified">
          <el-radio-group v-model="form.electrified">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否查验危险品标" prop="danger">
          <el-radio-group v-model="form.danger">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否允许编织袋" prop="bag">
          <el-radio-group v-model="form.bag">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否允许捆绑" prop="binding">
          <el-radio-group v-model="form.binding">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { confirmThen } from '@/utils'
import {
  examineApi, EXAMINE_TYPE, EXAMINE_DEGREE, EXAMINE_ITEMS, EXAMINE_CHECK, EXAMINE_MIC, EXAMINE_IMGTIME
} from '@/api/modules/operation'

defineOptions({ name: 'OpExamine' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch } = useListQuery(examineApi.list, { name: '', type: '' })

const columns = [
  { prop: 'name', label: '验货配置名称', minWidth: 130 },
  { prop: 'type', label: '验货方式', width: 120 },
  { prop: 'degree', label: '验货程度', minWidth: 200 },
  { prop: 'pick', label: '抽箱方式', width: 120 },
  { prop: 'size', label: '是否验证尺寸', width: 150 }
]
const typeLabel = v => EXAMINE_TYPE.find(t => t.value === v)?.label || ''
const degreeText = arr => (arr || []).map(id => EXAMINE_DEGREE.find(d => d.id === id)?.name).filter(Boolean).join(',')

// 验货比例 1-100 正整数
const ratioRule = {
  validator: (r, v, cb) => (v && !/^([1-9]\d{0,1}|100)$/.test(v)) ? cb(new Error('比例为1-100的正整数')) : cb(),
  trigger: 'blur'
}
const rules = {
  name: [required('验货配置名称不能为空')],
  ratio: [ratioRule]
}

const defaultForm = () => ({
  name: '', type: undefined, ratio: undefined, degreeArr: [], retain: undefined, itemsArr: [],
  micArr: [], boxArr: [], goodsArr: [], pick: '0', size: false,
  overweight: false, electrified: false, danger: false, bag: false, binding: false
})
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false, isEdit: false, id: null })
const form = reactive(defaultForm())

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, {
    ...defaultForm(),
    name: row.name, type: row.type, ratio: row.ratio,
    degreeArr: [...(row.degreeArr || [])], retain: row.retain, itemsArr: [...(row.itemsArr || [])],
    micArr: [...(row.micArr || [])], boxArr: [...(row.boxArr || [])], goodsArr: [...(row.goodsArr || [])],
    pick: row.pick, size: row.size, overweight: row.overweight, electrified: row.electrified,
    danger: row.danger, bag: row.bag, binding: row.binding
  })
  Object.assign(dialog, { visible: true, isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    const payload = { ...form }
    if (dialog.isEdit) {
      await examineApi.update(dialog.id, payload)
    } else {
      await examineApi.add(payload)
    }
    ElMessage.success('保存成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const remove = row =>
  confirmThen('请确认是否删除该条数据?', async () => { await examineApi.remove(row.id); loadData() },
    { title: '温馨提示', success: '删除成功' })
</script>

<style scoped lang="scss">
.op-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $space-md;
  margin-bottom: $space-md;
}
.op-filters { display: flex; gap: $space-sm; }
.examine-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.5%; }
}
</style>
