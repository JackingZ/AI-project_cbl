<template>
  <PageCard>
    <el-tabs v-model="chargeType" @tab-change="onType">
      <el-tab-pane label="重量计费" name="0" />
      <el-tab-pane label="体积计费" name="1" />
    </el-tabs>

    <div class="cc-bar">
      <el-button v-if="can('add')" type="primary" link :icon="CirclePlus" @click="openAdd">新增</el-button>
      <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
    </div>

    <!-- 重量计费列表 -->
    <el-table v-if="chargeType === '0'" v-loading="loading" :data="list" border style="width: 100%; margin: 10px 0">
      <el-table-column label="计费方式名称" prop="name" min-width="140" show-overflow-tooltip />
      <el-table-column label="计量误差率" prop="deviation" width="100" />
      <el-table-column label="体积比" prop="vw" width="100" />
      <el-table-column label="结算重量算法" min-width="200">
        <template #default="{ row }">{{ lookup(ALGORITHM_LIST, row.algorithm) }}</template>
      </el-table-column>
      <el-table-column label="多件重量算法" min-width="140">
        <template #default="{ row }">
          <span v-if="row.algorithm === '1'">{{ lookup(MULTI_WEIGHT_LIST, row.multiWeight) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="分泡比率" prop="bulky" width="100">
        <template #default="{ row }"><span v-if="row.bubble">{{ row.bulky }}</span><span v-else>--</span></template>
      </el-table-column>
      <el-table-column label="分泡条件" min-width="220">
        <template #default="{ row }">
          <div v-if="row.bubble">
            <div v-if="row.bubbleRule1Check && Number.isFinite(row.bubbleRule1)">总实重 ≥ {{ row.bubbleRule1 }}kg</div>
            <div v-if="row.bubbleRule2Check && Number.isFinite(row.bubbleRule2)">单票货物 1m³ >= {{ row.bubbleRule2 }}kg且1m³ ＜ 167kg</div>
          </div>
          <div v-else>--</div>
        </template>
      </el-table-column>
      <el-table-column label="单箱重量" prop="sbmc" width="90" />
      <el-table-column label="单票重量" prop="simc" width="90" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <template v-if="isBuiltin(row)"><span style="color: #aaa">系统内置</span></template>
          <template v-else>
            <el-button v-if="can('edit')" link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="can('del')" link type="danger" size="small" @click="removeRow(row.id)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 体积计费列表 -->
    <el-table v-else v-loading="loading" :data="list" border style="width: 100%; margin: 10px 0">
      <el-table-column label="计费方式名称" prop="name" min-width="140" show-overflow-tooltip />
      <el-table-column label="计量误差率" prop="deviation" />
      <!-- <el-table-column label="体积重单位" prop="vw" /> -->
      <el-table-column label="体积密度" prop="density" />
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <template v-if="isBuiltin(row)"><span style="color: #aaa">系统内置</span></template>
          <template v-else>
            <el-button v-if="can('edit')" link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="can('del')" link type="danger" size="small" @click="removeRow(row.id)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div style="text-align: right">
      <el-pagination v-model:current-page="query.page" :page-size="query.size" layout="total, prev, pager, next" :total="total" @current-change="loadData" />
    </div>

    <Modal v-model="dialog.visible" :title="dialog.title" width="600px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" size="small" style="max-height: 450px; overflow-y: auto; padding-right: 20px">
        <el-form-item label="计费方式名称" prop="name">
          <el-input v-model="form.name" :maxlength="25" placeholder="请输入" show-word-limit />
        </el-form-item>
        <el-form-item label="计量误差率(%)" prop="deviation">
          <el-input-number v-model="form.deviation" :controls="false" :min="0" :max="100" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '0'" label="体积比" prop="vw">
          <el-input-number v-model="form.vw" :controls="false" :min="0" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '1'" label="体积密度" prop="density">
          <el-input-number v-model="form.density" :controls="false" :min="0" :max="9999" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '0'" label="结算重量算法" prop="algorithm">
          <el-select v-model="form.algorithm" placeholder="请选择" clearable style="width: 100%" @change="onAlgorithm">
            <el-option v-for="a in ALGORITHM_LIST" :key="a.id" :label="a.name" :value="a.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="chargeType === '0' && form.algorithm === '1'" label="多件重量算法" prop="multiWeight">
          <el-select v-model="form.multiWeight" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="m in MULTI_WEIGHT_LIST" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="chargeType === '0' && form.algorithm === '1'" label="是否分泡" prop="bubble">
          <el-radio-group v-model="form.bubble" @change="onBulky">
            <el-radio-button :value="true">是</el-radio-button>
            <el-radio-button :value="false">否</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <div v-if="chargeType === '0' && form.algorithm === '1' && form.bubble">
          <div class="input-content">
            <el-checkbox v-model="form.bubbleRule1Check" style="margin-right: 5px" />
            <div style="padding-right: 20px">分泡条件1</div>
            <div>总实重&nbsp;≥&nbsp;</div>
            <el-input-number v-model="form.bubbleRule1" class="input-number-stardard" size="small" :controls="false" placeholder="请输入" :min="0" :max="999999" />
            <div class="input-unit">kg</div>
          </div>
          <div class="input-content">
            <el-checkbox v-model="form.bubbleRule2Check" style="margin-right: 5px" />
            <div style="padding-right: 20px">分泡条件2</div>
            <div>单票货物&nbsp;1m³&nbsp;≥&nbsp;</div>
            <el-input-number v-model="form.bubbleRule2" class="input-number-stardard" size="small" :controls="false" placeholder="请输入" :min="0" :max="999999" />
            <div class="input-unit">kg</div>
            <div>&nbsp;并且&nbsp;1m³&nbsp;＜&nbsp;167kg</div>
          </div>
        </div>
        <el-form-item v-if="chargeType === '0' && form.algorithm === '1' && form.bubble" label="分泡比率(%)" prop="bulky">
          <el-input-number v-model="form.bulky" :controls="false" :min="0" :max="100" :precision="2" placeholder="请输入" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '0'" label="单箱最低重量" prop="sbmc">
          <el-input-number v-model="form.sbmc" :controls="false" :min="0" :max="9999" :precision="2" placeholder="最低收费重量" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '0'" label="单票最低重量" prop="simc">
          <el-input-number v-model="form.simc" :controls="false" :min="0" :max="9999" :precision="2" placeholder="最低收费重量" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="chargeType === '0'" label="重量进位" prop="weightCarry" style="display: inline-block; width: 49.5%">
          <el-radio-group v-model="form.weightCarry" @change="onScale">
            <el-radio-button :value="true">是</el-radio-button>
            <el-radio-button :value="false">否</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="chargeType === '0' && form.weightCarry" label="进位规则" prop="weightCarryRule" style="display: inline-block; width: 49.5%">
          <el-radio-group v-model="form.weightCarryRule">
            <el-radio-button :value="0.5">按0.5</el-radio-button>
            <el-radio-button :value="1">按1</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <div v-if="chargeType === '0' && form.weightCarry && form.weightCarryRule === 0.5" class="scale-tip">
          例：重量10.01kg时算10.5，重量10.6kg时算11，重量10.5时算10.5
        </div>
        <div v-if="chargeType === '0' && form.weightCarry && form.weightCarryRule === 1" class="scale-tip">
          例：重量向上取整，10.01kg时算11kg
        </div>
      </el-form>
    </Modal>
  </PageCard>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { confirmDelete } from '@/utils/index'
import { usePagePerms } from '@/utils/hooks'
import { chargeApi, ALGORITHM_LIST, MULTI_WEIGHT_LIST, lookup } from '@/api/modules/price'

defineOptions({ name: 'PriceCharge' })
const { can } = usePagePerms()

const chargeType = ref('0')
const list = ref([])
const total = ref(0)
const loading = ref(false)
const query = reactive({ page: 1, size: 10 })

// 系统内置：agent.key === '0' 且当前公司非聚货通时不可编辑；此处 mock 简化为 agent.key==='0' 即内置
const isBuiltin = row => (row.agent || {}).key === '0'

const loadData = async () => {
  loading.value = true
  try {
    const res = await chargeApi.getList({ type: chargeType.value, page: query.page, size: query.size })
    list.value = res.data.list
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}
const handleSearch = () => { query.page = 1; loadData() }
const onType = () => { list.value = []; query.page = 1; loadData() }

const formRef = ref(null)
const dialog = reactive({ visible: false, title: '', loading: false, isEdit: false, id: null })
const defaultForm = () => ({
  name: undefined, deviation: undefined, vw: undefined, density: undefined,
  algorithm: undefined, multiWeight: undefined, bulky: undefined,
  sbmc: undefined, simc: undefined, bubble: false,
  bubbleRule1Check: false, bubbleRule2Check: false, bubbleRule1: undefined, bubbleRule2: undefined,
  weightCarry: true, weightCarryRule: 0.5
})
const form = reactive(defaultForm())
const rules = {
  name: [required('计费方式名称不能为空')],
  deviation: [required('计量误差率不能为空')],
  vw: [required('体积比不能为空')],
  density: [required('体积密度不能为空')],
  algorithm: [required('请选择结算重量算法', 'change')],
  multiWeight: [required('请选择多件重量算法', 'change')],
  bulky: [required('分泡比率不能为空')],
  sbmc: [required('单箱重量不能为空')],
  simc: [required('单票重量不能为空')]
}

const onAlgorithm = () => {
  if (form.algorithm !== '1') { form.multiWeight = undefined; form.bubble = false; onBulky() }
}
const onBulky = () => {
  form.bubbleRule1Check = false; form.bubbleRule1 = undefined
  form.bubbleRule2Check = false; form.bubbleRule2 = undefined; form.bulky = undefined
}
const onScale = () => { form.weightCarryRule = form.weightCarry ? 0.5 : undefined }

const openAdd = () => {
  Object.assign(form, defaultForm())
  Object.assign(dialog, { visible: true, title: '新增计费方式', isEdit: false, id: null })
  formRef.value?.clearValidate()
}
const openEdit = row => {
  Object.assign(form, defaultForm(), { ...row })
  Object.assign(dialog, { visible: true, title: '编辑计费方式', isEdit: true, id: row.id })
  formRef.value?.clearValidate()
}
const submit = async () => {
  await formRef.value.validate()
  const { algorithm, bubble, bubbleRule1, bubbleRule2, bubbleRule1Check, bubbleRule2Check } = form
  if (chargeType.value === '0' && algorithm === '1' && bubble) {
    if (!bubbleRule1Check && !bubbleRule2Check) return ElMessage.error('请至少选择一个分泡条件')
    if (bubbleRule1Check && !Number.isFinite(bubbleRule1)) return ElMessage.error('分泡条件1，总实重不能为空')
    if (bubbleRule2Check && !Number.isFinite(bubbleRule2)) return ElMessage.error('分泡条件2，单票货物重不能为空')
    if (bubbleRule2Check && bubbleRule2 > 167) return ElMessage.error('分泡条件2，单票货物重不能大于167kg')
  }
  dialog.loading = true
  try {
    const payload = { ...form, type: chargeType.value, agent: { key: 'C1', value: '聚货通' } }
    if (dialog.isEdit) payload.id = dialog.id
    await chargeApi.save(payload)
    ElMessage.success('保存成功!')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}
const removeRow = id => confirmDelete(async () => { await chargeApi.remove(id); loadData() }, '请确认是否删除该条数据?')

loadData()
</script>

<style scoped lang="scss">
.cc-bar { display: flex; align-items: center; justify-content: space-between; }
.input-content { display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; margin: 0 0 18px 50px; }
.input-number-stardard { width: 90px; }
.input-unit {
  height: 32px; line-height: 32px; background-color: #f5f7fa; color: #909399;
  padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 0 4px 4px 0; margin-left: -1px;
}
.scale-tip {
  margin-left: 40px; padding-left: 10px; border-radius: 4px; background: #f2f3f5;
  font-size: 12px; color: #666; line-height: 26px; margin-bottom: 12px;
}
</style>
