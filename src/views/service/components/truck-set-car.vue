<template>
  <Modal v-model="visible" :title="`设置车型-${relevanceRow.name || ''}`" width="960px" :footer="false">
    <div v-loading="loading">
      <el-transfer
        v-model="relevanceList"
        filterable
        :filter-method="filterMethod"
        :titles="['全部车型', '已选择车型']"
        :props="{ key: 'id', label: 'name' }"
        filter-placeholder="输入搜索"
        :data="carModelList"
        style="height: 500px"
      />
      <div style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="cancel">取 消</el-button>
        <el-button type="primary" size="small" @click="save">保 存</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { truckApi, getVehicleTypeList } from '@/api/modules/service'

defineOptions({ name: 'TruckSetCar' })
const emit = defineEmits(['saved'])

const visible = ref(false)
const loading = ref(false)
const isEdit = ref(false)
const relevanceRow = ref({})
const carModelList = ref([])
const relevanceList = ref([])

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const showModel = async row => {
  relevanceRow.value = row
  relevanceList.value = []
  visible.value = true
  loading.value = true
  try {
    carModelList.value = (await getVehicleTypeList()).data
    const data = (await truckApi.viewRange(row.id, row.priceType)).data || {}
    if (data.rangeList && data.rangeList.length) {
      relevanceList.value = data.rangeList.map(item => item.code)
      isEdit.value = true
    } else {
      isEdit.value = false
    }
  } finally {
    loading.value = false
  }
}
const cancel = () => { relevanceList.value = []; visible.value = false }
const save = async () => {
  if (relevanceList.value.length === 0) { ElMessage.warning('请选择车型'); return }
  const rangeList = relevanceList.value.map(item => {
    const data = carModelList.value.find(e => e.id === item)
    return { code: data.id, name: data.name }
  })
  await truckApi.saveRange({ ifEdit: isEdit.value, kscId: relevanceRow.value.id, priceType: relevanceRow.value.priceType, rangeList })
  ElMessage.success('操作成功')
  cancel()
  emit('saved')
}

defineExpose({ showModel })
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
