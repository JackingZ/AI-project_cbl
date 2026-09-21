<template>
  <Modal
    :model-value="modelValue"
    title="指派供应商"
    width="480px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record">
      <p class="assign-tip">为订单「{{ record.orderNo }}」指派承运供应商。</p>
      <el-form label-width="90px">
        <el-form-item label="供应商">
          <el-select v-model="supplierName" placeholder="请选择供应商" style="width: 100%">
            <el-option v-for="s in SUPPLIERS" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="指派方式">
          <el-radio-group v-model="assignType">
            <el-radio v-for="t in ASSIGN_TYPES" :key="t" :value="t">{{ t }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="默认供应商">
          <el-switch :model-value="normalizeSwitchValue(isDefault, '是', '否')" active-value="是" inactive-value="否" @update:model-value="setIsDefault" />
        </el-form-item>
      </el-form>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { normalizeSwitchValue } from '@/utils/format'
import { assignSupplier, SUPPLIERS, ASSIGN_TYPES } from '@/api/modules/orderlist'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const loading = ref(false)
const supplierName = ref('')
const assignType = ref(ASSIGN_TYPES[0])
const isDefault = ref('否')
const setIsDefault = value => { isDefault.value = value }

watch(
  () => props.modelValue,
  open => {
    if (!open || !props.record) return
    supplierName.value = props.record.supplierName || ''
    assignType.value = props.record.assignType || ASSIGN_TYPES[0]
    isDefault.value = normalizeSwitchValue(props.record.isDefault, '是', '否')
  }
)

const close = () => emit('update:modelValue', false)

const submit = async () => {
  if (!supplierName.value) return ElMessage.warning('请选择供应商')
  loading.value = true
  try {
    await assignSupplier(props.record.id, {
      supplierName: supplierName.value,
      assignType: assignType.value,
      isDefault: isDefault.value
    })
    ElMessage.success('已指派供应商')
    emit('saved')
    close()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.assign-tip {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
</style>
