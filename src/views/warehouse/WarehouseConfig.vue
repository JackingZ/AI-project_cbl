<template>
  <div>
    <!-- 更多：仓库配置二级子系统（对齐源 tabsData） -->
    <PageCard v-if="more.show">
      <div class="wc-more-head">
        <h3>仓库配置 - {{ more.row.name }}</h3>
        <el-button link type="primary" @click="more.show = false">返 回</el-button>
      </div>
      <TabsData :ws-id="more.row.id" :ws-nm="more.row.name" :ct-id="more.row.custId || ''" />
    </PageCard>

    <template v-else>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="仓库名称"><el-input v-model="query.name" placeholder="请输入名称" clearable style="width: 170px" /></el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="启用" value="1" />
          <el-option label="禁用" value="0" />
        </el-select>
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button>
      </template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="280" @change="loadData">
        <template #col-region="{ row }">
          <span v-if="row.stateName">{{ row.stateName }}</span>
          <span v-if="row.cityName"> &gt; {{ row.cityName }}</span>
        </template>
        <template #col-weight="{ row }">{{ row.weight }} {{ row.unitOfWeight }}</template>
        <template #col-unloading="{ row }">{{ row.unloading === 1 ? '√' : '--' }}</template>
        <template #col-forklift="{ row }">{{ row.forklift === 1 ? '√' : '--' }}</template>
        <template #col-supervise="{ row }">{{ row.supervise === 1 ? '√' : '--' }}</template>
        <template #col-transfer="{ row }">{{ row.transfer === 1 ? '√' : '--' }}</template>
        <template #col-status="{ row }">
          <el-switch :model-value="normalizeSwitchValue(row.status)" active-value="1" inactive-value="0" :disabled="!can('edit')" @change="v => toggleStatus(row, v)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('config')" @click="openSvc(row)">设置服务</el-button>
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
          <el-button link type="primary" size="small" @click="openMore(row)">更多</el-button>
        </template>
      </ProTable>
    </PageCard>
    </template>

    <!-- 新增/编辑（对齐源：名称/地区/邮编/地址/入库限重+单位/卸货平台·叉车·监管仓·中转仓 开关） -->
    <Modal v-model="dialog.visible" :title="dialog.isEdit ? '编辑仓库' : '新增仓库'" width="720px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="wc-form">
        <el-form-item label="仓库名称" prop="name"><el-input v-model="form.name" placeholder="请输入名称" /></el-form-item>
        <el-form-item label="仓库编码" prop="code"><el-input v-model="form.code" placeholder="请输入编码" /></el-form-item>
        <el-form-item label="国家/地区" prop="countryName">
          <el-select v-model="form.countryName" filterable placeholder="请选择" style="width: 100%" @change="onCountry">
            <el-option v-for="c in COUNTRY_OPTS" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="州/省" prop="stateName"><el-input v-model="form.stateName" placeholder="请输入州/省" /></el-form-item>
        <el-form-item label="城市" prop="cityName"><el-input v-model="form.cityName" placeholder="请输入城市" /></el-form-item>
        <el-form-item label="仓库邮编" prop="postal"><el-input v-model="form.postal" :maxlength="10" placeholder="请输入邮编" /></el-form-item>
        <el-form-item label="仓库地址" prop="address" class="wc-form__full"><el-input v-model="form.address" placeholder="请输入详细地址" /></el-form-item>
        <el-form-item label="入库限重" prop="weight">
          <el-input v-model.number="form.weight" type="number" placeholder="请输入限重">
            <template #append>
              <el-select v-model="form.unitOfWeight" style="width: 80px">
                <el-option v-for="u in WEIGHT_UNITS" :key="u" :label="u" :value="u" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="卸货平台"><el-switch :model-value="normalizeSwitchValue(form.unloading, 1, 0)" :active-value="1" :inactive-value="0" @update:model-value="form.unloading = $event" /></el-form-item>
        <el-form-item label="叉车"><el-switch :model-value="normalizeSwitchValue(form.forklift, 1, 0)" :active-value="1" :inactive-value="0" @update:model-value="form.forklift = $event" /></el-form-item>
        <el-form-item label="监管仓"><el-switch :model-value="normalizeSwitchValue(form.supervise, 1, 0)" :active-value="1" :inactive-value="0" @update:model-value="form.supervise = $event" /></el-form-item>
        <el-form-item label="中转仓"><el-switch :model-value="normalizeSwitchValue(form.transfer, 1, 0)" :active-value="1" :inactive-value="0" @update:model-value="form.transfer = $event" /></el-form-item>
      </el-form>
    </Modal>

    <!-- 设置服务（源 settingService：多选仓库支持的服务大类） -->
    <Modal v-model="svc.visible" :title="`设置服务 - ${svc.row.name || ''}`" width="640px" :confirm-loading="svc.loading" @confirm="saveSvc">
      <div class="sub-tip">选择该仓库支持的服务大类</div>
      <el-transfer v-model="svc.selected" :data="SVC_OPTIONS" :titles="['可选服务', '已启用']" filterable />
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import TabsData from './config-tabs/TabsData.vue'
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { required } from '@/utils/validate'
import { configApi, WEIGHT_UNITS } from '@/api/modules/warehouse'

