<template>
  <Modal v-model="visible" :title="dlgTitle" width="960px" :footer="false" @closed="onClosed">
    <div v-loading="loading">
      <el-form ref="formRef" :model="form" label-width="120px" label-position="right" size="small" class="dialog-form">
        <!-- 单区间：重量区间 / 体积区间 -->
        <div v-show="isType === 'one'" style="height: 400px; overflow-y: auto">
          <el-form-item label="区间范围" style="width: 80%" class="is-required">
            <div v-for="(item, index) in form.sections" :key="index" class="item-after-icon">
              <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
              <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
              <span>
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addRange('sections')"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="delRange('sections', index)"><RemoveFilled /></el-icon>
              </span>
            </div>
          </el-form-item>
        </div>

        <!-- 双区间：重量范围 + 方数范围 -->
        <div v-show="isType === 'two'" style="height: 400px; overflow-y: auto">
          <el-form-item label="重量范围" style="width: 49%; display: inline-block" class="is-required">
            <div v-for="(item, index) in form.sections1" :key="index" class="item-after-icon">
              <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
              <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
              <span>
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addRange('sections1')"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="delRange('sections1', index)"><RemoveFilled /></el-icon>
              </span>
            </div>
          </el-form-item>
          <el-form-item label="方数范围" style="width: 49%; display: inline-block" class="is-required">
            <div v-for="(item, index) in form.sections2" :key="index" class="item-after-icon">
              <el-input-number v-model="item.lower" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly />
              <el-input-number v-model="item.upper" class="input-number-valiate" style="width: 45%" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly />
              <span>
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addRange('sections2')"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="delRange('sections2', index)"><RemoveFilled /></el-icon>
              </span>
            </div>
          </el-form-item>
        </div>
      </el-form>

      <!-- 穿梭：定义航空板 / 定义柜型 / 设置车型 -->
      <div v-show="isType === 'three'">
        <el-transfer
          v-model="options"
          filterable
          :filter-method="filterMethod"
          :titles="[`选择${title}`, '已选择']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="list"
          style="height: 450px"
        />
      </div>

      <div style="text-align: right; margin: 20px 40px 0">
        <el-button type="primary" size="small" @click="save">保存</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { CirclePlus, RemoveFilled } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { bookingApi, getAviationList, getContainerList, getVehicleTypeList } from '@/api/modules/service'

defineOptions({ name: 'BookingChargeDialog' })
const emit = defineEmits(['saved'])

const visible = ref(false)
const loading = ref(false)
const isType = ref('')
const title = ref('')
const options = ref([])
const list = ref([])
const serviceId = ref('')

const defaultForm = () => ({
  sections: [{ lower: undefined, upper: undefined }],
  sections1: [{ lower: undefined, upper: undefined }],
  sections2: [{ lower: undefined, upper: undefined }]
})
const form = reactive(defaultForm())

const text = '(取值范围：>=起始值， <结束值)'
const dlgTitle = computed(() => isType.value === 'three' ? `选择${title.value}` : `选择${title.value}  ${text}`)

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

/* 设置计费区间：transType 含 1→重量区间 / 3→体积区间（isType one）；5→重量&方数（isType two） */
const openSide = row => {
  reset()
  const arr = String(row.transType).split(',')
  arr.forEach(it => {
    if (it === '1') { isType.value = 'one'; title.value = '重量区间' }
    else if (it === '3') { isType.value = 'one'; title.value = '体积区间' }
    else if (it === '5') { isType.value = 'two'; title.value = '重量&方数区间' }
  })
  serviceId.value = row.id
  visible.value = true
  loadConfig()
}

