<template>
  <div class="app-panel">
    <el-row>
      <el-col :span="6">
        <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="addServerCode">新增代码</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="pagedData" border style="width: 100%; margin: 10px 0">
      <el-table-column v-if="type === 'start'" min-width="100" prop="code" label="起运地代码" />
      <el-table-column v-if="type === 'end'" min-width="100" prop="code" label="目的地代码" />
      <el-table-column v-if="type === 'start'" label="起运地代码邮编" min-width="110">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="setPostStartRange(scope.row)">设置邮编范围</el-button>
        </template>
      </el-table-column>
      <el-table-column v-if="type === 'start'" label="目的地代码邮编" min-width="110">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="setPostEndRange(scope.row)">设置邮编范围</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" min-width="120" label="添加时间" />
      <el-table-column fixed="right" label="操作" width="160">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="editCode(scope.row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="deletData(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="size"
      layout="total, prev, pager, next"
      :total="total"
      style="text-align: right"
    />

    <!-- 编辑起运地/目的地代码 -->
    <Modal v-model="isAddEditVisible" :title="dialogTitle" width="550px" @confirm="saveConfirm" @closed="cancel">
      <el-form ref="editForm" :model="selectForm" :rules="formRules" label-width="110px" label-position="right">
        <el-form-item :label="type === 'start' ? '起运地代码' : '目的地代码'" prop="code">
          <el-input v-model="selectForm.code" :maxlength="20" clearable size="small" style="width: 90%" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 查看邮编范围 -->
    <Modal v-model="isPostVisible" :title="dialogPostTitle" width="850px" :footer="false">
      <ExpressPost
        ref="postRef"
        :target-id="targetId"
        :type="postType"
        :esc-id="escId"
        @stat-change="handleStateChange"
        @handle-copy="handleCopy"
      />
    </Modal>

    <!-- 新增/编辑邮编范围 -->
    <Modal v-model="isPostEditVisible" :title="dialogPostEditTitle" width="550px" @confirm="savePostConfirm" @closed="cancelPostEdit">
      <el-form ref="editPostForm" :model="selectPostForm" :rules="formPostRules" label-width="100px" label-position="right">
        <el-form-item v-if="postType === 'end'" label="目的地代码" prop="zonedId">
          <el-select v-model="selectPostForm.zonedId" size="small" filterable clearable style="width: 90%">
            <el-option v-for="(item, i) in targetCodeList" :key="i + item.code" :label="item.code" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始邮编" prop="postalS">
          <el-input v-model="selectPostForm.postalS" :maxlength="10" show-word-limit clearable size="small" style="width: 90%" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="结束邮编" prop="postalE">
          <el-input v-model="selectPostForm.postalE" :maxlength="10" show-word-limit clearable size="small" style="width: 90%" placeholder="请输入" />
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 复制邮编编码（起运地代码） -->
    <Modal v-model="isCopyVisible" title="复制邮编编码（起运地代码）" width="550px" @confirm="saveCopyConfirm" @closed="cancelCopy">
      <el-form ref="editCopyForm" :model="selectCopyForm" :rules="formCopyRules" label-width="120px" label-position="right">
        <el-form-item label="目的地代码" prop="sourceZonedId">
          <el-select v-model="selectCopyForm.sourceZonedId" size="small" filterable style="width: 90%">
            <el-option v-for="(ele, index) in targetCodeList" :key="index" :label="ele.code" :value="ele.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择复制对象" prop="escId">
          <el-select v-model="selectCopyForm.escId" size="small" filterable clearable style="width: 90%" placeholder="服务编码" @focus="getEscList" @change="handleCodeChange">
            <el-option v-for="item in codeList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="" prop="zonesId">
          <el-select v-model="selectCopyForm.zonesId" size="small" filterable clearable style="width: 90%" placeholder="起运地代码" @focus="getStartCodeList">
            <el-option v-for="(ele, index) in startCodeList" :key="index" :label="ele.code" :value="ele.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="" prop="targetZonedId">
          <el-select v-model="selectCopyForm.targetZonedId" size="small" filterable clearable placeholder="目的地代码" style="width: 90%" @focus="getTargetCodeList(2)">
            <el-option v-for="(ele, index) in copyTargetCodeList" :key="index" :label="ele.code" :value="ele.code" />
          </el-select>
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { CirclePlus } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import ExpressPost from './express-post.vue'
import { expressApi } from '@/api/modules/service'

defineOptions({ name: 'ExpressLocation' })
const props = defineProps({
  type: { type: String, default: null }, // start / end
  localData: { type: Object, default: () => ({}) }
})

const loading = ref(false)
const escId = ref('')
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const targetId = ref('') // 当前操作的 code
const postType = ref('start')

const pagedData = computed(() => {
  total.value = tableData.value.length
  const start = (page.value - 1) * size.value
  return tableData.value.slice(start, start + size.value)
})

const dialogTitle = computed(() => props.type === 'start'
  ? (isEdit.value ? '编辑起运地代码' : '新增起运地代码')
  : (isEdit.value ? '编辑目的地代码' : '新增目的地代码'))
const dialogPostTitle = computed(() => postType.value === 'start' ? '查看邮编范围（起运地代码）' : '查看邮编范围（目的地代码）')
const dialogPostEditTitle = computed(() => postType.value === 'start'
  ? (isPostEdit.value ? '编辑邮编编码（起运地代码）' : '新增邮编编码（起运地代码）')
  : (isPostEdit.value ? '编辑邮编编码（目的地代码）' : '新增邮编编码（目的地代码）'))

const queryAll = async val => {
  if (val) page.value = val
  loading.value = true
  try {
    tableData.value = (await expressApi.getLocList(escId.value, props.type)).data
    total.value = tableData.value.length
  } finally {
    loading.value = false
  }
}

/* 新增/编辑代码 */
const isAddEditVisible = ref(false)
const isEdit = ref(false)
const editForm = ref()
const selectForm = reactive({ id: undefined, code: undefined })
const codeValidator = (rule, value, cb) => {
  const reg = /[一-龥]/
  if (!value) cb(new Error('代码不能为空'))
  else if (reg.test(value)) cb(new Error('代码不能是中文'))
  else cb()
}
const formRules = { code: [{ required: true, message: '代码不能为空', trigger: 'blur' }, { validator: codeValidator, trigger: 'blur' }] }
const addServerCode = () => { isEdit.value = false; isAddEditVisible.value = true }
const editCode = row => { isEdit.value = true; Object.assign(selectForm, { id: undefined, code: undefined }, row); isAddEditVisible.value = true }
const cancel = () => { Object.assign(selectForm, { id: undefined, code: undefined }); editForm.value && editForm.value.clearValidate() }
const saveConfirm = () => {
  editForm.value.validate(async valid => {
    if (!valid) return
    await expressApi.saveLoc(escId.value, props.type, { ...selectForm })
    ElMessage.success('保存成功')
    isAddEditVisible.value = false
    queryAll()
  })
}
const deletData = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await expressApi.removeLoc(escId.value, props.type, row.id); ElMessage.success('删除成功'); queryAll() })
    .catch(() => {})
}

