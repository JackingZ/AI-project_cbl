<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="发布时间">
        <el-date-picker
          v-model="query.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 260px"
        />
      </el-form-item>
      <template #actions>
        <el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增版本</el-button>
      </template>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="260"
        @change="loadData"
      >
        <template #col-uploaded="{ row }">
          <el-tag size="small" :type="row.uploaded === '是' ? 'danger' : 'info'">{{ row.uploaded === '是' ? '强制更新' : '非强制' }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-switch
            :model-value="normalizeSwitchValue(row.status, '上线', '下线')"
            active-value="上线"
            inactive-value="下线"
            :disabled="!can('changeStatus')"
            @change="() => changeStatus(row)"
          />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" @click="openLog(row)">更新日志</el-button>
          <el-button link type="primary" size="small" :disabled="!can('loadApk')" @click="demoAction('下载 APK')">下载apk</el-button>
          <el-button link type="primary" size="small" @click="copyLink(row)">复制链接</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 新增版本 -->
    <Modal v-model="dialog.visible" title="新增版本" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="版本号" prop="versions">
          <el-input v-model="form.versions" maxlength="20" show-word-limit placeholder="如 V2.1.0" />
        </el-form-item>
        <el-form-item label="更新日志" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请输入更新日志（支持简单 HTML / 换行）" />
        </el-form-item>
        <el-form-item label="APK 文件" prop="apkUrl">
          <el-upload :show-file-list="false" :auto-upload="false" accept=".apk" :on-change="onApkChange">
            <el-button :icon="Upload">选择 .apk 文件</el-button>
          </el-upload>
          <span v-if="form.apkName" class="pda-cfg__apk">{{ form.apkName }}</span>
        </el-form-item>
        <el-form-item label="是否强制更新" prop="uploaded">
          <el-radio-group v-model="form.uploaded">
            <el-radio v-for="o in PDA_FORCE" :key="o" :value="o">{{ o }}</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </Modal>

    <!-- 更新日志查看 -->
    <Modal v-model="logDlg.visible" :title="`${logDlg.row?.versions} 更新日志`" width="560px">
      <div class="pda-cfg__log" v-html="logDlg.row?.content"></div>
      <template #footer><el-button type="primary" @click="logDlg.visible = false">关闭</el-button></template>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { required } from '@/utils/validate'
import { confirmDelete, confirmThen, demoAction } from '@/utils'
import { pdaApi, PDA_FORCE } from '@/api/modules/system'

defineOptions({ name: 'SysPda' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(pdaApi.list, { dateRange: [] })

const columns = [
  { prop: 'versions', label: '版本号', minWidth: 120 },
  { prop: 'createTime', label: '发布时间', minWidth: 170 },
  { prop: 'uploaded', label: '是否强制更新', minWidth: 130, align: 'center' },
  { prop: 'status', label: '状态', width: 100, align: 'center' }
]

// 新增版本
const formRef = ref(null)
const dialog = reactive({ visible: false, loading: false })
const form = reactive({ versions: '', content: '', apkUrl: '', apkName: '', uploaded: '否' })
const rules = {
  versions: [required('请输入版本号')],
  content: [required('请输入更新日志')],
  apkUrl: [required('请上传 APK 文件')],
  uploaded: [required('请选择是否强制更新')]
}
const openAdd = () => {
  Object.assign(form, { versions: '', content: '', apkUrl: '', apkName: '', uploaded: '否' })
  dialog.visible = true
  formRef.value?.clearValidate()
}
const onApkChange = file => {
  form.apkName = file.name
  form.apkUrl = `https://cdn.jht.com/pda/${file.name}` // 原型阶段占位链接
}
const submit = async () => {
  await formRef.value.validate()
  dialog.loading = true
  try {
    await pdaApi.add({ versions: form.versions, content: form.content, apkUrl: form.apkUrl, uploaded: form.uploaded, status: '下线' })
    ElMessage.success('新增成功')
    dialog.visible = false
    loadData()
  } finally {
    dialog.loading = false
  }
}

// 上线/下线（唯一线上版：上线某版本时其余自动下线）
const changeStatus = async row => {
  const toOnline = row.status !== '上线'
  await confirmThen(
    toOnline ? `确定将 ${row.versions} 上线？其余线上版本将自动下线。` : `确定将 ${row.versions} 下线？`,
    async () => {
      if (toOnline) {
        for (const r of pdaApi.res.raw()) {
          if (r.status === '上线' && r.id !== row.id) await pdaApi.update(r.id, { status: '下线' })
        }
      }
      await pdaApi.update(row.id, { status: toOnline ? '上线' : '下线' })
      loadData()
    },
    { success: toOnline ? '已上线' : '已下线' }
  )
}

// 删除（线上版禁止删除）
const remove = row => {
  if (row.status === '上线') return ElMessage.warning('线上版本不可删除，请先下线')
  confirmDelete(async () => { await pdaApi.remove(row.id); loadData() }, `确定删除版本 ${row.versions} 吗？`)
}

const copyLink = async row => {
  try {
    await navigator.clipboard.writeText(row.apkUrl)
    ElMessage.success('下载链接已复制')
  } catch {
    demoAction('复制下载链接')
  }
}

// 更新日志查看
const logDlg = reactive({ visible: false, row: null })
const openLog = row => { logDlg.row = row; logDlg.visible = true }
</script>

<style scoped lang="scss">
.pda-cfg__apk { margin-left: $space-sm; color: $text-secondary; font-size: $font-sm; }
.pda-cfg__log { line-height: 1.9; color: $text-primary; }
</style>
