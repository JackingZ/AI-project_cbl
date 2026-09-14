<template>
  <!--
    区间/区域配置弹窗（源 dialogRange，四种模式）：
    - one   区间范围（下限/上限，可增删行）——空运重量/海铁拼箱体积
    - two   重量范围（源另有「方数范围」，整段为注释，保留不放开）——卡派
    - three 柜型（穿梭框选柜型）——海铁整柜
    - four  地址类型（地址类型下拉 + 国家 + 穿梭框选目的地/区域）——Y 轴
  -->
  <Modal
    v-model="visible"
    :width="mode === 'one' ? '600px' : '960px'"
    :footer="false"
    @closed="onClosed"
  >
    <template #title>
      <div>
        <p>{{ '选择' + title }}</p>
        <p v-if="mode === 'one' || mode === 'two'" style="font-size: 14px; color: #606266">{{ hint }}</p>
      </div>
    </template>

    <div v-loading="loading">
      <el-form :model="form" label-width="100px" size="small" class="rc-form">
        <!-- one：区间范围 -->
        <div v-show="mode === 'one'">
          <el-form-item label="区间范围" class="is-required" style="width: 80%">
            <div v-for="(item, index) in form.sections" :key="index" class="rc-row">
              <el-input-number v-model="item.lower" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-input-number v-model="item.upper" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-icon v-if="index === 0" class="rc-icon plus" @click="addRow('sections')"><CirclePlus /></el-icon>
              <el-icon v-else class="rc-icon reduce" @click="delRow('sections', index)"><Remove /></el-icon>
            </div>
          </el-form-item>
        </div>

        <!-- two：重量范围（方数范围源为注释，保留不放开） -->
        <div v-show="mode === 'two'">
          <el-form-item label="重量范围" class="is-required" style="width: 80%">
            <div v-for="(item, index) in form.sections1" :key="index" class="rc-row">
              <el-input-number v-model="item.lower" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-input-number v-model="item.upper" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-icon v-if="index === 0" class="rc-icon plus" @click="addRow('sections1')"><CirclePlus /></el-icon>
              <el-icon v-else class="rc-icon reduce" @click="delRow('sections1', index)"><Remove /></el-icon>
            </div>
          </el-form-item>
          <!-- 源含「方数范围」sections2，整段注释，保留不放开
          <el-form-item label="方数范围" class="is-required" style="width: 49%">
            <div v-for="(item, index) in form.sections2" :key="index" class="rc-row">
              <el-input-number v-model="item.lower" :controls="false" placeholder="输入下限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-input-number v-model="item.upper" :controls="false" placeholder="输入上限" :min="0" :max="999999" :step="1" step-strictly style="width: 45%" />
              <el-icon v-if="index === 0" class="rc-icon plus" @click="addRow('sections2')"><CirclePlus /></el-icon>
              <el-icon v-else class="rc-icon reduce" @click="delRow('sections2', index)"><Remove /></el-icon>
            </div>
          </el-form-item> -->
        </div>

        <!-- four：地址类型 + 国家 -->
        <div v-show="mode === 'four'" style="padding: 0 30px">
          <el-form-item label="地址类型" class="is-required" style="width: 50%">
            <el-select v-model="form.yType" :loading="loading" filterable clearable placeholder="请选择" style="width: 200px" @change="onAddress">
              <el-option v-for="item in addressList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.yType !== '0' && form.yType !== '102'" label="国家" class="is-required" style="width: 50%">
            <el-select v-model="form.countryId" :loading="loading" clearable filterable placeholder="请选择" style="width: 200px" @focus="$emit('load-country')" @change="onAxisYCountry">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <!-- three / four：穿梭框 -->
      <div v-show="mode === 'three' || mode === 'four'">
        <el-transfer
          v-model="options"
          filterable
          :titles="[`选择${title}`, '已选择']"
          :props="{ key: 'id', label: 'name' }"
          filter-placeholder="输入搜索"
          :data="boxList"
          class="rc-transfer"
        />
      </div>

      <div style="text-align: right; margin: 20px 20px 0">
        <el-button type="primary" size="small" @click="onSave">保存</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { CirclePlus, Remove } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'

