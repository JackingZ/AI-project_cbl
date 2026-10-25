<template>
  <div class="pl-wrap">
    <!-- 左侧：筛选 + 卡片流 -->
    <PriceCardList
      title="快递报价"
      :cards="cardList"
      :loading="cardLoading"
      :current-id="currentId"
      :total="total"
      :page="page"
      :size="size"
      :show-add="can('add')"
      :can-copy="can('copy')"
      :can-view="can('view')"
      :can-delete="can('delete')"
      :menu-deletable="row => row.audit !== '1' && row.audit !== '3'"
      @add="addPrice"
      @row-click="onRow"
      @menu="onMenu"
      @update:page="onPage"
    >
      <template #search>
        <el-form :model="searchForm" class="pl-search" size="small">
          <el-form-item>
            <el-select v-model="searchForm.country" clearable filterable placeholder="起运国" style="width: 100%" @focus="getCountryList" @change="getTableData(1)">
              <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.subtypeId" :disabled="!searchForm.country" clearable filterable placeholder="服务" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in serviceList" :key="item.id" :label="item.label" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="searchForm.audit" clearable filterable placeholder="审核状态" style="width: 100%" @change="getTableData(1)">
              <el-option v-for="item in AUDIT_STR_LIST" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-popover v-model:visible="popoverShow" placement="bottom-start" trigger="click" width="360">
              <div class="pl-filter">
                <el-form-item label="有效时间" label-width="90px">
                  <el-date-picker v-model="searchForm.times" unlink-panels type="daterange" size="small" value-format="YYYY-MM-DD" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 250px" />
                </el-form-item>
                <el-form-item label="历史报价" label-width="90px">
                  <el-checkbox v-model="searchForm.history">显示历史报价</el-checkbox>
                </el-form-item>
                <div style="text-align: right">
                  <el-button @click="handleClear">清空</el-button>
                  <el-button v-if="can('query')" type="primary" @click="handleConfirm">筛选</el-button>
                </div>
              </div>
              <template #reference><el-input placeholder="全部筛选" readonly :suffix-icon="ArrowDown" /></template>
            </el-popover>
          </el-form-item>
        </el-form>
      </template>

      <template #card="{ item }">
        <el-row>
          <el-col :span="1">
            <el-tooltip effect="dark" :content="lookup(AUDIT_STR_LIST, item.audit)" placement="top">
              <i class="card-tips" :class="`card-tip-${item.audit}`" />
            </el-tooltip>
          </el-col>
          <el-col :span="19" class="word-limit">&nbsp;{{ (item.subtype || {}).value }}</el-col>
          <el-col :span="4" style="text-align: right">标准报价</el-col>
        </el-row>
        <el-row style="margin: 10px 0">
          <el-col :span="20" class="word-limit" style="color: #409eff">{{ item.expressName }}</el-col>
          <el-col :span="4" style="text-align: right">{{ CATEGORY_LABELS[item.category] }}</el-col>
        </el-row>
        <el-row>
          <el-col :span="4">
            <span v-if="item.status === '1'" class="btn-tip-green">生效中</span>
            <span v-else-if="item.status === '0'" class="btn-tip-blue">待生效</span>
            <span v-else class="btn-tip-grey">已失效</span>
          </el-col>
          <el-col :span="20" style="line-height: 16px">{{ formatTime(item.period) }}</el-col>
          <el-col :span="24" style="text-align: right; margin-top: 4px">
            <span class="border-tip-blue">{{ item.type === '0' ? '目的地代码' : '目的地区域' }}</span>
          </el-col>
        </el-row>
      </template>
    </PriceCardList>

    <!-- 右侧：详情/编辑 + 矩阵 -->
    <div v-loading="formLoading" class="pl-main">
      <div v-show="isRightShow">
        <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="90px" size="small" class="pl-form">
          <el-row>
            <el-col :span="18">
              <el-form-item label="起运国" prop="countryId">
                <el-select v-model="selectForm.countryId" :disabled="isEdit || !isAdd" style="width: 140px" clearable filterable placeholder="请选择" @focus="getCountryList" @change="onCountrySel">
                  <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item prop="escId" label="服务" label-width="75px">
                <el-tooltip v-if="selectForm.escName" effect="dark" :content="`${selectForm.escName}/${selectForm.expressCode}`" placement="top">
                  <el-select v-model="selectForm.escId" :disabled="isEdit || !isAdd || !selectForm.countryId" style="width: 200px" clearable filterable placeholder="请选择服务" @change="onServiceSel">
                    <el-option v-for="item in serviceList2" :key="item.id" :label="item.label" :value="item.id" />
                  </el-select>
                </el-tooltip>
                <el-select v-else v-model="selectForm.escId" :disabled="isEdit || !isAdd || !selectForm.countryId" style="width: 200px" clearable filterable placeholder="请选择服务" @change="onServiceSel">
                  <el-option v-for="item in serviceList2" :key="item.id" :label="item.label" :value="item.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="报价对象">SYSTEM</el-form-item>
            </el-col>
            <el-col :span="6" style="text-align: right">
              <template v-if="!isHistory && selectForm.status !== '2'">
                <el-button v-if="!isEdit && !isAdd && !editOther && selectForm.audit !== '1' && selectForm.audit !== '3' && can('edit')" type="primary" link size="small" @click="editRow">编辑</el-button>
                <el-button v-if="!isEdit && !isAdd && !editOther && selectForm.audit !== '1' && can('audit')" type="primary" link size="small" @click="onShow">审核</el-button>
                <el-button v-if="(isAdd || isEdit || editOther) && can('edit')" type="primary" link size="small" @click="cancelRow">取消</el-button>
                <el-button v-if="(isAdd || isEdit || editOther) && can('edit')" type="primary" link size="small" @click="saveRow">保存</el-button>
                <el-button v-if="!isAdd && !isEdit && !editOther && selectForm.audit !== '1' && selectForm.audit !== '3' && can('delete')" type="danger" link size="small" @click="deleteRow(1)">删除</el-button>
              </template>
              <template v-if="!isEdit && !isAdd && !editOther">
                <el-button v-if="can('copy')" type="primary" link size="small" @click="copyPrice">复制此版本</el-button>
                <el-button v-if="selectForm.audit === '1' && !historyId && can('invalid')" type="primary" link size="small" @click="invalidPrice">失效</el-button>
              </template>
            </el-col>
          </el-row>

          <div class="item-read">
            <el-form-item label="快递公司："><div>{{ selectForm.expressName }}</div></el-form-item>
            <el-form-item label="重量单位："><div style="width: 60px">{{ selectForm.umWeight }}</div></el-form-item>
            <el-form-item label="长度单位："><div style="width: 60px">{{ selectForm.umLength }}</div></el-form-item>
            <el-form-item label="货币单位：">
              <span v-if="selectForm.currencyId">{{ selectForm.currencyId }}</span><span v-if="selectForm.currencyName">{{ '-' + selectForm.currencyName }}</span>
            </el-form-item>
            <el-form-item label="邮编："><div style="width: 80px">{{ selectForm.consignorZip }}</div></el-form-item>
          </div>

          <el-row>
            <el-col :span="21">
              <el-form-item v-if="selectForm.subtypeId === '0' && selectForm.escId" label="目的地类型" prop="type" label-width="95px">
                <el-radio-group v-model="selectForm.type" :disabled="!isEdit && !isAdd" @change="onType">
                  <el-radio value="0">按目的地代码</el-radio>
                  <el-radio value="1">按目的地区域</el-radio>
                </el-radio-group>
              </el-form-item>
              <!-- 源计费规则 valuation / 单价最低重量 unitPriceMinWeight 为 v-if="false" 隐藏，保留不放开
              <el-form-item label="计费规则"><el-radio-group v-model="selectForm.valuation"><el-radio value="0">按首重续重</el-radio><el-radio value="1">按总价单价</el-radio></el-radio-group></el-form-item>
              <el-form-item label="单价最低重量"><el-input-number v-model="selectForm.unitPriceMinWeight" :controls="false" /></el-form-item>
              -->
              <el-form-item label="重量折扣" prop="weightDisCount" label-width="95px">
                <el-input-number v-model="selectForm.weightDisCount" :disabled="!isEdit && !isAdd" :controls="false" :min="0" :max="100" :precision="2" style="width: 120px" /><span>&nbsp;%</span>
              </el-form-item>
              <el-form-item label="手续费率" prop="handlingRate" label-width="95px">
                <el-input-number v-model="selectForm.handlingRate" :disabled="!isEdit && !isAdd" :controls="false" :min="0" :max="100" :precision="2" style="width: 120px" /><span>&nbsp;%</span>
              </el-form-item>
              <el-form-item label="有效时间" prop="times">
                <el-date-picker v-model="selectForm.times" :disabled="!isEdit && !isAdd" type="datetimerange" size="small" value-format="YYYY-MM-DD HH:mm:ss" range-separator="~" start-placeholder="起始时间" end-placeholder="截止时间" style="width: 310px" />
              </el-form-item>
            </el-col>
            <el-col :span="3" style="text-align: right">
              <el-select v-if="!isEdit && !isAdd" v-model="historyId" clearable filterable placeholder="历史版本" style="width: 100%" size="small" @change="onHistory">
                <el-option v-for="item in historyList" :key="item.id" :label="formatTime(item.period)" :value="item.id" />
              </el-select>
            </el-col>
          </el-row>

          <el-row v-if="isAdd || isEdit">
            <el-form-item v-if="selectForm.escId" label="重量区间" class="is-required">
              <el-button type="primary" size="small" plain @click="onRangeReset">已选择({{ tableData.length }})</el-button>
            </el-form-item>
          </el-row>

          <div v-if="!isEdit && !isAdd && selectForm.audit === '2'">
            <el-form-item label="拒绝原因：" label-width="90px" style="width: 100%">{{ selectForm.remark }}</el-form-item>
          </div>
        </el-form>

        <PriceMatrix
          :left-title="'重量区间'"
          :right-title="selectForm.type === '0' ? '目的地代码' : '目的地区域'"
          :columns="aAxisData"
          :data="tableData"
          :editable="isEdit || isAdd"
          :edit-remark="isEdit || isAdd || editOther"
          :show-prescription="false"
        />
      </div>
      <el-empty v-show="!isRightShow" description="请选择左侧报价查看详情" />
    </div>

    <!-- 审核弹窗（快递无分公司同步） -->
    <Modal v-model="auditShow" title="审核状态" width="600px" :footer="false" @closed="onHide">
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="110px" size="small" v-loading="selectLoading">
        <el-form-item label="审核状态：" prop="audit">
          <el-radio-group v-model="auditForm.audit"><el-radio value="1">通过</el-radio><el-radio value="2">拒绝</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item v-if="auditForm.audit === '2'" label="拒绝原因：" prop="remark">
          <el-input v-model="auditForm.remark" type="textarea" :rows="2" :maxlength="100" placeholder="请输入原因" />
        </el-form-item>
        <div style="text-align: right; padding-top: 10px"><el-button size="small" @click="onHide">取消</el-button><el-button type="primary" size="small" @click="auditRow">确认</el-button></div>
      </el-form>
    </Modal>

    <!-- 重量区间配置（单轴） -->
    <RangeConfigDialog
      ref="rangeRef"
      v-model="dialogRange"
      mode="one"
      title="重量区间"
      :loading="selectLoading"
      @save="saveRange"
    />
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import PriceCardList from './components/PriceCardList.vue'
import PriceMatrix from './components/PriceMatrix.vue'
import RangeConfigDialog from './components/RangeConfigDialog.vue'
import { required } from '@/utils/validate'
import { usePagePerms } from '@/utils/hooks'
import { expressApi, AUDIT_STR_LIST, CATEGORY_LABELS, buildAxis, lookup, getCountryOptions, getServiceOptions } from '@/api/modules/price'

