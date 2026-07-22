<template>
  <Modal
    :model-value="modelValue"
    title="分配车辆"
    width="480px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record">
      <p class="assign-tip">为订单「{{ record.orderNo }}」分配司机与车辆。</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="司机姓名" prop="driverName">
          <el-input v-model="form.driverName" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item label="联系电话" prop="driverPhone">
          <el-input v-model="form.driverPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="车牌号" prop="cardId">
          <el-input v-model="form.cardId" placeholder="请输入车牌号" />
        </el-form-item>
      </el-form>
    </div>
  </Modal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { required, phoneRule } from '@/utils/validate'
import { assignVehicle } from '@/api/modules/orderlist'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const formRef = ref(null)
const loading = ref(false)
const form = reactive({ driverName: '', driverPhone: '', cardId: '' })
const rules = {
  driverName: [required('请输入司机姓名')],
  driverPhone: [required('请输入联系电话'), phoneRule],
  cardId: [required('请输入车牌号')]
}

watch(
  () => props.modelValue,
  open => {
    if (!open || !props.record) return
    Object.assign(form, {
      driverName: props.record.driverName || '',
      driverPhone: props.record.driverPhone || '',
      cardId: props.record.cardId || ''
    })
    formRef.value?.clearValidate()
  }
)

const close = () => emit('update:modelValue', false)

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await assignVehicle(props.record.id, { ...form })
    ElMessage.success('已分配车辆')
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
