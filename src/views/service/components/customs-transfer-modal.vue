<template>
  <Modal v-model="visible" :title="`关联海关【${title}】`" width="960px" :footer="false">
    <div v-loading="loading">
      <el-transfer
        v-model="selectCabinet"
        filterable
        :filter-method="filterMethod"
        :titles="['全部海关', '已关联海关']"
        :props="{ key: 'id', label: 'name' }"
        filter-placeholder="输入搜索"
        :data="cabinetList"
        class="rt-transfer"
      />
      <div style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="visible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="save">确 定</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { customsApi } from '@/api/modules/service'

defineOptions({ name: 'CustomsTransferModal' })
const emit = defineEmits(['saved'])

const visible = ref(false)
const loading = ref(false)
const title = ref('')
const cabinetList = ref([])
const selectCabinet = ref([])
let current = null

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const show = async (row, t) => {
  current = row
  title.value = t
  visible.value = true
  loading.value = true
  try {
    cabinetList.value = (await customsApi.getCabinetList(row.countryId)).data
    selectCabinet.value = (await customsApi.getServiceCabinet(row.id)).data.map(x => x.customsId || x.id)
  } finally {
    loading.value = false
  }
}

const save = async () => {
  loading.value = true
  try {
    // 源以 delList/insList 增量提交，mock 直接存已选海关全集
    const list = cabinetList.value
      .filter(c => selectCabinet.value.includes(c.id))
      .map(c => ({ customsId: c.id, customsName: c.name, cscId: current.id }))
    await customsApi.saveCabinet(current.id, list)
    ElMessage.success('操作成功')
    visible.value = false
    emit('saved')
  } finally {
    loading.value = false
  }
}

defineExpose({ show })
</script>

<style scoped lang="scss">
.rt-transfer { height: 500px; display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
.rt-transfer :deep(.el-transfer-panel) { width: 40%; height: 100%; }
.rt-transfer :deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
.rt-transfer :deep(.el-transfer-panel__body) { height: 78%; }
</style>