defineOptions({ name: 'PriceExpress' })
const { can } = usePagePerms()

const cardList = ref([])
const cardLoading = ref(false)
const total = ref(0)
const page = ref(1)
const size = ref(10)
const popoverShow = ref(false)
const searchForm = reactive({ country: undefined, subtypeId: undefined, audit: undefined, history: false, times: [] })
const countryList = ref([])
const serviceList = ref([])
const serviceList2 = ref([])

const getTableData = async (p) => {
  if (p === 1) { page.value = 1; popoverShow.value = false }
  cardLoading.value = true
  try {
    const res = await expressApi.getList({ subtypeId: searchForm.subtypeId, audit: searchForm.audit, page: page.value, size: size.value })
    cardList.value = res.data.list
    total.value = res.data.total
  } finally { cardLoading.value = false }
}
const onPage = v => { page.value = v; getTableData() }
const handleClear = () => { Object.assign(searchForm, { history: false, times: [] }) }
const handleConfirm = () => { popoverShow.value = false; getTableData(1) }

const getCountryList = async () => { const res = await getCountryOptions(); countryList.value = res.data.result || [] }
const getServiceList = async () => { const res = await getServiceOptions(); serviceList.value = res.data.result || []; serviceList2.value = res.data.result || [] }

/* ------- 右侧 ------- */
const editForm = ref(null)
const formLoading = ref(false)
const selectLoading = ref(false)
const isRightShow = ref(false)
const isAdd = ref(false)
const isEdit = ref(false)
const editOther = ref(false)
const isHistory = ref(false)
const currentId = ref('')
const historyId = ref('')
const historyList = ref([])
const aAxisData = ref([])
const tableData = ref([])

