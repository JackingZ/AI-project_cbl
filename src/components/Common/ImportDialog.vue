<template>
  <Modal
    :model-value="modelValue"
    :title="title"
    width="560px"
    confirm-text="确认导入"
    :confirm-loading="loading"
    @update:model-value="close"
    @confirm="submit"
  >
    <div class="import-dialog">
      <el-alert type="info" :closable="false" show-icon class="import-dialog__hint">
        <template #title>请先下载模板，按列顺序填写后上传（支持 .csv）。</template>
      </el-alert>

      <el-button link type="primary" :icon="Download" class="import-dialog__tpl" @click="downloadTemplate">
        下载导入模板
      </el-button>

      <el-upload
        drag
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        accept=".csv"
        :on-change="onFileChange"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处，或<em>点击上传</em></div>
      </el-upload>

      <div v-if="fileName" class="import-dialog__preview">
        已解析文件 <b>{{ fileName }}</b>，共 <b>{{ rows.length }}</b> 条有效数据。
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import { Download, UploadFilled } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'

// 通用批量导入弹窗：headers 定义列（label 用于模板表头，field 用于解析映射）
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '批量导入' },
  headers: { type: Array, required: true },
  sample: { type: Array, default: () => [] },
  // 导入执行函数：onImport(rows) -> Promise
  onImport: { type: Function, required: true }
})
const emit = defineEmits(['update:modelValue', 'done'])

const loading = ref(false)
const rows = ref([])
const fileName = ref('')

const downloadTemplate = () => {
  const head = props.headers.map(h => h.label).join(',')
  const demo = props.sample.length ? props.sample.join(',') : ''
  // 加 BOM 防止 Excel 打开中文乱码
  const blob = new Blob([`﻿${head}\n${demo}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title}模板.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const onFileChange = file => {
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '').replace(/^﻿/, '')
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    lines.shift() // 去掉表头
    rows.value = lines.map(line => {
      const cols = line.split(',')
      const obj = {}
      props.headers.forEach((h, i) => { obj[h.field] = (cols[i] || '').trim() })
      return obj
    }).filter(o => Object.values(o).some(v => v))
    fileName.value = file.name
  }
  reader.readAsText(file.raw, 'utf-8')
}

const reset = () => { rows.value = []; fileName.value = '' }
const close = () => { emit('update:modelValue', false); reset() }

const submit = async () => {
  if (!rows.value.length) return ElMessage.warning('请先上传包含数据的模板文件')
  loading.value = true
  try {
    await props.onImport(rows.value)
    ElMessage.success(`成功导入 ${rows.value.length} 条数据`)
    emit('done')
    close()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.import-dialog__hint { margin-bottom: $space-md; }
.import-dialog__tpl { margin-bottom: $space-sm; }
.import-dialog__preview {
  margin-top: $space-md;
  color: $text-secondary;
  font-size: $font-sm;
  b { color: $primary-color; }
}
</style>
