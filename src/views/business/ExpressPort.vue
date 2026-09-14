<template>
  <div>
    <!-- 列表视图 -->
    <div v-show="!showForm">
      <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
        <el-form-item>
          <el-select v-model="query.consignorCountryCode" placeholder="发货方国家" filterable clearable style="width: 160px">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.expressId" placeholder="快递公司" filterable clearable style="width: 160px">
            <el-option v-for="item in expressList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <template #actions>
          <el-button type="primary" :icon="CirclePlus" @click="handleAdd">新增</el-button>
        </template>
      </SearchBar>

      <PageCard>
        <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="160" @change="loadData">
          <!-- 源注释：服务编码列默认隐藏
          <template #col-codes="{ row }">{{ row.codes }}</template>
          -->
          <template #col-oil="{ row }">
            <el-button link type="primary" @click="handleOil(row)">燃油费率</el-button>
          </template>
          <template #col-ifEnable="{ row }">
            <el-switch
              :model-value="row.ifEnable"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
              @change="value => onStatus(row, value)"
            />
          </template>
          <template #actions="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </ProTable>
      </PageCard>
    </div>

    <!-- 新增/编辑内嵌表单 -->
    <ExpressPortForm v-if="showForm" ref="formRef" :country-list="countryList" :express-list="expressList" @back="onBack" @go="onGo" />

    <!-- 燃油费率 -->
    <Modal v-model="oilVisible" :title="`燃油费率-(${oilTitle})`" width="600px" :footer="false">
      <ExpressPortOil ref="oilRef" />
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery } from '@/utils/hooks'
import ExpressPortForm from './components/express-port-form.vue'
import ExpressPortOil from './components/express-port-oil.vue'
import {
  getExpressPortList, deleteExpressPort, changeExpressStatus, getCountryList, getExpressCompany
} from '@/api/modules/business'

defineOptions({ name: 'BizExpressPort' })

// 列表请求：源参数 { current, size, data: { consignorCountryCode, expressId } }
const fetchList = p => getExpressPortList({
  current: p.page, size: p.size, consignorCountryCode: p.consignorCountryCode, expressId: p.expressId
}).then(res => ({ data: { list: res.data.records, total: res.data.total } }))

const { query, list, total, loading, loadData, handleSearch, handleReset } =
  useListQuery(fetchList, { consignorCountryCode: '', expressId: '' })

const columns = [
  { prop: 'expressName', label: '快递公司', minWidth: 180 },
  // 源注释：服务编码列（codes）默认隐藏
  { prop: 'interfaceCode', label: '接口编码', minWidth: 140 },
  { prop: 'remarks', label: '备注', minWidth: 120 },
  { prop: 'consignorCountry', label: '发货方国家', width: 120 },
  { prop: 'consignorCompany', label: '发货方公司', minWidth: 140 },
  { prop: 'consignor', label: '发货联系人', width: 120 },
  { prop: 'oil', label: '燃油费率', width: 100 },
  { prop: 'ifEnable', label: '启用状态', width: 130, align: 'center' }
]

/* 下拉数据源 */
const countryList = ref([])
const expressList = ref([])
const loadCountry = async () => { countryList.value = (await getCountryList()).data || [] }
const loadExpress = async () => { expressList.value = ((await getExpressCompany({ page: 1, size: 99999, type: '4' })).data || {}).result || [] }

/* 新增/编辑内嵌表单 */
const showForm = ref(false)
const formRef = ref()
const handleAdd = () => { showForm.value = true; nextTickSetAdd() }
const handleEdit = row => { showForm.value = true; nextTickSetData(row) }
const nextTickSetAdd = () => setTimeout(() => formRef.value && formRef.value.setAdd(), 0)
const nextTickSetData = row => setTimeout(() => formRef.value && formRef.value.setData(row), 0)
const onBack = () => { showForm.value = false }
const onGo = () => { showForm.value = false; loadData() }

/* 状态切换（源 ifEnable 数字 1/0，切换式只传 id） */
const onStatus = (row, value) => {
  const olds = String(row.ifEnable)
  const news = String(value)
  if (!olds || olds === news) return
  const text = news === '0' ? '禁用' : '开启'
  ElMessageBox.confirm(`此操作将${text}该快递接口，是否继续？`, '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await changeExpressStatus({ id: row.id }); ElMessage.success('修改成功'); loadData() })
    .catch(() => loadData())
}

/* 燃油费率弹窗 */
const oilVisible = ref(false)
const oilTitle = ref('')
const oilRef = ref()
const handleOil = row => {
  oilTitle.value = `${row.codes}/${row.interfaceCode}`
  oilVisible.value = true
  setTimeout(() => oilRef.value && oilRef.value.setData(row), 0)
}

const handleDelete = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning', closeOnClickModal: false })
    .then(async () => { await deleteExpressPort([row.id]); ElMessage.success('删除成功'); loadData() })
    .catch(() => {})
}

onMounted(() => { loadCountry(); loadExpress() })
</script>
