<template>
  <Modal v-model="visible" title="添加地址" :width="modalWidth" :footer="false" @closed="dialogClose">
    <div v-loading="loading">
      <el-form :model="form" label-width="70px" size="small">
        <el-row>
          <el-col :span="11">
            <el-form-item label="地址类型">
              <el-select v-model="form.addressType" placeholder="请选择地址类型" style="width: 100%" @change="addressTypeChange">
                <el-option v-for="item in TRAILER_ADDRESS_TYPE_LIST" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.addressType !== 0 && form.addressType !== 7" :span="11" :offset="2">
            <el-form-item label="所在国家">
              <el-select v-model="form.countryId" placeholder="请选择" style="width: 100%" filterable :multiple="!isArea" collapse-tags @change="handleChange">
                <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="form.addressType === 0" :span="11" :offset="2" style="text-align: right">
            <el-button link type="primary" @click="addAddress">新增</el-button>
          </el-col>
        </el-row>
      </el-form>

      <!-- 私人地址：行内编辑表格 -->
      <div v-if="form.addressType === 0">
        <el-table :data="tableData" border>
          <el-table-column label="国家">
            <template #default="scope">
              <el-select v-if="scope.row.isEditRow" v-model="scope.row.countryId" placeholder="请选择国家" size="small" filterable clearable style="width: 100%" @change="val => countryChange(val, scope.row)">
                <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
              <span v-else>{{ scope.row.country }}</span>
            </template>
          </el-table-column>
          <el-table-column label="城市">
            <template #default="scope">
              <el-cascader v-if="scope.row.isEditRow" v-model="scope.row.detailArea" :options="detailAreaList" :props="{ label: 'name', value: 'id' }" :disabled="!scope.row.countryId" placeholder="请选择" filterable clearable style="width: 100%" @change="val => detailAreaChange(val, scope.row)" />
              <span v-else>{{ scope.row.detailAreaName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="街道">
            <template #default="scope">
              <el-select v-if="scope.row.isEditRow" v-model="scope.row.streetIds" placeholder="请选择街道/区" size="small" filterable multiple collapse-tags clearable :disabled="!scope.row.detailArea.length" style="width: 100%" @change="val => streetChange(val, scope.row)">
                <el-option v-for="item in streetList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
              </el-select>
              <span v-else>{{ scope.row.street }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button v-if="!scope.row.isEditRow" link type="primary" @click="editAddress(scope.row)">编辑</el-button>
              <el-button v-else link type="primary" @click="saveAddress(scope.row)">保存</el-button>
              <el-button v-if="!scope.row.isEditRow" link type="primary" @click="delAddress(scope.row)">删除</el-button>
              <el-button v-else link type="primary" @click="cancelEditAddress(scope.row)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination v-model:current-page="pagination.page" :page-size="pagination.size" layout="total, prev, pager, next" :total="pagination.total" style="text-align: right" @current-change="getAddressList()" />
      </div>

      <!-- 其它类型：穿梭框 -->
      <div v-else v-loading="loadingTransfer">
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

      <div v-if="form.addressType !== 0" style="text-align: right; margin-top: 20px">
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
  trailerApi, getPortList, getFbastoreList, getRegionList, getAllAreaList,
  getTrailerAreas, getTrailerStreets, TRAILER_ADDRESS_TYPE_LIST
} from '@/api/modules/service'

defineOptions({ name: 'TrailerAddAddress' })
const props = defineProps({ countryList: { type: Array, default: () => [] } })
const emit = defineEmits(['load'])

const modalWidth = ref('960px')
const visible = ref(false)
const loading = ref(false)
const loadingTransfer = ref(false)
const isArea = ref(false)
const tableData = ref([])
const detailAreaList = ref([])
const streetList = ref([])
const selectAddress = ref([])
const transferList = ref([])
const pagination = reactive({ page: 1, size: 10, total: 0 })
const setAddressData = ref({})
const form = reactive({ addressType: 0, countryId: [] })

let _rowKey = 0

const show = row => {
  setAddressData.value = row
  transferList.value = []
  selectAddress.value = []
  form.addressType = row.endAddressType != null ? row.endAddressType : 0
  form.countryId = undefined
  addressTypeChange(form.addressType)
  visible.value = true
}
const dialogClose = () => { visible.value = false; emit('load') }

/* 其它类型穿梭数据源路由 */
const handleChange = () => {
  switch (form.addressType) {
    case 3: getFba(); break
    case 4: getRegion(); break
    case 5: getArea(1); break
    case 6: getArea(3); break
    case 7: getArea(2); break
    default: getPort()
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
const filterMethod = (query, item) => (item.fellName || '').indexOf(query) > -1

const addressTypeChange = val => {
  if (form.addressType === 1 || form.addressType === 2 || form.addressType === 3) {
    isArea.value = false
    form.countryId = []
  } else {
    isArea.value = true
    form.countryId = undefined
  }
  transferList.value = []
  selectAddress.value = []
  modalWidth.value = '960px'
  pagination.page = 1
  getAddressList()
}

/* 私人地址行内编辑 */
const streetChange = (val, row) => {
  row.street = ''
  if (val.length) row.street = streetList.value.filter(item => val.indexOf(item.id) !== -1).map(item => item.name).join(',')
}
const add = () => {
  tableData.value.forEach(item => { item.isEditRow = false })
  tableData.value = [...tableData.value, {
    key: ++_rowKey, country: '', countryId: undefined, detailArea: [], detailAreaName: '',
    area: '', areaId: '', city: '', cityId: '', province: '', provinceId: '', streetIds: [], street: '', isEditRow: true
  }]
}
const addAddress = () => {
  const editingRow = tableData.value.find(e => e.isEditRow)
  if (!editingRow) { add(); return }
  const msg = editingRow.id ? '您修改的尚未保存！' : '您新增的尚未保存！'
  ElMessageBox.confirm(msg, '温馨提示', { confirmButtonText: '保存', cancelButtonText: '取消', type: 'warning', closeOnClickModal: false })
    .then(async () => { if (validate(editingRow)) await saveAddress(editingRow, 'isAdd') })
    .catch(() => { if (editingRow.id) add(); else tableData.value = tableData.value.filter(e => !e.isEditRow) })
}
const editAddress = async row => {
  tableData.value.forEach(item => { item.isEditRow = false })
  row.isEditRow = true
  loading.value = true
  try {
    await getAreaDetailList(row)
    await getStreet(row)
  } finally {
    loading.value = false
  }
}
const validate = row => {
  if (!row.countryId) { ElMessage.warning('请选择国家'); return false }
  if (!row.detailArea.length) { ElMessage.warning('请选择城市'); return false }
  return true
}
const delAddress = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => {
      if (row.id) {
        loading.value = true
        try {
          await trailerApi.savePriv(setAddressData.value.id, { id: row.id, deleted: 1 })
          ElMessage.success('操作成功')
          pagination.page = 1
          getAddressList()
        } finally {
          loading.value = false
        }
      }
    })
    .catch(() => {})
}
const cancelEditAddress = row => {
  if (row.key) tableData.value = tableData.value.filter(item => (item.key ? item.key !== row.key : true))
  else row.isEditRow = false
}
const saveAddress = async (row, isAdd) => {
  if (!validate(row)) return
  const params = { ...row, tscId: setAddressData.value.id, isEditRow: undefined }
  params.streets = row.streetIds.map(item => {
    const street = streetList.value.find(e => e.id === item) || {}
    return { key: item, value: street.name }
  })
  loading.value = true
  try {
    await trailerApi.savePriv(setAddressData.value.id, params)
    ElMessage.success('操作成功')
    getAddressList(isAdd)
  } finally {
    loading.value = false
  }
}
const getAreaDetailList = async row => {
  detailAreaList.value = (await getTrailerAreas(row.countryId)).data || []
}
const getStreet = async row => {
  streetList.value = []
  if (row.detailArea.length !== 2) { ElMessage.warning('请选择城市'); return }
  streetList.value = (await getTrailerStreets(row.countryId, row.detailArea[1])).data || []
}
const detailAreaChange = async (val, row) => {
  row.detailAreaName = ''
  row.provinceId = val.length >= 1 ? val[0] : ''
  row.cityId = val.length >= 2 ? val[1] : ''
  const prov = detailAreaList.value.find(p => p.id === row.provinceId) || {}
  const city = (prov.children || []).find(c => c.id === row.cityId) || {}
  row.province = prov.name || ''
  row.city = city.name || ''
  if (val.length) {
    row.detailAreaName = `${row.province} ${row.city}`
    await getStreet(row)
  }
}
const countryChange = async (val, row) => {
  const country = props.countryList.find(e => e.id === val)
  detailAreaList.value = []
  row.country = country ? `${country.name}-${country.alias}` : ''
  row.detailArea = []
  await getAreaDetailList(row)
}

const getAddressList = async isAdd => {
  loading.value = true
  try {
    if (form.addressType === 0) {
      const res = (await trailerApi.getPrivList(setAddressData.value.id, { page: pagination.page, size: pagination.size })).data || {}
      const result = res.list || []
      tableData.value = result.map(item => ({
        ...item, isEditRow: false,
        detailArea: [item.provinceId, item.cityId].filter(Boolean),
        streetIds: item.streetIds || [],
        detailAreaName: `${item.province || ''} ${item.city || ''}`
      }))
      pagination.total = res.total || 0
      if (isAdd === 'isAdd') add()
    } else {
      const result = (await trailerApi.getAddrList(setAddressData.value.id, form.addressType)).data || []
      tableData.value = result
      selectAddress.value = result.map(e => e.addrId)
      if (!isArea.value) {
        form.countryId = result.reduce((list, item) => {
          if (item.countryId && list.indexOf(item.countryId) === -1) list.push(item.countryId)
          return list
        }, [])
      } else {
        form.countryId = (result[0] || {}).countryId
      }
      handleChange()
    }
  } finally {
    loading.value = false
  }
}

const confirm = async () => {
  const params = { delList: [], insList: [], tscId: setAddressData.value.id, type: form.addressType }
  const list = tableData.value.map(e => e.addrId)
  const oldCountry = (tableData.value[0] || {}).countryId
  list.forEach((e, i) => { if (selectAddress.value.indexOf(e) === -1) params.delList.push(tableData.value[i]) })
  selectAddress.value.forEach(e => {
    if (list.indexOf(e) === -1) {
      const tamp = transferList.value.find(item => item.id === e)
      if (tamp) params.insList.push({ addrId: tamp.id, addrName: tamp.fellName, countryId: tamp.countryId, tscId: setAddressData.value.id, type: form.addressType })
    }
  })
  if (isArea.value && oldCountry && oldCountry !== form.countryId) {
    params.delList = [...params.delList, ...tableData.value].reduce((del, item) => {
      if (!del.find(e => e.id === item.id)) del.push(item)
      return del
    }, [])
  }
  loading.value = true
  try {
    await trailerApi.saveAddrOther(params)
    ElMessage.success('添加成功')
    dialogClose()
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
