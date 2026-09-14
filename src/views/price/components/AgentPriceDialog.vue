<template>
  <!--
    供应商报价只读浮层（源 agentPrice.vue，vxe-modal 降级为 Modal）：
    标题栏内供应商/版本双下拉切换 → 只读价格矩阵。仅 custType==='0' 外协服务可查看。
    源为可拖拽浮窗（v-drag + vxe-modal show-zoom），降级为居中 Modal。
  -->
  <Modal v-model="visible" width="1100px" :footer="false" @closed="onClosed">
    <template #title>
      <div class="ap-title">
        <span>供应商</span>
        <el-select v-model="form.agent" clearable filterable size="small" placeholder="请选择" style="width: 200px; margin: 0 20px 0 10px" @change="onAgent">
          <el-option v-for="item in agentList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <span>版本</span>
        <el-select v-model="form.edition" clearable filterable :disabled="!form.agent" size="small" placeholder="请选择" style="width: 240px; margin-left: 10px" @change="onEdition">
          <el-option v-for="item in editionList" :key="item.id" :label="formatPeriod(item.period)" :value="item.id" />
        </el-select>
      </div>
    </template>

    <div v-loading="loading">
      <PriceMatrix
        :left-title="leftTitle"
        :right-title="rightTitle"
        :columns="columns"
        :data="tableData"
        :show-regional="showRegional"
        :editable="false"
        :height="440"
      />
      <el-empty v-if="!columns.length" description="请选择供应商与版本" :image-size="90" />
    </div>
  </Modal>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import PriceMatrix from './PriceMatrix.vue'
import { buildAxis, ADDRESS_LABELS } from '@/api/modules/price'

defineOptions({ name: 'AgentPriceDialog' })

const props = defineProps({
  // 拉取供应商报价列表的方法：fetchSupplier({ lscId }) => Promise<{data:[{id,cust:{key,value},period,rows,loadType}]}>
  fetchSupplier: { type: Function, required: true }
})

const visible = ref(false)
const loading = ref(false)
const agentPriceList = ref([])
const agentList = ref([])
const editionList = ref([])
const columns = ref([])
const tableData = ref([])
const leftTitle = ref('')
const rightTitle = ref('')
const showRegional = ref(false)
const form = reactive({ agent: '', edition: '' })
let selectService = {}

const formatPeriod = (p = {}) => `${p.effect || ''}-${p.expire || ''}`

const reset = () => {
  columns.value = []; tableData.value = []; agentList.value = []
  agentPriceList.value = []; editionList.value = []
  form.agent = ''; form.edition = ''
  leftTitle.value = ''; rightTitle.value = ''; showRegional.value = false
}

const show = async service => {
  reset()
  selectService = service || {}
  visible.value = true
  loading.value = true
  try {
    const res = await props.fetchSupplier({ lscId: selectService.id })
    agentPriceList.value = res.data || []
    // 去重供应商
    const seen = new Set()
    agentList.value = agentPriceList.value.map(e => ({ id: e.cust.key, name: e.cust.value }))
      .filter(a => (seen.has(a.id) ? false : (seen.add(a.id), true)))
  } finally {
    loading.value = false
  }
}

const onAgent = val => {
  editionList.value = agentPriceList.value.filter(it => it.cust.key === val)
  form.edition = ''
  columns.value = []; tableData.value = []
}
const onEdition = val => {
  columns.value = []; tableData.value = []
  const price = agentPriceList.value.find(it => it.id === val)
  if (!price) return
  const rows = price.rows || []
  const axis = buildAxis(rows, price.loadType)
  leftTitle.value = ADDRESS_LABELS[(rows[0] || {}).addressType] || ''
  rightTitle.value = axis.rightTitle
  columns.value = axis.columns
  showRegional.value = false
  tableData.value = rows
}

const close = () => { visible.value = false }
const onClosed = () => { close() }

defineExpose({ show, close })
</script>

<style scoped lang="scss">
.ap-title { display: flex; align-items: center; }
</style>