const defaultSelectForm = () => ({ id: undefined, countryId: undefined, subtypeId: '0', escId: undefined, escName: undefined, expressCode: undefined, expressName: undefined, category: '0', type: '0', times: [], audit: undefined, status: undefined, remark: '', umWeight: undefined, umLength: undefined, currencyId: undefined, currencyName: undefined, consignorZip: undefined, weightDisCount: undefined, handlingRate: undefined })
const selectForm = reactive(defaultSelectForm())

const formRules = {
  countryId: [required('请选择起运国', 'change')],
  escId: [required('请选择服务', 'change')],
  type: [required('请选择目的地类型', 'change')],
  times: [required('请选择有效时间', 'change')]
}

const formatTime = obj => { const o = obj || {}; return `${(o.effect || '').slice(0, 16)} ~ ${(o.expire || '').slice(0, 16)}` }

const resetForm = () => {
  Object.assign(selectForm, defaultSelectForm())
  tableData.value = []; aAxisData.value = []
  currentId.value = ''; historyId.value = ''
  isHistory.value = false; isRightShow.value = false
  isAdd.value = false; isEdit.value = false; editOther.value = false
  editForm.value?.clearValidate()
}
const addPrice = () => { resetForm(); isRightShow.value = true; isAdd.value = true }

const onRow = async (item, isCopy = false) => {
  if (!can('view') && !can('copy')) return
  resetForm(); isRightShow.value = true; formLoading.value = true
  try {
    const res = await expressApi.getById(item.id)
    const d = res.data || {}
    currentId.value = isCopy ? '' : d.id
    Object.assign(selectForm, {
      id: isCopy ? undefined : d.id, countryId: d.countryId, subtypeId: (d.subtype || {}).key,
      escId: (d.esc || {}).key, escName: (d.esc || {}).value, expressCode: d.expressCode, expressName: d.expressName,
      category: d.category, type: d.type, audit: isCopy ? undefined : d.audit, status: isCopy ? undefined : d.status,
      remark: d.remark, umWeight: d.umWeight, umLength: d.umLength, currencyId: d.currencyId, currencyName: d.currencyName,
      consignorZip: d.consignorZip, weightDisCount: d.weightDisCount, handlingRate: d.handlingRate,
      times: d.period && d.period.effect && !isCopy ? [d.period.effect, d.period.expire] : []
    })
    const rows = (d.rows || []).map(r => ({ ...r }))
    const axis = buildAxis(rows)
    aAxisData.value = rows[0] ? rows[0].prices.map(p => ({ label: (p.x || {}).value })) : axis.columns
    tableData.value = rows
    await getServiceList()
    if (isCopy) { isAdd.value = true }
  } finally { formLoading.value = false }
}

