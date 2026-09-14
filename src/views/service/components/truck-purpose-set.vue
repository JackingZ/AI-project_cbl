<template>
  <Modal v-model="visible" title="选择目的地" width="960px" :footer="false" @closed="dialogClose">
    <div v-loading="loading">
      <el-form :model="form" label-width="70px" size="small">
        <el-row>
          <el-col :span="11">
            <el-form-item label="地址类型">
              <el-select v-model="form.addressType" placeholder="请选择地址类型" style="width: 100%" @change="addressTypeChange">
                <el-option v-for="item in TRUCK_ADDRESS_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.addressType !== '8'" :span="11" :offset="2">
            <el-form-item label="所在国家">
              <el-select v-model="form.countryId" placeholder="请选择" style="width: 100%" filterable :multiple="!isArea" collapse-tags @change="handleChange">
                <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div v-loading="loadingTransfer">
        <el-transfer
          v-model="selectAddress"
          filterable
          :filter-method="filterMethod"
          :titles="['全部', '已选择']"
          :props="{ key: 'id', label: 'fellName' }"
          filter-placeholder="输入搜索"
          :data="transferList"
          style="height: 500px"
        />
      </div>
      <div style="text-align: right; margin-top: 20px">
        <el-button size="small" @click="dialogClose">取 消</el-button>
        <el-button type="primary" size="small" @click="confirm">确 定</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import {
  truckApi, getPortList, getFbastoreList, getRegionList, getAllAreaList,
  TRUCK_ADDRESS_TYPE_LIST
} from '@/api/modules/service'

defineOptions({ name: 'TruckPurposeSet' })
defineProps({ countryList: { type: Array, default: () => [] } })
const emit = defineEmits(['load'])

const visible = ref(false)
const loading = ref(false)
const loadingTransfer = ref(false)
const isArea = ref(false)
const form = reactive({ addressType: undefined, countryId: [] })
const transferList = ref([])
const selectAddress = ref([])
const oldSelectAddress = ref([])
const kscId = ref('')

// 区域类型（5/6/7/8）单选国家；港口类（0/1/2/3）多选
const setIsArea = () => {
  isArea.value = !['0', '1', '2', '3'].includes(form.addressType)
}

const setData = row => {
  reset()
  visible.value = true
  kscId.value = row.id
  form.addressType = String(row.endAddressType != null ? row.endAddressType : (row.addressType || '0'))
  setIsArea()
  getAddressList()
}
const reset = () => {
  form.addressType = undefined
  form.countryId = []
  selectAddress.value = []
  transferList.value = []
}
const dialogClose = () => { visible.value = false; emit('load') }

const getAddressList = async () => {
  loading.value = true
  try {
    const result = (await truckApi.getPurpost(kscId.value, form.addressType)).data || []
    oldSelectAddress.value = result
    selectAddress.value = result.map(item => item.destinationId)
    if (!isArea.value) {
      form.countryId = result.reduce((list, next) => {
        if (next.countryId && list.indexOf(next.countryId) === -1) list.push(next.countryId)
        return list
      }, [])
    } else {
      form.countryId = (result[0] || {}).countryId
    }
    await handleChange()
  } finally {
    loading.value = false
  }
}
const addressTypeChange = () => { setIsArea(); getAddressList() }
const handleChange = async () => {
  switch (form.addressType) {
    case '3': await getFba(); break
    case '5': await getRegion(); break
    case '6': await getArea(1); break
    case '7': await getArea(3); break
    case '8': await getArea(2); break
    default: await getPort()
  }
}
const getArea = async type => {
  transferList.value = []
  if (!form.countryId && type !== 2) return
  loadingTransfer.value = true
  try {
    const result = (await getAllAreaList(type, type === 2 ? '' : form.countryId)).data || []
    transferList.value = result.map(item => ({ id: item.id + '', name: item.name, fellName: item.name, countryId: item.countryId, countryName: item.countryName }))
  } finally {
    loadingTransfer.value = false
  }
}
const getRegion = async () => {
  transferList.value = []
  if (!form.countryId) return
  loadingTransfer.value = true
  try {
    const result = (await getRegionList(form.countryId)).data || []
    transferList.value = result.map(item => ({ id: item.id, name: item.name, fellName: item.name, countryId: item.countryId, countryName: item.countryName }))
  } finally {
    loadingTransfer.value = false
  }
}
const getPort = async () => {
  loadingTransfer.value = true
  try {
    const cid = Array.isArray(form.countryId) ? form.countryId.join(',') : form.countryId
    const result = (await getPortList(cid, form.addressType)).data || []
    transferList.value = result.map(e => ({ ...e, fellName: `${e.code}-${e.name}-${e.alias}` }))
  } finally {
    loadingTransfer.value = false
  }
}
const getFba = async () => {
  loadingTransfer.value = true
  try {
    const cid = Array.isArray(form.countryId) ? form.countryId.join(',') : form.countryId
    const result = (await getFbastoreList(cid)).data || []
    transferList.value = result.map(e => ({ ...e, fellName: `${e.code}${e.postal ? '-' + e.postal : ''}${e.stateName ? '-' + e.stateName : ''}` }))
  } finally {
    loadingTransfer.value = false
  }
}
const filterMethod = (query, item) => (item.fellName || '').indexOf(query) > -1

const confirm = async () => {
  const params = { delList: [], insList: [], kscId: kscId.value, type: form.addressType }
  const list = oldSelectAddress.value.map(e => e.destinationId)
  const oldCountry = (oldSelectAddress.value[0] || {}).countryId
  list.forEach((e, i) => {
    if (selectAddress.value.indexOf(e) === -1) params.delList.push(oldSelectAddress.value[i])
  })
  selectAddress.value.forEach(e => {
    if (list.indexOf(e) === -1) {
      const tamp = transferList.value.find(item => item.id === e)
      if (tamp) params.insList.push({
        addressType: form.addressType, countryId: tamp.countryId, countryName: tamp.countryName,
        destinationId: tamp.id, destinationName: tamp.fellName, kscId: kscId.value
      })
    }
  })
  if (isArea.value && oldCountry && oldCountry !== form.countryId) {
    params.delList = [...params.delList, ...oldSelectAddress.value].reduce((del, item) => {
      if (!del.find(e => e.destinationId === item.destinationId)) del.push(item)
      return del
    }, [])
  }
  loading.value = true
  try {
    await truckApi.savePurpost(params)
    ElMessage.success('添加成功')
    dialogClose()
  } finally {
    loading.value = false
  }
}

defineExpose({ setData })
</script>

<style scoped lang="scss">
:deep(.el-transfer-panel) { width: 40%; height: 100%; }
:deep(.el-transfer) { display: flex; flex-flow: row nowrap; justify-content: center; align-items: center; }
:deep(.el-transfer-panel__list.is-filterable) { display: flex; flex-flow: column nowrap; height: 100%; }
:deep(.el-transfer-panel__body) { height: 78%; }
</style>
