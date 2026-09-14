<template>
  <Modal v-model="visible" title="关联柜型" width="960px" :footer="false" @closed="dialogClose">
    <div v-loading="loading">
      <el-transfer
        v-model="selectCabinet"
        filterable
        :filter-method="filterMethod"
        :titles="['全部柜型', '已关联柜型']"
        :props="{ key: 'id', label: 'name' }"
        filter-placeholder="输入搜索"
        :data="cabinetList"
        style="height: 500px"
      />
      <div style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="dialogClose">取 消</el-button>
        <el-button type="primary" size="small" @click="save">确 定</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { trailerApi } from '@/api/modules/service'

defineOptions({ name: 'TrailerSetCabinet' })
const emit = defineEmits(['saved'])

const visible = ref(false)
const loading = ref(false)
const setCabinetData = ref({})
const cabinetList = ref([])
const selectCabinet = ref([])
const selectCabinetList = ref([])

const filterMethod = (query, item) => (item.name || '').indexOf(query) > -1

const show = async row => {
  setCabinetData.value = row
  selectCabinet.value = []
  selectCabinetList.value = []
  visible.value = true
  loading.value = true
  try {
    cabinetList.value = (await trailerApi.getCabinetList()).data
    selectCabinetList.value = (await trailerApi.getServiceCabinet(row.id)).data
    selectCabinet.value = selectCabinetList.value.map(item => item.cabinetId)
  } finally {
    loading.value = false
  }
}
const dialogClose = () => { selectCabinet.value = []; selectCabinetList.value = []; visible.value = false }

const save = async () => {
  const params = { delList: [], insList: [], tscId: setCabinetData.value.id }
  if (selectCabinetList.value.length === 0) {
    cabinetList.value.forEach(item => {
      if (selectCabinet.value.indexOf(item.id) !== -1) {
        params.insList.push({ cabinetId: item.id, cabinetName: item.name, tscId: setCabinetData.value.id })
      }
    })
  } else {
    const oldIds = selectCabinetList.value.map(item => item.cabinetId)
    oldIds.forEach((e, i) => { if (selectCabinet.value.indexOf(e) === -1) params.delList.push(selectCabinetList.value[i]) })
    selectCabinet.value.forEach(e => {
      if (oldIds.indexOf(e) === -1) {
        const cabinet = cabinetList.value.find(item => item.id === e)
        if (cabinet) params.insList.push({ cabinetId: cabinet.id, cabinetName: cabinet.name, tscId: setCabinetData.value.id })
      }
    })
  }
  loading.value = true
  try {
    await trailerApi.saveCabinet(params)
    ElMessage.success('操作成功')
    dialogClose()
    emit('saved')
  } finally {
    loading.value = false
  }
}

defineExpose({ show })
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