/* 邮编范围（嵌入 ExpressPost） */
const isPostVisible = ref(false)
const postRef = ref()
const setPostStartRange = row => {
  postType.value = 'start'; targetId.value = row.code; isPostVisible.value = true
  nextTick(() => postRef.value.queryAll(1))
}
const setPostEndRange = row => {
  postType.value = 'end'; targetId.value = row.code; isPostVisible.value = true
  nextTick(() => postRef.value.queryAllDes())
}

/* 新增/编辑邮编范围 */
const isPostEditVisible = ref(false)
const isPostEdit = ref(false)
const editPostForm = ref()
const targetCodeList = ref([])
const selectPostForm = reactive({ id: undefined, zonedId: undefined, postalE: undefined, postalS: undefined })
const postCodeValidator = (rule, value, cb) => {
  const reg = /[一-龥]/
  if (!value) cb(new Error('不能为空'))
  else if (reg.test(value)) cb(new Error('不能是中文'))
  else cb()
}
const formPostRules = {
  zonedId: [{ required: true, message: '目的的代码不能为空', trigger: 'change' }],
  postalS: [{ required: true, message: '起始邮编不能为空', trigger: 'blur' }, { validator: postCodeValidator, trigger: 'blur' }],
  postalE: [{ required: true, message: '结束邮编不能为空', trigger: 'blur' }, { validator: postCodeValidator, trigger: 'blur' }]
}
const handleStateChange = (state, form, edit) => {
  isPostEdit.value = edit
  isPostEditVisible.value = state
  if (state) Object.assign(selectPostForm, { id: undefined, zonedId: undefined, postalE: undefined, postalS: undefined }, form)
}
const cancelPostEdit = () => {
  Object.assign(selectPostForm, { id: undefined, zonedId: undefined, postalE: undefined, postalS: undefined })
  editPostForm.value && editPostForm.value.clearValidate()
}
const savePostConfirm = () => {
  editPostForm.value.validate(async valid => {
    if (!valid) return
    const code = postType.value === 'end' ? (selectPostForm.zonedId || targetId.value) : targetId.value
    await expressApi.savePostal(escId.value, postType.value, code, { ...selectPostForm })
    ElMessage.success('保存成功')
    isPostEditVisible.value = false
    isPostVisible.value = true
    nextTick(() => postRef.value.queryAll())
  })
}