defineOptions({ name: 'WhConfig' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(configApi.list, { name: '', status: '' })
const columns = [
  { prop: 'name', label: '仓库名称', minWidth: 130 },
  { prop: 'countryName', label: '国家/地区', width: 120 },
  { prop: 'region', label: '州省市区', minWidth: 150 },
  { prop: 'postal', label: '仓库邮编', width: 100 },
  { prop: 'address', label: '仓库地址', minWidth: 160 },
  { prop: 'weight', label: '入库限重', width: 120 },
  { prop: 'unloading', label: '卸货平台', width: 90, align: 'center' },
  { prop: 'forklift', label: '叉车', width: 80, align: 'center' },
  { prop: 'supervise', label: '监管仓', width: 90, align: 'center' },
  { prop: 'transfer', label: '中转仓', width: 90, align: 'center' },
  { prop: 'status', label: '状态', width: 90, align: 'center' },
  { prop: 'createTime', label: '添加时间', width: 160 }
]
const COUNTRY_OPTS = ['美国', '德国', '日本', '英国', '澳大利亚']
const rules = { name: [required('请输入名称')], code: [required('请输入编码')] }
const defaultForm = () => ({ name: '', code: '', countryName: '', stateName: '', cityName: '', postal: '', address: '', weight: undefined, unitOfWeight: 'KG', unloading: 0, forklift: 0, supervise: 0, transfer: 0, status: '1' })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: configApi, defaultForm, reload: loadData, label: '仓库' })
const onCountry = () => { form.stateName = ''; form.cityName = '' }
const toggleStatus = (row, v) => { configApi.update(row.id, { status: v }).then(() => { ElMessage.success('操作成功'); loadData() }) }

// 更多：进入仓库配置二级子系统（班次/岗位/分拣口/操作中心/库位/转仓/条款/成本项目）
const more = reactive({ show: false, row: {} })
const openMore = row => { more.row = row; more.show = true }

// 设置服务（源 settingService：多选服务大类，存该仓库 services）
const SVC_OPTIONS = ['卸货', '计量', '验货', '拆柜', '打托', '换单', '出库', '调拨', '盘点'].map(v => ({ key: v, label: v }))
const svc = reactive({ visible: false, loading: false, row: {}, selected: [] })
const openSvc = row => {
  svc.row = row
  svc.selected = [...(row.services || [])]
  svc.visible = true
}
const saveSvc = async () => {
  svc.loading = true
  try {
    await configApi.update(svc.row.id, { services: [...svc.selected] })
    ElMessage.success('服务配置已保存')
    svc.visible = false
    loadData()
  } finally {
    svc.loading = false
  }
}
</script>

<style scoped lang="scss">
.wc-form { display: flex; flex-wrap: wrap; :deep(.el-form-item) { width: 50%; } &__full { width: 100% !important; } }
.sub-tip { margin-bottom: 12px; color: $text-secondary; font-size: $font-sm; }
.wc-more-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; h3 { margin: 0; font-size: 16px; font-weight: 500; color: $text-primary; } }
</style>
