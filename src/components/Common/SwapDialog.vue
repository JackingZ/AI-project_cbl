<template>
  <Modal
    :model-value="modelValue"
    title="换单"
    width="480px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record">
      <p class="swap-tip">为订单「{{ record.orderNo }}」更换快递服务。</p>
      <el-form label-width="90px">
        <el-form-item label="当前快递">{{ record.expressCompany }}</el-form-item>
        <el-form-item label="更换为">
          <el-select v-model="target" placeholder="请选择快递服务" style="width: 100%">
            <el-option v-for="c in EXPRESS_COMPANIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { assignSupplier, EXPRESS_COMPANIES } from '@/api/modules/orderlist'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const target = ref('')
watch(() => props.modelValue, open => { if (open) target.value = '' })

const close = () => emit('update:modelValue', false)
const submit = async () => {
  if (!target.value) return ElMessage.warning('请选择快递服务')
  loading.value = true
  try {
    await assignSupplier(props.record.id, { expressCompany: target.value })
    ElMessage.success('换单成功')
    emit('saved')
    close()
  } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.swap-tip { color: $text-secondary; font-size: $font-sm; margin-bottom: $space-md; }
</style>