defineOptions({ name: 'RangeConfigDialog' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: '' }, // one | two | three | four
  title: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  // 地址类型列表（源写死七项）
  addressList: { type: Array, default: () => [] },
  countryList: { type: Array, default: () => [] },
  // 穿梭框可选项（柜型/目的地/区域）
  boxList: { type: Array, default: () => [] }
})
const emit = defineEmits([
  'update:modelValue', 'load-country', 'address-change', 'country-change', 'save', 'closed'
])

const visible = ref(props.modelValue)
watch(() => props.modelValue, v => (visible.value = v))
watch(visible, v => emit('update:modelValue', v))

const hint = '(取值范围：>=起始值， <结束值)'
const emptySections = () => [{ lower: undefined, upper: undefined }]
const form = reactive({ yType: undefined, countryId: undefined, sections: emptySections(), sections1: emptySections(), sections2: emptySections() })
const options = ref([])

const addRow = key => form[key].push({ lower: undefined, upper: undefined })
const delRow = (key, index) => form[key].splice(index, 1)

const onAddress = () => { options.value = []; form.countryId = undefined; emit('address-change', form.yType) }
const onAxisYCountry = () => emit('country-change', { yType: form.yType, countryId: form.countryId })

// 区间校验（完整/上下限/重叠/连续），源 rangeValidate
const validateRange = range => {
  if (!range.every(it => (it.lower === 0 || it.lower) && it.upper)) { ElMessage.error('请完整填写区间值'); return false }
  if (range.some(it => it.upper <= it.lower)) { ElMessage.error('下限值不能大于等于上限值'); return false }
  let overlap = false
  range.forEach((it, i) => {
    if (range.some((r, j) => i !== j && ((r.lower <= it.lower && it.lower < r.upper) || (r.lower < it.upper && it.upper <= r.upper)))) overlap = true
  })
  if (overlap) { ElMessage.error('区间范围不能重叠'); return false }
  for (let i = 1; i < range.length; i++) {
    if (range[i].lower !== range[i - 1].upper) { ElMessage.error('区间范围必须连续'); return false }
  }
  return true
}

const onSave = () => {
  const payload = { mode: props.mode, yType: form.yType, countryId: form.countryId, options: options.value }
  if (props.mode === 'one') {
    if (!validateRange(form.sections)) return
    payload.sections = form.sections
  } else if (props.mode === 'two') {
    if (!validateRange(form.sections1)) return
    payload.sections1 = form.sections1
  }
  emit('save', payload)
}

const onClosed = () => { emit('closed') }

// 供父级回填/重置
const setForm = (patch = {}) => Object.assign(form, patch)
const setOptions = arr => { options.value = arr || [] }
const resetForm = () => {
  form.yType = undefined; form.countryId = undefined
  form.sections = emptySections(); form.sections1 = emptySections(); form.sections2 = emptySections()
  options.value = []
}
defineExpose({ setForm, setOptions, resetForm, form, options })
</script>

<style scoped lang="scss">
.rc-form :deep(.el-form-item) { display: inline-block; vertical-align: top; }
.rc-row { position: relative; display: flex; align-items: center; margin-bottom: 12px; }
.rc-icon { font-size: 18px; margin-left: 10px; cursor: pointer; }
.rc-icon.plus { color: $primary-color; }
.rc-icon.reduce { color: $danger-color; }
.rc-transfer { height: 500px; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
.rc-transfer :deep(.el-transfer-panel) { width: 40%; height: 100%; }
.rc-transfer :deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
.rc-transfer :deep(.el-transfer-panel__body) { height: 78%; }
</style>