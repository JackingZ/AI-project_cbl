<template>
  <div v-loading="formLoading" class="warehouse-edit">
    <div class="header-top">
      <div style="float: left">{{ isEdit && !isCopy ? '编辑仓储服务' : '新增仓储服务' }}</div>
      <el-button type="primary" size="small" @click="goBack">返 回</el-button>
      <el-button type="primary" size="small" @click="saveData">保 存</el-button>
    </div>
    <div class="content">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px" class="detail-form" size="small">
        <div class="form-title">基础信息</div>
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" :maxlength="50" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务简称" prop="abbr">
          <el-input v-model="form.abbr" :maxlength="10" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务编码" prop="serviceCode">
          <el-input v-model="form.serviceCode" :maxlength="25" show-word-limit placeholder="请输入" />
        </el-form-item>
        <el-form-item label="服务类型" prop="subtypeId">
          <el-select v-model="form.subtypeId" style="width: 100%" placeholder="请选择" filterable clearable @focus="loadSubtype">
            <el-option v-for="item in subtypeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配客户" prop="belong">
          <el-select v-model="form.belong" style="width: 100%" clearable placeholder="请选择">
            <el-option v-for="b in BELONG_LIST" :key="b.id" :label="b.name" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" :maxlength="100" placeholder="请输入" />
        </el-form-item>

        <div class="form-title">参数&配置</div>
        <el-form-item label="重量单位" prop="umWeight">
          <el-select v-model="form.umWeight" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadUmWeight">
            <el-option v-for="item in umWeightList" :key="item.value" :label="item.label + '-' + item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="体积单位" prop="umVolume">
          <el-select v-model="form.umVolume" style="width: 100%" placeholder="请选择" @focus="loadUmVolume">
            <el-option v-for="item in umVolumeList" :key="item.value" :label="item.label + '-' + item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="长度单位" prop="umLength">
          <el-select v-model="form.umLength" style="width: 100%" placeholder="请选择" clearable filterable @focus="loadUmLength">
            <el-option v-for="item in umLengthList" :key="item.value" :label="item.label + '-' + item.value" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否验货" prop="examine">
          <el-radio-group v-model="form.examine" @change="form.examineId = undefined">
            <el-radio :value="false">否</el-radio>
            <el-radio :value="true">是</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.examine" label="验货配置" prop="examineId">
          <el-select v-model="form.examineId" style="width: 100%" clearable filterable placeholder="请选择" @focus="loadExamine">
            <el-option v-for="item in examineList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>

        <div class="form-title">运输条款</div>
      </el-form>
      <!-- 源用 toast-ui MarkdownEditor；目标未装该库，降级为 textarea（与 WarehouseClause 一致） -->
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
  warehousingApi, getExamineList, getServiceSubtypeList, getWordsList, BELONG_LIST
} from '@/api/modules/service'

defineOptions({ name: 'TruckServiceForm' })
const props = defineProps({
  isEdit: { type: Boolean, default: false },
  isCopy: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['back', 'save-success'])

const formLoading = ref(false)
const formRef = ref()
const terms = ref('')

const defaultForm = () => ({
  id: undefined, name: undefined, abbr: undefined, serviceCode: undefined,
  subtypeId: undefined, subtypeName: undefined, belong: undefined, remark: undefined,
  umWeight: undefined, umVolume: undefined, umLength: undefined,
  examine: true, examineId: undefined, examineName: undefined
})
const form = reactive(defaultForm())

const rules = {
  name: [required('服务名称不能为空')],
  abbr: [required('服务简称不能为空')],
  serviceCode: [required('服务编码不能为空')],
  belong: [required('请选择分配客户', 'change')],
  umLength: [required('请选择长度单位', 'change')],
  umWeight: [required('请选择重量单位', 'change')],
  umVolume: [required('请选择体积单位', 'change')],
  examine: [required('请选择是否验货', 'change')],
  examineId: [required('请选择验货配置', 'change')]
}

/* 下拉数据源（源为 focus 懒加载） */
const subtypeList = ref([])
const examineList = ref([])
const umWeightList = ref([])
const umVolumeList = ref([])
const umLengthList = ref([])
const loadSubtype = async () => { subtypeList.value = (await getServiceSubtypeList('04')).data }
const loadExamine = async () => { examineList.value = (await getExamineList()).data }
const loadUmWeight = async () => { umWeightList.value = (await getWordsList('weight_type')).data }
const loadUmVolume = async () => { umVolumeList.value = (await getWordsList('VOLUME_TYPE')).data }
const loadUmLength = async () => { umLengthList.value = (await getWordsList('measurement_type')).data }

onMounted(async () => {
  if (props.row) {
    const { terms: t, ...rest } = props.row
    Object.assign(form, defaultForm(), rest)
    terms.value = t || ''
  }
  // 编辑/复制预载下拉，回显 label
  if (props.isEdit) {
    formLoading.value = true
    await Promise.all([loadSubtype(), loadExamine(), loadUmWeight(), loadUmVolume(), loadUmLength()])
    formLoading.value = false
  }
})

const goBack = () => emit('back')

const saveData = () => {
  formRef.value.validate(async valid => {
    if (!valid) return
    const it = examineList.value.find(e => e.id === form.examineId)
    if (it) form.examineName = it.name
    const st = subtypeList.value.find(s => s.id === form.subtypeId)
    if (st) form.subtypeName = st.name
    formLoading.value = true
    try {
      await warehousingApi.save({ ...form, terms: terms.value })
      ElMessage.success('保存成功')
      emit('save-success')
    } finally {
      formLoading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.detail-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  column-gap: 16px;

  .form-title { grid-column: 1 / -1; }
  :deep(.el-form-item) { width: 100%; min-width: 0; }
  :deep(.el-form-item__label) { white-space: nowrap; }
  :deep(.el-form-item__content) { min-width: 0; }
}
.warehouse-edit {
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