const onCountrySel = () => { selectForm.escId = undefined }
const onServiceSel = async () => {
  if (!serviceList2.value.length) await getServiceList()
  const svc = serviceList2.value.find(it => it.id === selectForm.escId)
  if (svc) Object.assign(selectForm, { escName: svc.label, umWeight: svc.umWeight, umLength: svc.umLength, currencyId: svc.currencyId, currencyName: svc.currencyName })
}
const onType = () => { tableData.value = []; aAxisData.value = [] }

const editRow = () => { if (selectForm.audit !== '1' && selectForm.audit !== '3') isEdit.value = true; else editOther.value = true }
const cancelRow = async () => { if (editOther.value || isEdit.value) { const id = currentId.value; resetForm(); await onRow({ id }) } else resetForm() }

/* ------- 审核 ------- */
const auditFormRef = ref(null)
const auditShow = ref(false)
const auditForm = reactive({ audit: '1', remark: undefined })
const auditRules = { audit: [required('请选择审核状态', 'change')] }
const onShow = async () => {
  if (selectForm.audit === '0') { await expressApi.audit({ id: currentId.value, audit: '3' }); selectForm.audit = '3'; getTableData() }
  Object.assign(auditForm, { audit: '1', remark: undefined }); auditShow.value = true
}
const onHide = () => { auditShow.value = false; Object.assign(auditForm, { audit: undefined, remark: undefined }); auditFormRef.value?.clearValidate() }
const auditRow = async () => {
  if (auditForm.audit !== '1' && auditForm.audit !== '2') return
  selectLoading.value = true
  try { await expressApi.audit({ id: currentId.value, audit: auditForm.audit, reason: auditForm.remark }); ElMessage.success('审核成功'); onHide(); getTableData(); resetForm() }
  finally { selectLoading.value = false }
}

