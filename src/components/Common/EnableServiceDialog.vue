<template>
  <Modal
    :model-value="modelValue"
    title="开通服务"
    width="640px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record">
      <p class="enable-tip">为「{{ record.name }}」开通服务大类与覆盖国家。</p>
      <el-form label-width="90px">
        <el-form-item label="服务大类">
          <el-checkbox-group v-model="services">
            <el-checkbox v-for="s in SERVICE_CATEGORIES" :key="s" :value="s" border>{{ s }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="覆盖国家">
          <el-select v-model="countries" multiple collapse-tags collapse-tags-tooltip placeholder="请选择国家" style="width: 100%">
            <el-option v-for="c in countryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { SERVICE_CATEGORIES, REGIONS } from '@/api/modules/organizers'

// 开通服务弹窗：代理商/供应商复用
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
  updateFn: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const countryOptions = REGIONS.map(r => r.value)
const loading = ref(false)
const services = ref([])
const countries = ref([])

watch(
  () => props.modelValue,
  open => {
    if (!open || !props.record) return
    services.value = [...(props.record.services || [])]
    countries.value = [...(props.record.serviceCountries || [])]
  }
)

const close = () => emit('update:modelValue', false)

const submit = async () => {
  loading.value = true
  try {
    await props.updateFn(props.record.id, {
      services: [...services.value],
      serviceCountries: [...countries.value]
    })
    ElMessage.success('服务已开通')
    emit('saved')
    close()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.enable-tip {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
</style>
