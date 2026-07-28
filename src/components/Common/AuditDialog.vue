<template>
  <Modal
    :model-value="modelValue"
    title="订单审核"
    width="480px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record">
      <p class="audit-tip">审核订单「{{ record.orderNo }}」。</p>
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="result">
            <el-radio value="审核通过">通过</el-radio>
            <el-radio value="审核拒绝">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="result === '审核拒绝'" label="拒绝原因">
          <el-input v-model="reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { auditOrder } from '@/api/modules/orderlist'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const result = ref('审核通过')
const reason = ref('')

watch(() => props.modelValue, open => { if (open) { result.value = '审核通过'; reason.value = '' } })

const close = () => emit('update:modelValue', false)
const submit = async () => {
  if (result.value === '审核拒绝' && !reason.value) return ElMessage.warning('请输入拒绝原因')
  loading.value = true
  try {
    await auditOrder(props.record.id, result.value)
    ElMessage.success('审核已提交')
    emit('saved')
    close()
  } finally { loading.value = false }
}
</script>

<style scoped lang="scss">
.audit-tip { color: $text-secondary; font-size: $font-sm; margin-bottom: $space-md; }
</style>