/* ------- 失效/删除/复制/历史 ------- */
const invalidPrice = () => {
  ElMessageBox.confirm('该操作会使此报价及相关代理报价失效，请确认是否操作?', '温馨提示', { type: 'warning' }).then(async () => {
    await expressApi.invalid(currentId.value); ElMessage.success('操作成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const deleteRow = (tag, row) => {
  const id = tag === 1 ? currentId.value : row.id
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning' }).then(async () => {
    await expressApi.remove(id); ElMessage.success('删除成功'); resetForm(); getTableData()
  }).catch(() => {})
}
const copyPrice = () => { onRow({ id: currentId.value }, true) }
const onHistory = async val => { if (!val) return; isHistory.value = true; await onRow({ id: val }) }

/* ------- 重量区间配置 ------- */
const rangeRef = ref(null)
const dialogRange = ref(false)
const onRangeReset = () => { if (!selectForm.escId) return ElMessage.error('请先选择服务'); rangeRef.value?.resetForm(); dialogRange.value = true }
const saveRange = () => { ElMessage.success('保存成功'); dialogRange.value = false }

/* ------- 保存 ------- */
const saveRow = async () => {
  await editForm.value.validate()
  const json = tableData.value.filter(it => !it.isUpper)
  if (!json.length) return ElMessage.error('暂未配置，无法报价')
  if (json.every(it => it.prices.every(p => !p.price && p.price !== 0))) return ElMessage.error('请至少填写一条报价')
  formLoading.value = true
  try {
    const payload = {
      id: selectForm.id, serviceType: '00', subtype: { key: '0', value: '快递' },
      esc: { key: selectForm.escId, value: selectForm.escName }, expressCode: selectForm.expressCode, expressName: selectForm.expressName,
      category: selectForm.category, type: selectForm.type,
      audit: selectForm.audit === '2' ? '0' : (selectForm.audit || '0'), status: selectForm.status || '0',
      countryId: selectForm.countryId, umWeight: selectForm.umWeight, umLength: selectForm.umLength,
      currencyId: selectForm.currencyId, currencyName: selectForm.currencyName, consignorZip: selectForm.consignorZip,
      weightDisCount: selectForm.weightDisCount, handlingRate: selectForm.handlingRate,
      period: { effect: (selectForm.times || [])[0], expire: (selectForm.times || [])[1] },
      deliveries: [], specials: [], rows: json
    }
    await expressApi.save(payload)
    ElMessage.success('保存成功'); resetForm(); getTableData()
  } finally { formLoading.value = false }
}

const onMenu = ({ action, row }) => { if (action === 'copy') onRow(row, true); else if (action === 'view') onRow(row); else if (action === 'delete') deleteRow(2, row) }

getCountryList(); getServiceList(); getTableData()
</script>

<style scoped lang="scss">
.pl-wrap { display: flex; flex-flow: row nowrap; min-height: inherit; }
.pl-main { flex: 1; overflow: auto; margin-left: 12px; background: $bg-card; border-radius: $card-radius; padding: 20px; }
.pl-search :deep(.el-form-item) { display: inline-block; vertical-align: top; width: 50%; padding-right: 4px; margin-bottom: 10px; }
.pl-filter :deep(.el-form-item) { margin-bottom: 10px; }
.pl-form :deep(.el-form-item) { display: inline-block; vertical-align: top; }
.item-read { background: #eaeef4; padding: 5px 10px; margin: 10px 0; :deep(.el-form-item) { margin-bottom: 0; } }
.card-tips { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; }
.card-tip-0 { background: #2291e6; }
.card-tip-1 { background: #189800; }
.card-tip-2 { background: #e12e2e; }
.card-tip-3 { background: #ff7d19; }
.word-limit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-tip-green { color: #189800; background: rgba(24, 152, 0, .2); padding: 2px; border-radius: 2px; }
.btn-tip-blue { color: #2291e6; background: rgba(34, 145, 230, .2); padding: 2px; border-radius: 2px; }
.btn-tip-grey { color: #909399; background: rgba(144, 147, 153, .2); padding: 2px; border-radius: 2px; }
.border-tip-blue { color: #2291e6; border: 1px solid #2291e6; padding: 1px 2px; border-radius: 2px; font-size: 12px; }
</style>