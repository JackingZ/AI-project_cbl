<template>
  <!--
    关联代理商/客户穿梭框（源 dialogCompany）：
    特殊报价（mode==='1'）时关联代理商/客户。只读态（查看/历史/非待审）隐藏底部按钮。
  -->
  <Modal v-model="visible" :title="title" width="960px" :footer="false" @closed="onClosed">
    <div v-loading="loading">
      <el-transfer
        v-model="options"
        filterable
        :titles="[`选择${title}`, '已选择']"
        :props="{ key: 'id', label: 'name' }"
        filter-placeholder="输入搜索"
        :data="companyList"
        class="rt-transfer"
      />
      <div v-if="showFooter" style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button type="primary" size="small" @click="onSave">保存</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'

defineOptions({ name: 'RelevanceTransfer' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '关联代理商' },
  loading: { type: Boolean, default: false },
  companyList: { type: Array, default: () => [] },
  // 已选 id 列表
  selected: { type: Array, default: () => [] },
  // 是否显示底部按钮（编辑/新增/待审可保存）
  showFooter: { type: Boolean, default: true }
})
const emit = defineEmits(['update:modelValue', 'save', 'closed'])

const visible = ref(props.modelValue)
const options = ref([...props.selected])
watch(() => props.modelValue, v => (visible.value = v))
watch(visible, v => emit('update:modelValue', v))
watch(() => props.selected, v => (options.value = [...(v || [])]))

const onSave = () => { emit('save', [...options.value]); visible.value = false }
const onClosed = () => emit('closed')
</script>

<style scoped lang="scss">
.rt-transfer { height: 500px; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
.rt-transfer :deep(.el-transfer-panel) { width: 40%; height: 100%; }
.rt-transfer :deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
.rt-transfer :deep(.el-transfer-panel__body) { height: 78%; }
</style>