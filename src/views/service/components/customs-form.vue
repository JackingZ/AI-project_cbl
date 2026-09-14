<template>
  <div v-loading="formLoading" class="customs-clearance-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit && !isCopy ? '编辑报关服务' : '新增报关服务' }}</div>
      <el-button type="primary" size="small" @click="goBack">返 回</el-button>
      <el-button type="primary" size="small" @click="saveData">保 存</el-button>
    </div>
    <div class="content">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="130px" size="small">
        <div class="form-title">基础信息</div>
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务简称" prop="abbr">
          <el-input v-model="form.abbr" :maxlength="10" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务编码" prop="csId">
          <el-input v-model="form.csId" :maxlength="25" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="所在国家" prop="countryId">
          <el-select v-model="form.countryId" filterable clearable placeholder="所在国家" style="width: 100%">
            <el-option v-for="item in countryList" :key="item.id" :label="`${item.name}-${item.alias}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="form.subtypeId" style="width: 100%" clearable filterable placeholder="请选择" @change="onServiceType">
            <el-option v-for="item in subTypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <!-- 出口报关件仅服务类型 '0'（空运）显示 -->
        <el-form-item v-if="form.subtypeId === '0'" label="出口报关件" prop="custom">
          <el-radio-group v-model="form.custom">
            <el-radio v-for="c in CUSTOM_EXPORT_LIST" :key="c.id" :label="c.id">{{ c.name }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="货币单位" prop="currencyId">
          <el-select v-model="form.currencyId" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadCurrency">
            <el-option v-for="item in currencyList" :key="item.id" :label="`${item.name}-${item.sign}`" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="form.belong" style="width: 100%" clearable placeholder="请选择">
            <el-option v-for="b in BELONG_LIST" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否快递报关" prop="express">
          <el-radio-group v-model="form.express">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <!--
          源含「是否提供进口商 isImporter」「默认进口商 importerId」两块 v-if="false" 隐藏，此处保留不放开。
        -->
        <el-form-item label="默认供应商" prop="custId">
          <el-select v-model="form.custId" clearable filterable style="width: 100%" placeholder="请选择" @focus="loadSupplier">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :maxlength="100" placeholder="请输入" />
        </el-form-item>
        <div class="form-title">运输条款</div>
      </el-form>
      <!-- 源 toast-ui MarkdownEditor 降级为 textarea -->
      <div>
        <el-input v-model="terms" type="textarea" :rows="10" placeholder="请输入运输条款" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { required } from '@/utils/validate'
import {
  customsApi, getCurrencyList, getSupplierOptions, CUSTOM_EXPORT_LIST, BELONG_LIST
} from '@/api/modules/service'

defineOptions({ name: 'TruckServiceForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null },
  subTypeData: { type: Array, default: () => [] },
  countryData: { type: Array, default: () => [] }
})
const emit = defineEmits(['back', 'save-success'])

const subTypeList = ref(props.subTypeData)
const countryList = ref(props.countryData)
const formLoading = ref(false)
const formRef = ref()
const terms = ref('')

const defaultForm = () => ({
  id: undefined, name: undefined, abbr: undefined, countryId: undefined,
  subtypeId: undefined, csId: undefined, belong: undefined,
  importerId: undefined, isImporter: false, express: false,
  custom: undefined, currencyId: undefined, custId: undefined, remark: undefined
})
const form = reactive(defaultForm())

const rules = {
  csId: [required('服务编码不能为空')],
  name: [required('服务名称不能为空')],
  abbr: [required('服务简称不能为空')],
  subtypeId: [required('请选择服务类型', 'change')],
  countryId: [required('请选择所在国家', 'change')],
  belong: [required('请选择分配客户', 'change')],
  express: [required('请选择是否快递报关', 'change')],
  custom: [required('请选择出口报关件', 'change')],
  currencyId: [required('请选择货币单位', 'change')]
}

/* 下拉数据源（focus 懒加载） */
const currencyList = ref([])
const supplierList = ref([])
const loadCurrency = async () => { currencyList.value = (await getCurrencyList()).data }
const loadSupplier = async () => { supplierList.value = (await getSupplierOptions()).data }

/* 服务类型切换：'0' 默认买单出口，其余清空 */
const onServiceType = val => {
  form.custom = val === '0' ? '0' : undefined
  form.custId = undefined
  form.importerId = undefined
  supplierList.value = []
}

onMounted(async () => {
  if (props.row) {
    // 复制：源去掉 id/name/alias/csId/abbr
    const src = { ...props.row }
    if (props.isCopy) { delete src.id; delete src.name; delete src.csId; delete src.abbr }
    const { terms: t, ...rest } = src
    Object.assign(form, defaultForm(), rest)
    terms.value = t || ''
  }
  if (props.isEdit) {
    formLoading.value = true
    await Promise.all([loadCurrency(), loadSupplier()])
    formLoading.value = false
  }
})

const goBack = () => emit('back')

const saveData = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    const c = countryList.value.find(x => x.id === form.countryId); if (c) form.countryName = c.name
    const s = subTypeList.value.find(x => x.id === form.subtypeId); if (s) form.subtypeName = s.name
    const su = supplierList.value.find(x => x.id === form.custId); if (su) form.custName = su.name
    const cur = currencyList.value.find(x => x.id === form.currencyId); if (cur) form.currencyName = cur.name
    formLoading.value = true
    try {
      await customsApi.save({ ...form, terms: terms.value })
      ElMessage.success('保存成功')
      emit('save-success')
    } finally {
      formLoading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.customs-clearance-edit {
  .el-form-item { display: inline-block; width: 24.9%; }
  .header-top {
    text-align: right; height: 50px; line-height: 50px; padding: 0 20px;
    font-size: 16px; color: #666; border-bottom: 1px solid #ccc;
  }
  .content {
    padding: 20px;
    .form-title {
      height: 35px; line-height: 35px; font-size: 16px; font-weight: 700;
      background: #f2f2f2; padding-left: 20px; margin-bottom: 20px;
    }
  }
}
</style>
