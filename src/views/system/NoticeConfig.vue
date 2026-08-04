<template>
  <div>
    <PageCard title="通知配置">
      <p class="notice-cfg__tip">按通知类型配置每个通知项的通知方式（站内信 / 手机 / 邮箱 / 微信 / app）与通知接收人。</p>
      <el-table
        :data="treeData"
        row-key="key"
        default-expand-all
        border
        stripe
        :tree-props="{ children: 'children' }"
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="name" label="通知类型 / 通知项" min-width="220" />
        <el-table-column label="通知方式" min-width="420">
          <template #default="{ row }">
            <div v-if="row.isItem" class="notice-cfg__methods">
              <el-checkbox
                v-for="m in NOTICE_METHODS"
                :key="m.key"
                :model-value="row[m.key]"
                :label="m.label"
                :disabled="!can('editMethod')"
                @change="v => changeMethod(row, m.key, v)"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="通知人" min-width="160">
          <template #default="{ row }">
            <span v-if="row.isItem">{{ row.persons || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.isItem"
              link
              type="primary"
              size="small"
              :disabled="!can('editPerson')"
              @click="openPerson(row)"
            >修改通知接收人</el-button>
          </template>
        </el-table-column>
        <template #empty><Empty /></template>
      </el-table>
    </PageCard>

    <!-- 通知接收人配置弹窗（服务类型/业务类型/接收者 行内编辑，占位演示）-->
    <Modal v-model="personDlg.visible" title="修改通知接收人" width="720px" @confirm="savePerson">
      <p class="notice-cfg__tip">为「{{ personDlg.row?.name }}」配置接收者（按服务类型 / 业务类型选择接收人）。</p>
      <div class="notice-cfg__person-bar">
        <el-button type="primary" size="small" :icon="Plus" @click="addPersonRow">添加接收者</el-button>
      </div>
      <el-table :data="personRows" border size="small" style="width: 100%">
        <el-table-column label="服务类型" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.service" placeholder="选择服务" size="small" style="width: 100%">
              <el-option v-for="s in SERVICE_OPTS" :key="s" :label="s" :value="s" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="业务类型" min-width="140">
          <template #default="{ row }">
            <el-select v-model="row.subType" placeholder="选择业务" size="small" style="width: 100%">
              <el-option v-for="s in SUBTYPE_OPTS" :key="s" :label="s" :value="s" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="接收者" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.users" multiple collapse-tags placeholder="选择接收人" size="small" style="width: 100%">
              <el-option v-for="u in USER_OPTS" :key="u" :label="u" :value="u" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="personRows.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><Empty description="暂无接收者，请添加" /></template>
      </el-table>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Modal from '@/components/Common/Modal.vue'
import Empty from '@/components/Common/Empty.vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import { noticeCfgApi, NOTICE_METHODS } from '@/api/modules/system'

defineOptions({ name: 'SysNoticeCfg' })
const { can } = usePagePerms()

const SERVICE_OPTS = ['海运整柜', '海运拼箱', '空运专线', '国际快递', '卡车派送', '报关服务']
const SUBTYPE_OPTS = ['下单', '入仓', '运输', '到港', '签收', '结算']
const USER_OPTS = ['张三', '李四', '王五', '赵六', '客服组', '财务组']

const rows = ref([])
const loading = ref(false)

// 前端组装 通知类型(父) → 通知项(子) 树
const treeData = computed(() => {
  const groups = {}
  rows.value.forEach(r => {
    (groups[r.group] || (groups[r.group] = [])).push({ ...r, isItem: true, key: `i${r.id}` })
  })
  return Object.keys(groups).map(g => ({ key: `g${g}`, name: g, isItem: false, children: groups[g] }))
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await noticeCfgApi.res.list()
    rows.value = res.data
  } finally {
    loading.value = false
  }
}

// 通知方式勾选（源 updateNotificationMethodConfig）
const changeMethod = async (row, key, val) => {
  await noticeCfgApi.update(row.id, { [key]: val })
  const target = rows.value.find(r => r.id === row.id)
  if (target) target[key] = val
  ElMessage.success('通知方式已更新')
}

// 通知接收人弹窗（源 noticeUpdataPerson）
const personDlg = ref({ visible: false, row: null })
const personRows = ref([])
const openPerson = row => {
  personDlg.value = { visible: true, row }
  personRows.value = (row.persons ? String(row.persons).split('、') : []).map(p => ({ service: SERVICE_OPTS[0], subType: SUBTYPE_OPTS[0], users: [p] }))
}
const addPersonRow = () => personRows.value.push({ service: '', subType: '', users: [] })
const savePerson = async () => {
  const persons = [...new Set(personRows.value.flatMap(r => r.users))].join('、')
  await noticeCfgApi.update(personDlg.value.row.id, { persons })
  const target = rows.value.find(r => r.id === personDlg.value.row.id)
  if (target) target.persons = persons
  personDlg.value.visible = false
  ElMessage.success('通知接收人已保存')
}

useActivatedRefresh(loadData)
</script>

<style scoped lang="scss">
.notice-cfg__tip {
  color: $text-secondary;
  font-size: $font-sm;
  margin-bottom: $space-md;
}
.notice-cfg__methods {
  display: flex;
  flex-wrap: wrap;
  gap: $space-md;
}
.notice-cfg__person-bar {
  margin-bottom: $space-sm;
}
</style>
