<template>
  <Modal
    :model-value="modelValue"
    title="关联人员"
    width="720px"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div v-if="record" class="relate-staff">
      <p class="relate-staff__tip">为「{{ record.name }}」分配财务人员与运营客服。</p>
      <el-tabs v-model="tab">
        <el-tab-pane label="财务人员" name="finance">
          <el-transfer
            v-model="financeKeys"
            :data="financeData"
            :titles="['可选', '已关联']"
            filterable
            filter-placeholder="搜索姓名"
          />
        </el-tab-pane>
        <el-tab-pane label="运营客服" name="service">
          <el-transfer
            v-model="serviceKeys"
            :data="serviceData"
            :titles="['可选', '已关联']"
            filterable
            filter-placeholder="搜索姓名"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { getStaffOptions } from '@/api/modules/organizers'

// 关联人员弹窗：客户/代理商/供应商复用，按财务/客服两组穿梭选择
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
  // 保存函数：updateFn(id, patch)
  updateFn: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'saved'])

const tab = ref('finance')
const loading = ref(false)
const staff = ref([])
const financeKeys = ref([])
const serviceKeys = ref([])

const toItem = s => ({ key: s.id, label: `${s.realName}（${s.deptName}）` })
const financeData = computed(() => staff.value.filter(s => s.group === 'finance').map(toItem))
const serviceData = computed(() => staff.value.filter(s => s.group === 'service').map(toItem))

const loadStaff = async () => {
  if (staff.value.length) return
  const res = await getStaffOptions()
  staff.value = res.data
}

watch(
  () => props.modelValue,
  async open => {
    if (!open || !props.record) return
    await loadStaff()
    financeKeys.value = [...(props.record.financeStaff || [])]
    serviceKeys.value = [...(props.record.serviceStaff || [])]
    tab.value = 'finance'
  }
)

const close = () => emit('update:modelValue', false)

const submit = async () => {
  loading.value = true
  try {
    await props.updateFn(props.record.id, {
      financeStaff: [...financeKeys.value],
      serviceStaff: [...serviceKeys.value]
    })
    ElMessage.success('关联人员已保存')
    emit('saved')
    close()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.relate-staff__tip {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
</style>
