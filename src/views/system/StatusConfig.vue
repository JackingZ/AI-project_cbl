<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="服务大类">
        <el-select v-model="query.statusType" placeholder="全部" clearable style="width: 130px">
          <el-option v-for="t in STATUS_SERVICE_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序">
        <el-select v-model="query.sortDir" style="width: 120px">
          <el-option label="排序升序" value="asc" />
          <el-option label="排序降序" value="desc" />
        </el-select>
      </el-form-item>
    </SearchBar>

    <PageCard>
      <ProTable
        v-model:page="query.page"
        v-model:size="query.size"
        :data="list"
        :columns="columns"
        :loading="loading"
        :total="total"
        :action-width="180"
        @change="loadData"
      >
        <template #col-fileDownload="{ row }">
          <el-tag size="small" :type="row.fileDownload ? 'success' : 'info'">{{ row.fileDownload ? '是' : '否' }}</el-tag>
        </template>
        <template #col-perm="{ row }">
          <div class="status-cfg__perm">
            <div>仅查看：<span>{{ (row.viewRoles || []).join('、') || '—' }}</span></div>
            <div v-if="row.fileDownload">可下载：<span>{{ (row.fileRoles || []).join('、') || '—' }}</span></div>
          </div>
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('editPerm')" @click="openPerm(row)">权限设置</el-button>
          <el-button link type="primary" size="small" :disabled="!can('editDesc')" @click="openDesc(row)">修改描述</el-button>
        </template>
      </ProTable>
    </PageCard>

    <!-- 权限设置：5 角色 × (仅查看 / 可下载) 矩阵 -->
    <Modal v-model="permDlg.visible" :title="`权限设置 - ${permDlg.row?.statusName}`" width="560px" :confirm-loading="permDlg.loading" @confirm="savePerm">
      <el-table :data="STATUS_ROLES.map(r => ({ role: r }))" border size="small" style="width: 100%">
        <el-table-column prop="role" label="角色" min-width="140" />
        <el-table-column label="仅查看" width="120" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="viewMap[row.role]" />
          </template>
        </el-table-column>
        <el-table-column v-if="permDlg.row?.fileDownload" label="可下载文件" width="140" align="center">
          <template #default="{ row }">
            <el-checkbox v-model="fileMap[row.role]" />
          </template>
        </el-table-column>
      </el-table>
    </Modal>

    <!-- 修改描述：排序值 + 描述 -->
    <Modal v-model="descDlg.visible" title="修改描述" :confirm-loading="descDlg.loading" @confirm="saveDesc">
      <el-form ref="descRef" :model="descForm" :rules="descRules" label-width="90px">
        <el-form-item label="排序值" prop="sorted">
          <el-input-number v-model="descForm.sorted" :min="0" :max="999999" :step="1" style="width: 200px" />
        </el-form-item>
        <el-form-item label="描述" prop="describes">
          <el-input v-model="descForm.describes" type="textarea" :rows="4" placeholder="请输入状态描述" />
        </el-form-item>
      </el-form>
    </Modal>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, usePagePerms } from '@/utils/hooks'
import { required } from '@/utils/validate'
import { statusApi, STATUS_ROLES, STATUS_SERVICE_TYPES } from '@/api/modules/system'

defineOptions({ name: 'SysStatus' })
const { can } = usePagePerms()
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(statusApi.list, { statusType: '', sortDir: 'asc' })

const columns = [
  { prop: 'sorted', label: '排序值', width: 90, align: 'center' },
  { prop: 'statusName', label: '状态名称', minWidth: 160 },
  { prop: 'statusType', label: '服务大类', width: 100 },
  { prop: 'describes', label: '描述', minWidth: 160 },
  { prop: 'fileDownload', label: '是否有文件', width: 110, align: 'center' },
  { prop: 'perm', label: '权限（角色）', minWidth: 240 }
]

// 权限设置矩阵
const permDlg = reactive({ visible: false, loading: false, row: null })
const viewMap = reactive({})
const fileMap = reactive({})
const openPerm = row => {
  permDlg.row = row
  STATUS_ROLES.forEach(r => {
    viewMap[r] = (row.viewRoles || []).includes(r)
    fileMap[r] = (row.fileRoles || []).includes(r)
  })
  permDlg.visible = true
}
const savePerm = async () => {
  permDlg.loading = true
  try {
    const viewRoles = STATUS_ROLES.filter(r => viewMap[r])
    const fileRoles = permDlg.row.fileDownload ? STATUS_ROLES.filter(r => fileMap[r]) : []
    await statusApi.update(permDlg.row.id, { viewRoles, fileRoles })
    const row = list.value.find(r => r.id === permDlg.row.id)
    if (row) Object.assign(row, { viewRoles, fileRoles })
    permDlg.visible = false
    ElMessage.success('权限已保存')
  } finally {
    permDlg.loading = false
  }
}

// 修改描述
const descRef = ref(null)
const descDlg = reactive({ visible: false, loading: false, id: null })
const descForm = reactive({ sorted: 0, describes: '' })
const descRules = { sorted: [required('请输入排序值')] }
const openDesc = row => {
  descDlg.id = row.id
  descForm.sorted = row.sorted
  descForm.describes = row.describes
  descDlg.visible = true
  descRef.value?.clearValidate()
}
const saveDesc = async () => {
  await descRef.value.validate()
  descDlg.loading = true
  try {
    await statusApi.update(descDlg.id, { sorted: descForm.sorted, describes: descForm.describes })
    descDlg.visible = false
    loadData()
    ElMessage.success('描述已保存')
  } finally {
    descDlg.loading = false
  }
}
</script>

<style scoped lang="scss">
.status-cfg__perm {
  font-size: $font-sm;
  line-height: 1.6;
  color: $text-secondary;
  span { color: $text-primary; }
}
</style>