/* 复制邮编编码 */
const isCopyVisible = ref(false)
const editCopyForm = ref()
const codeList = ref([])
const startCodeList = ref([])
const copyTargetCodeList = ref([])
const selectCopyForm = reactive({ escId: '', sourceZonedId: '', targetZonedId: '', zonesId: '' })
const formCopyRules = {
  sourceZonedId: [{ required: true, message: '目的地代码不能为空', trigger: 'change' }],
  escId: [{ required: true, message: '快递服务编码不能为空', trigger: 'change' }],
  zonesId: [{ required: true, message: '起运地代码不能为空', trigger: 'change' }],
  targetZonedId: [{ required: true, message: '目的地代码不能为空', trigger: 'change' }]
}
const handleCopy = val => { isCopyVisible.value = true; selectCopyForm.sourceZonedId = val }
const getEscList = async () => { codeList.value = (await expressApi.res.list()).map(x => ({ id: x.id, name: x.name })) }
const getStartCodeList = async () => {
  if (!selectCopyForm.escId) return
  startCodeList.value = (await expressApi.getLocList(selectCopyForm.escId, 'start')).data
}
const getTargetCodeList = async type => {
  if (type === 2 && !selectCopyForm.escId) return
  copyTargetCodeList.value = (await expressApi.getLocList(selectCopyForm.escId, 'end')).data
}
const handleCodeChange = () => {
  startCodeList.value = []; selectCopyForm.zonesId = ''
  copyTargetCodeList.value = []; selectCopyForm.targetZonedId = ''
}
const cancelCopy = () => {
  Object.assign(selectCopyForm, { escId: '', sourceZonedId: '', targetZonedId: '', zonesId: '' })
  editCopyForm.value && editCopyForm.value.clearValidate()
}
const saveCopyConfirm = () => {
  editCopyForm.value.validate(async valid => {
    if (!valid) return
    await expressApi.copyLoc({ sourceZonedId: selectCopyForm.sourceZonedId, targetZonedId: selectCopyForm.targetZonedId, zonesId: selectCopyForm.zonesId })
    ElMessage.success('复制成功')
    isCopyVisible.value = false
    cancelCopy()
  })
}

onMounted(() => {
  escId.value = props.localData?.id || ''
  if (escId.value) {
    queryAll(1)
    // end 目的地代码列表用于新增邮编时选择
    expressApi.getLocList(escId.value, 'end').then(res => { targetCodeList.value = res.data })
  }
})
</script>

<style scoped lang="scss">
.app-panel { padding: 0 10px; }
</style>