/* 设置计费类型：transType 含 0→定义航空板 / 2→定义柜型 / 4→设置车型（isType three 穿梭） */
const openType = row => {
  reset()
  const arr = String(row.transType).split(',')
  arr.forEach(it => {
    if (it === '0') { title.value = '定义航空板'; isType.value = 'three'; loadList(getAviationList) }
    else if (it === '2') { title.value = '定义柜型'; isType.value = 'three'; loadList(getContainerList) }
    // 源 '4'（卡整）设 title/isType 但未装配车型数据源，此处补 getVehicleTypeList 使穿梭可用
    else if (it === '4') { title.value = '设置车型'; isType.value = 'three'; loadList(getVehicleTypeList) }
  })
  serviceId.value = row.id
  visible.value = true
  loadConfig()
}

const loadList = async fn => {
  loading.value = true
  try { list.value = (await fn()).data } finally { loading.value = false }
}

/* 读取已存配置（mock 直存已选区间/穿梭项，回填复现） */
const loadConfig = async () => {
  loading.value = true
  try {
    const cfg = (await bookingApi.getPriceConfig(serviceId.value, 'X')).data
    if (!cfg) return
    if (isType.value === 'one') form.sections = cfg.sections?.length ? cfg.sections : defaultForm().sections
    else if (isType.value === 'two') {
      form.sections1 = cfg.sections1?.length ? cfg.sections1 : defaultForm().sections1
      form.sections2 = cfg.sections2?.length ? cfg.sections2 : defaultForm().sections2
    } else if (isType.value === 'three') options.value = cfg.options || []
  } finally {
    loading.value = false
  }
}

const addRange = key => form[key].push({ lower: undefined, upper: undefined })
const delRange = (key, index) => form[key].splice(index, 1)

/* 源 rangeValidate：完整/上限>下限/不重叠/连续 */
const rangeValidate = range => {
  const arrVal = range.every(item => (item.lower === 0 || item.lower) && item.upper)
  if (!arrVal) { ElMessage.error('请完整填写区间值'); return false }
  if (range.some(item => item.upper <= item.lower)) { ElMessage.error('下限值不能大于等于上限值'); return false }
  let mixVal = false
  range.forEach((it, index) => {
    mixVal = range.some((r, i) => i !== index && ((r.lower <= it.lower && it.lower < r.upper) || (r.lower < it.upper && it.upper <= r.upper)))
  })
  if (mixVal) { ElMessage.error('区间范围不能重叠'); return false }
  for (let i = 1; i < range.length; i++) {
    if (range[i].lower !== range[i - 1].upper) { ElMessage.error('区间范围必须连续'); return false }
  }
  return true
}

const save = async () => {
  const cfg = { isType: isType.value }
  if (isType.value === 'one') {
    if (!rangeValidate(form.sections)) return
    cfg.sections = form.sections.map(s => ({ ...s }))
  } else if (isType.value === 'two') {
    if (!rangeValidate(form.sections1)) return
    if (!rangeValidate(form.sections2)) return
    cfg.sections1 = form.sections1.map(s => ({ ...s }))
    cfg.sections2 = form.sections2.map(s => ({ ...s }))
  } else if (isType.value === 'three') {
    cfg.options = [...options.value]
  }
  loading.value = true
  try {
    await bookingApi.savePriceConfig(serviceId.value, 'X', cfg)
    ElMessage.success('保存成功')
    visible.value = false
    emit('saved')
  } finally {
    loading.value = false
  }
}

const reset = () => {
  isType.value = ''
  title.value = ''
  options.value = []
  list.value = []
  Object.assign(form, defaultForm())
}
const onClosed = () => reset()

defineExpose({ openSide, openType })
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
.input-number-valiate { width: 100%; }
.input-number-valiate :deep(.el-input__inner) { text-align: left; }
.dialog-form .el-form-item { display: inline-block; vertical-align: top; width: 50%; margin-bottom: 10px; }
.item-after-icon {
  position: relative; padding-bottom: 15px;
  .item-icon-plus { position: absolute; top: 6px; color: #409eff; font-size: 18px; margin-left: 10px; cursor: pointer; }
  .item-icon-reduce { position: absolute; top: 6px; color: #f56c6c; font-size: 18px; margin-left: 10px; cursor: pointer; }
}
</style>
