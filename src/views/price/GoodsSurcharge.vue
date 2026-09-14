<template>
  <div class="gs-wrap">
    <!-- 左侧：商品类别树 -->
    <div v-show="isActive" class="gs-slide" v-loading="isSideLoading">
      <div class="gs-slide__head">
        <span>商品类别</span>
        <!-- 报关类型/附加费类型 切换 + 所属国家筛选（源为注释，保留不放开）
        <el-select v-model="searchForm.type" placeholder="类别" size="small" @change="onType">
          <el-option label="报关类型" :value="1" />
          <el-option label="附加费类型" :value="2" />
        </el-select>
        <el-select v-if="searchForm.type === 1" v-model="searchForm.countryId" placeholder="所属国家" size="small" @focus="loadCountry" @change="onCountry">
          <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
        </el-select> -->
      </div>
      <el-tree
        ref="treeRef"
        :props="treeProps"
        :load="loadNode"
        lazy
        node-key="id"
        accordion
        highlight-current
        :expand-on-click-node="false"
        empty-text="暂无数据"
        @node-click="onTreeClick"
      />
    </div>
    <div class="gs-arrow" @click="isActive = !isActive">
      <el-icon><component :is="isActive ? ArrowLeft : ArrowRight" /></el-icon>
    </div>

    <!-- 右侧：类别列表 -->
    <div class="gs-main">
      <PageCard>
        <div class="gs-bar">
          <el-button v-if="currentNode && currentNode.level < 3 && can('add')" type="primary" link @click="openAddType">新增</el-button>
          <el-input v-model="search" placeholder="类别名称" clearable size="small" style="width: 250px" />
        </div>
        <el-table v-loading="loading" :data="tableData" border style="width: 100%; margin: 10px 0">
          <el-table-column label="类别名称" prop="title" min-width="150" show-overflow-tooltip />
          <el-table-column label="备注" prop="remarks" min-width="200" show-overflow-tooltip />
          <!-- 报关类型专用列（searchForm.type===1），当前固定附加费类型，保留结构
          <el-table-column v-if="searchForm.type === 1" label="是否全检产品" width="150">
            <template #default="{ row }"><span>{{ row.checked === 0 ? '是' : '否' }}</span></template>
          </el-table-column> -->
          <el-table-column label="设置附加费" width="120">
            <template #default="{ row }">
              <el-button v-if="currentNode && currentNode.level === 2" :disabled="!can('config')" link type="primary" size="small" @click="openSetCost(row)">设置附加费</el-button>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button v-if="can('edit')" link type="primary" size="small" @click="openEditType(row)">编辑</el-button>
              <el-button v-if="can('del')" link type="danger" size="small" @click="removeType(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="text-align: right">
          <el-pagination v-model:current-page="page" :page-size="size" layout="total, prev, pager, next" :total="total" />
        </div>
      </PageCard>
    </div>

    <!-- 新增/编辑商品类别 -->
    <Modal v-model="typeDlg.visible" :title="typeDlg.isEdit ? '编辑商品类别' : '新增商品类别'" width="600px" :confirm-loading="typeDlg.loading" @confirm="saveType">
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="120px" size="small">
        <el-form-item prop="title" label="类别名称"><el-input v-model="typeForm.title" :maxlength="50" /></el-form-item>
        <!-- 报关类型专用：是否全检产品，保留不放开
        <el-form-item v-if="searchForm.type === 1" label="是否全检产品" prop="checked">
          <el-radio-group v-model="typeForm.checked"><el-radio :value="1">否</el-radio><el-radio :value="0">是</el-radio></el-radio-group>
        </el-form-item> -->
        <el-form-item label="备注">
          <el-input v-model="typeForm.remarks" :maxlength="200" :autosize="{ minRows: 2, maxRows: 4 }" type="textarea" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 设置附加费 -->
    <Modal v-model="costDlg.visible" title="设置附加费" width="600px" :confirm-loading="costDlg.loading" @confirm="saveCost">
      <el-form ref="costFormRef" :model="costForm" label-width="90px" size="small" v-loading="costDlg.loading">
        <el-form-item label="计费单位" prop="billingUnit">
          <el-radio-group v-model="costForm.billingUnit" @change="onBillUnit">
            <el-radio v-for="u in BILLING_UNIT_LIST" :key="u.id" :value="u.id">{{ u.name }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="costForm.billingUnit !== 4" label="附加费(￥)" prop="sections">
          <div v-for="(item, index) in costForm.sections" :key="index" class="cost-row">
            <el-select v-model="item.countryId" placeholder="国家" filterable style="width: 200px">
              <el-option v-for="it in countryList" :key="it.id" :label="`${it.name}-${it.alias}`" :value="it.id" />
            </el-select>
            <el-input-number v-model="item.price" :controls="false" :min="0" :max="999999" :precision="2" placeholder="单价" style="width: 160px; margin-left: 10px" />
            <el-icon v-if="index === 0" class="cost-icon plus" @click="addRange"><CirclePlus /></el-icon>
            <el-icon v-else class="cost-icon reduce" @click="removeRange(index)"><Remove /></el-icon>
          </div>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { ArrowLeft, ArrowRight, CirclePlus, Remove } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import { surchargeApi, surchargeCostApi, getCountryOptions, BILLING_UNIT_LIST } from '@/api/modules/price'

defineOptions({ name: 'PriceSurcharge' })
const { can } = usePagePerms()

const isActive = ref(true)
const isSideLoading = ref(false)
const loading = ref(false)
const search = ref('')
const page = ref(1)
const size = ref(10)
const treeRef = ref(null)
const treeProps = { label: 'title', children: 'children', isLeaf: 'leaf' }
const searchForm = reactive({ type: 2, countryId: undefined, countryName: undefined })
const currentNode = ref({})
const list = ref([])
const countryList = ref([])

// 懒加载树：level 0 根「目录表」，其下按 parentId 拉子节点
const loadNode = async (node, resolve) => {
  currentNode.value = node
  if (node.level === 0) return resolve([{ id: 0, title: '目录表' }])
  const res = await surchargeApi.getProductList({ parentId: node.data.id, type: searchForm.type })
  const data = res.data || []
  list.value = data
  resolve(data)
}
const onTreeClick = (item, node) => {
  if (node.isLeaf) return
  search.value = ''
}

const resultData = computed(() => {
  if (!search.value) return list.value
  return list.value.filter(d => String(d.title).indexOf(search.value) > -1)
})
const total = computed(() => resultData.value.length)
const tableData = computed(() => resultData.value.slice((page.value - 1) * size.value, page.value * size.value))

const refreshCurrent = () => {
  const node = currentNode.value
  if (node && node.data) { node.loaded = false; node.expand() }
}

// 新增/编辑类别
const typeFormRef = ref(null)
const typeDlg = reactive({ visible: false, isEdit: false, loading: false })
const defaultTypeForm = () => ({ id: undefined, title: undefined, remarks: undefined, checked: undefined })
const typeForm = reactive(defaultTypeForm())
const typeRules = { title: [required('类别名称不能为空')] }
const openAddType = () => {
  Object.assign(typeForm, defaultTypeForm())
  Object.assign(typeDlg, { visible: true, isEdit: false })
  typeFormRef.value?.clearValidate()
}
const openEditType = row => {
  Object.assign(typeForm, defaultTypeForm(), { ...row })
  Object.assign(typeDlg, { visible: true, isEdit: true })
  typeFormRef.value?.clearValidate()
}
const saveType = async () => {
  await typeFormRef.value.validate()
  typeDlg.loading = true
  try {
    const payload = { ...typeForm, type: searchForm.type }
    if (!typeDlg.isEdit) payload.parentId = currentNode.value.data.id
    await surchargeApi.save(payload)
    ElMessage.success('保存成功')
    typeDlg.visible = false
    refreshCurrent()
  } finally {
    typeDlg.loading = false
  }
}
const removeType = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await surchargeApi.save({ id: row.id, deleted: 1 })
    ElMessage.success('删除成功')
    refreshCurrent()
  }).catch(() => {})
}

