<template>
  <div>
    <el-row type="flex" justify="space-between">
      <el-col :span="12">
        <el-button link type="primary" :icon="CirclePlus" style="margin-left: 10px" @click="addServerCode">新增邮编范围</el-button>
        <!-- 源 v-if="false"：一键复制入口默认隐藏 -->
        <el-button v-if="false" link type="primary" :icon="DocumentCopy" style="margin-left: 10px" @click="copyCode">一键复制</el-button>
      </el-col>
      <el-col :span="12" style="text-align: right">
        <el-select v-if="type === 'end'" v-model="desCode" size="small" filterable style="width: 200px" @change="queryAll(1)">
          <el-option v-for="(ele, index) in codeOptions" :key="index" :label="ele.code" :value="ele.code" />
        </el-select>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="pagedData" border style="width: 100%; margin: 10px 0">
      <el-table-column v-if="type === 'end'" min-width="160" prop="zonedId" label="目的地代码" />
      <el-table-column min-width="160" prop="postalS" label="开始邮编编码" />
      <el-table-column min-width="160" prop="postalE" label="结束邮编编码" />
      <el-table-column label="操作" width="160">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="editForm(scope.row)">编辑</el-button>
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CirclePlus, DocumentCopy } from '@element-plus/icons-vue'
import { expressApi } from '@/api/modules/service'

defineOptions({ name: 'ExpressPost' })
const props = defineProps({
  targetId: { type: [String, Number], default: null }, // 起运地/目的地 code
  escId: { type: [String, Number], default: null },
  type: { type: String, default: null } // start / end
})
const emit = defineEmits(['statChange', 'handleCopy'])

const loading = ref(false)
const tableData = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const codeOptions = ref([])
const desCode = ref('')

/* end 类型按 desCode（目的地代码）过滤 */
const filtered = computed(() => props.type === 'end' && desCode.value
  ? tableData.value.filter(r => r.zonedId === desCode.value)
  : tableData.value)
const pagedData = computed(() => {
  total.value = filtered.value.length
  const start = (page.value - 1) * size.value
  return filtered.value.slice(start, start + size.value)
})

const queryAll = async val => {
  if (val) page.value = val
  loading.value = true
  try {
    tableData.value = (await expressApi.getPostal(props.escId, props.type, props.targetId)).data
    total.value = filtered.value.length
  } finally {
    loading.value = false
  }
}

/* 目的地代码：先取目的地代码下拉，默认选第一项再查询 */
const queryAllDes = async () => {
  loading.value = true
  try {
    codeOptions.value = (await expressApi.getLocList(props.escId, 'end')).data
    if (codeOptions.value.length) desCode.value = codeOptions.value[0].code
    await queryAll(1)
  } finally {
    loading.value = false
  }
}

const addServerCode = () => {
  const data = props.type === 'start'
    ? { zonesId: props.targetId, id: null, postalE: '', postalS: '' }
    : { zonesId: props.targetId, id: null, postalE: '', postalS: '', zonedId: '' }
  emit('statChange', true, data, false)
}
const editForm = row => {
  const data = props.type === 'start'
    ? { zonesId: props.targetId, ...row }
    : { zonedId: props.targetId, ...row }
  emit('statChange', true, data, true)
}
const deletData = row => {
  ElMessageBox.confirm('请确认是否删除该条数据?', '温馨提示', { type: 'warning', closeOnClickModal: false })
    .then(async () => { await expressApi.removePostal(props.escId, props.type, props.targetId, row.id); ElMessage.success('删除成功'); queryAll() })
    .catch(() => {})
}
const copyCode = () => emit('handleCopy', desCode.value)

defineExpose({ queryAll, queryAllDes })
</script>
