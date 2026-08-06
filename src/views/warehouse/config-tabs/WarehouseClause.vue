<template>
  <div class="wc-sub">
    <div class="wc-sub__bar">
      <el-button type="primary" :disabled="!can('edit')" @click="saveClause">保存</el-button>
    </div>
    <!-- 对齐源 markdown-editor：编辑/预览双 tab + 加粗/斜体/标题工具（previewStyle:'tab'） -->
    <el-tabs v-model="tab" class="clause-tabs">
      <el-tab-pane label="编辑" name="edit">
        <div class="clause-tools">
          <el-button size="small" @click="wrap('## ', '')">标题</el-button>
          <el-button size="small" @click="wrap('**', '**')">加粗</el-button>
          <el-button size="small" @click="wrap('*', '*')">斜体</el-button>
        </div>
        <el-input ref="taRef" v-model="text" type="textarea" :rows="16" placeholder="请输入入库条款（支持 Markdown）" />
      </el-tab-pane>
      <el-tab-pane label="预览" name="preview">
        <div class="clause-preview" v-html="html" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { usePagePerms } from '@/utils/hooks'
import { wcClauseApi } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const text = ref('')
const tab = ref('edit')
const taRef = ref(null)
let recordId = null

// 极简 Markdown 渲染（标题/加粗/斜体/换行），仅用于预览
const html = computed(() =>
  text.value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/\n/g, '<br/>')
)

const load = async () => {
  const res = await wcClauseApi.list({ warehouseId: props.wsId, size: 1 })
  const row = res.data.list[0]
  recordId = row?.id ?? null
  text.value = row?.terms || ''
}
watch(() => props.wsId, load, { immediate: true })

// 在光标处包裹标记
const wrap = (pre, suf) => {
  const el = taRef.value?.textarea
  if (!el) { text.value += pre + suf; return }
  const s = el.selectionStart, e = el.selectionEnd
  const sel = text.value.slice(s, e)
  text.value = text.value.slice(0, s) + pre + sel + suf + text.value.slice(e)
}

const saveClause = async () => {
  if (recordId) await wcClauseApi.update(recordId, { terms: text.value })
  else await wcClauseApi.add({ warehouseId: props.wsId, terms: text.value })
  ElMessage.success('保存成功')
  load()
}
</script>

<style scoped lang="scss">
.wc-sub__bar { margin-bottom: 12px; }
.clause-tools { margin-bottom: 8px; display: flex; gap: 8px; }
.clause-preview {
  min-height: 360px; padding: 12px; border: 1px solid $border-color; border-radius: $radius-base;
  line-height: 1.7;
  :deep(h1) { font-size: 20px; margin: 8px 0; }
  :deep(h2) { font-size: 16px; margin: 8px 0; }
}
</style>