// 设置附加费
const costFormRef = ref(null)
const costDlg = reactive({ visible: false, loading: false })
const costForm = reactive({ id: null, billingUnit: 1, sections: [] })
const loadCountry = async () => {
  const res = await getCountryOptions()
  countryList.value = res.data.result || []
}
const openSetCost = async row => {
  costDlg.loading = true
  costDlg.visible = true
  await loadCountry()
  costForm.id = row.id
  costForm.billingUnit = row.billingUnit || 1
  const res = await surchargeCostApi.getCost({ categoryId: row.id })
  const data = res.data || []
  costForm.sections = data.length
    ? data.map(it => ({ countryId: it.countryId, price: it.price }))
    : [{ countryId: undefined, price: undefined }]
  costDlg.loading = false
}
const onBillUnit = () => {
  if (costForm.billingUnit === 4) costForm.sections = [{ countryId: undefined, price: undefined }]
}
const addRange = () => costForm.sections.push({ countryId: undefined, price: undefined })
const removeRange = index => costForm.sections.splice(index, 1)
const saveCost = async () => {
  const { sections, billingUnit, id } = costForm
  if (billingUnit !== 4) {
    if (!sections.every(it => it.countryId && it.price)) return ElMessage.error('请填写完整国家和单价')
    const uniq = new Set(sections.map(it => it.countryId))
    if (uniq.size < sections.length) return ElMessage.error('国家不能重复')
  }
  costDlg.loading = true
  try {
    const arr = sections.map(it => ({ ...it, countryName: (countryList.value.find(c => c.id === it.countryId) || {}).name }))
    await surchargeCostApi.saveCost({ id, billingUnit, list: billingUnit === 4 ? [] : arr })
    ElMessage.success('保存成功')
    costDlg.visible = false
    refreshCurrent()
  } finally {
    costDlg.loading = false
  }
}
</script>

<style scoped lang="scss">
.gs-wrap { display: flex; flex-flow: row nowrap; min-height: inherit; }
.gs-slide {
  width: 420px; flex-shrink: 0; background: $bg-card; border-radius: $card-radius;
  padding: 16px; overflow: auto;
  &__head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid $border-color; margin-bottom: 8px; }
}
.gs-arrow { display: flex; align-items: center; padding: 0 6px; cursor: pointer; color: $text-secondary; }
.gs-main { flex: 1; overflow: auto; }
.gs-bar { display: flex; align-items: center; gap: 16px; }
.cost-row { display: flex; align-items: center; margin-bottom: 12px; }
.cost-icon { font-size: 18px; margin-left: 10px; cursor: pointer; }
.cost-icon.plus { color: $primary-color; }
.cost-icon.reduce { color: $danger-color; }
</style>
