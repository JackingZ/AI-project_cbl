<template>
  <div class="wc-sub sp">
    <div class="sp__head">
      <el-radio-group v-model="view" size="small">
        <el-radio-button value="0">按人员查看</el-radio-button>
        <el-radio-button value="1">按班次查看</el-radio-button>
        <el-radio-button value="2">按岗位查看</el-radio-button>
        <el-radio-button value="3">按操作中心查看</el-radio-button>
      </el-radio-group>
      <el-button type="primary" :disabled="!can('edit')" @click="openWeek">周期分配班次岗位</el-button>
    </div>

    <div class="sp__body">
      <div class="sp__cal">
        <el-calendar v-model="calDate">
          <template #date-cell="{ data }">
            <div class="cal-cell" :class="{ active: data.day === activeDay }" @click="pickDay(data.day)">
              <div class="cal-day">{{ data.day.split('-').slice(2).join('') }}</div>
              <div class="cal-tag">{{ attributeFilter(data.day) }}</div>
            </div>
          </template>
        </el-calendar>
      </div>

      <div class="sp__detail">
        <div class="sp__detail-bar">
          <span class="sp__date">{{ activeDay || '请选择日期' }}</span>
          <el-button link type="primary" :disabled="!activeDay || !can('add')" @click="addRow">新增明细</el-button>
        </div>
        <el-table :data="dayRows" border height="360">
          <el-table-column label="员工" min-width="130">
            <template #default="{ row }">
              <el-select v-if="row.isAdd" v-model="row.employeeId" filterable clearable size="small" @change="v => syncName(row, 'employee', v)">
                <el-option v-for="e in WC_EMPLOYEES" :key="e.id" :label="e.username" :value="e.id" />
              </el-select>
              <span v-else>{{ row.employeeName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属班次" min-width="120">
            <template #default="{ row }">
              <el-select v-if="row.isAdd" v-model="row.shiftId" size="small" @change="v => syncName(row, 'shift', v)">
                <el-option v-for="s in shiftList" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
              <span v-else>{{ row.shiftName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属岗位" min-width="120">
            <template #default="{ row }">
              <el-select v-if="row.isAdd" v-model="row.postId" size="small" @change="v => syncName(row, 'post', v)">
                <el-option v-for="p in WC_POSTS" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
              <span v-else>{{ row.postName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所属操作中心" min-width="130">
            <template #default="{ row }">
              <el-select v-if="row.isAdd" v-model="row.wcId" size="small" @change="v => syncName(row, 'wc', v)">
                <el-option v-for="c in centerList" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
              <span v-else>{{ row.wcName }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110">
            <template #default="{ row, $index }">
              <el-button v-if="!row.isEdit && !row.isAdd" link type="primary" size="small" @click="row.isAdd = true; row.isEdit = true">编辑</el-button>
              <el-button link type="danger" size="small" @click="removeRow($index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="isAddShow" class="sp__detail-foot">
          <el-button @click="cancelDay">取消</el-button>
          <el-button type="primary" @click="saveDay">保存</el-button>
        </div>
      </div>
    </div>

    <!-- 周期分配班次岗位 -->
    <Modal v-model="week.visible" title="周期设置班次岗位" width="900px" @confirm="saveWeek">
      <div class="week">
        <div class="week__list">
          <div v-for="w in WEEK_DATA" :key="w.id" class="week__item" :class="{ active: week.selected === w.id }" @click="week.selected = w.id">
            <div>{{ w.label }}</div>
            <div class="week__names">{{ weekNames(w.id) }}</div>
          </div>
        </div>
        <div class="week__detail">
          <div class="sp__detail-bar">
            <el-button link type="primary" @click="addWeekRow">新增明细</el-button>
          </div>
          <el-table :data="weekRows" border height="300">
            <el-table-column label="员工" min-width="120">
              <template #default="{ row }">
                <el-select v-model="row.employeeId" filterable size="small" @change="v => syncName(row, 'employee', v)">
                  <el-option v-for="e in WC_EMPLOYEES" :key="e.id" :label="e.username" :value="e.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="所属班次" min-width="110">
              <template #default="{ row }">
                <el-select v-model="row.shiftId" size="small" @change="v => syncName(row, 'shift', v)">
                  <el-option v-for="s in shiftList" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="所属岗位" min-width="110">
              <template #default="{ row }">
                <el-select v-model="row.postId" size="small" @change="v => syncName(row, 'post', v)">
                  <el-option v-for="p in WC_POSTS" :key="p.id" :label="p.name" :value="p.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="所属操作中心" min-width="120">
              <template #default="{ row }">
                <el-select v-model="row.wcId" size="small" @change="v => syncName(row, 'wc', v)">
                  <el-option v-for="c in centerList" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70">
              <template #default="{ $index }"><el-button link type="danger" size="small" @click="weekAll.splice(weekAll.indexOf(weekRows[$index]), 1)">移除</el-button></template>
            </el-table-column>
          </el-table>
          <div class="week__month">
            <span>应用月份：</span>
            <el-date-picker v-model="week.month" type="month" value-format="YYYY-MM" placeholder="选择月份" />
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Modal from '@/components/Common/Modal.vue'
import { usePagePerms } from '@/utils/hooks'
import { wcShiftPostApi, wcSchedulApi, wcCenterApi, WC_EMPLOYEES, WC_POSTS } from '@/api/modules/warehouse'

const props = defineProps({ wsId: { type: [String, Number], default: '' }, ctId: { type: String, default: '' } })
const { can } = usePagePerms('/warehouse/warehouse-config')

const view = ref('0')
const calDate = ref(new Date())
const activeDay = ref('')
const allRows = ref([])          // 全部明细（含各天）
const dayRows = ref([])          // 当前选中天的明细
const shiftList = ref([])
const centerList = ref([])

const WEEK_DATA = [
  { id: 2, label: '周一' }, { id: 3, label: '周二' }, { id: 4, label: '周三' }, { id: 5, label: '周四' },
  { id: 6, label: '周五' }, { id: 7, label: '周六' }, { id: 1, label: '周日' }
]

const load = async () => {
  const res = await wcShiftPostApi.res.list(o => o.warehouseId === Number(props.wsId))
  allRows.value = (res.data || res).map(r => ({ ...r, isAdd: false, isEdit: false }))
  const s = await wcSchedulApi.res.list(o => o.warehouseId === Number(props.wsId))
  shiftList.value = s.data || s
  const c = await wcCenterApi.res.list(o => o.warehouseId === Number(props.wsId))
  centerList.value = c.data || c
}
watch(() => props.wsId, load, { immediate: true })

// 日历格子聚合展示（按当前视图 join）
const attributeFilter = day => {
  const rows = allRows.value.filter(r => r.date === day)
  if (!rows.length) return ''
  const key = { 0: 'employeeName', 1: 'shiftName', 2: 'postName', 3: 'wcName' }[view.value]
  return [...new Set(rows.map(r => r[key]))].join('、')
}

const pickDay = day => {
  activeDay.value = day
  dayRows.value = allRows.value.filter(r => r.date === day).map(r => ({ ...r }))
}
const isAddShow = computed(() => dayRows.value.some(r => r.isAdd))

const emptyRow = () => ({ isAdd: true, isEdit: false, employeeId: '', employeeName: '', shiftId: '', shiftName: '', postId: '', postName: '', wcId: '', wcName: '', date: activeDay.value, warehouseId: props.wsId })
const addRow = () => { if (!activeDay.value) return ElMessage.warning('请先选择日期'); dayRows.value.push(emptyRow()) }
const removeRow = i => dayRows.value.splice(i, 1)

// 选择联动名称
const syncName = (row, kind, v) => {
  if (kind === 'employee') row.employeeName = WC_EMPLOYEES.find(e => e.id === v)?.username || ''
  if (kind === 'shift') row.shiftName = shiftList.value.find(s => s.id === v)?.name || ''
  if (kind === 'post') row.postName = WC_POSTS.find(p => p.id === v)?.name || ''
  if (kind === 'wc') row.wcName = centerList.value.find(c => c.id === v)?.name || ''
}

const cancelDay = () => pickDay(activeDay.value)
const saveDay = async () => {
  // 校验四项齐全 + 员工不重复（对齐源）
  for (const r of dayRows.value) {
    if (!r.employeeId || !r.shiftId || !r.postId || !r.wcId) return ElMessage.warning('请完整填写每行明细')
  }
  const ids = dayRows.value.map(r => r.employeeId)
  if (new Set(ids).size !== ids.length) return ElMessage.warning('同一天员工不可重复')
  // 覆盖当天：删旧增新
  const old = allRows.value.filter(r => r.date === activeDay.value)
  for (const o of old) await wcShiftPostApi.remove(o.id)
  for (const r of dayRows.value) {
    const { isAdd, isEdit, id, ...rest } = r
    await wcShiftPostApi.add(rest)
  }
  ElMessage.success('保存成功')
  await load()
  pickDay(activeDay.value)
}

/* 周期分配 */
const week = reactive({ visible: false, selected: 2, month: '' })
const weekAll = ref([])
const weekRows = computed(() => weekAll.value.filter(r => r.isWeek === week.selected))
const openWeek = () => { week.visible = true; week.selected = 2; week.month = ''; weekAll.value = [] }
const addWeekRow = () => weekAll.value.push({ isWeek: week.selected, employeeId: '', employeeName: '', shiftId: '', shiftName: '', postId: '', postName: '', wcId: '', wcName: '' })
const weekNames = id => [...new Set(weekAll.value.filter(r => r.isWeek === id).map(r => r.employeeName).filter(Boolean))].join('、')

// 计算某月中匹配 weekday 的所有日期（weekDay: 1周日..7周六，与源 weekData 对齐）
const datesOfMonthByWeekday = (month, weekId) => {
  const [y, m] = month.split('-').map(Number)
  const days = new Date(y, m, 0).getDate()
  const res = []
  for (let d = 1; d <= days; d++) {
    const jsDay = new Date(y, m - 1, d).getDay() // 0..6, 0=周日
    const wid = jsDay === 0 ? 1 : jsDay + 1       // 映射到 1周日/2周一..7周六
    if (wid === weekId) res.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return res
}
const saveWeek = async () => {
  if (!week.month) return ElMessage.warning('请选择应用月份')
  for (const r of weekAll.value) {
    if (!r.employeeId || !r.shiftId || !r.postId || !r.wcId) return ElMessage.warning('请完整填写每行明细')
  }
  // 按 weekday 展开到当月每一天，落库
  for (const w of WEEK_DATA) {
    const rows = weekAll.value.filter(r => r.isWeek === w.id)
    if (!rows.length) continue
    const dates = datesOfMonthByWeekday(week.month, w.id)
    for (const date of dates) {
      for (const r of rows) {
        const { isWeek, ...rest } = r
        await wcShiftPostApi.add({ ...rest, date, warehouseId: props.wsId })
      }
    }
  }
  ElMessage.success('周期分配已应用')
  week.visible = false
  await load()
  if (activeDay.value) pickDay(activeDay.value)
}
</script>

<style scoped lang="scss">
.sp__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.sp__body { display: flex; gap: 16px; }
.sp__cal { flex: 1; min-width: 0; :deep(.el-calendar__body) { padding: 8px; } }
.sp__detail { width: 560px; }
.sp__detail-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.sp__date { font-weight: 600; }
.sp__detail-foot { margin-top: 12px; text-align: right; }
.cal-cell { height: 100%; cursor: pointer; padding: 2px; &.active { background: $bg-hover; } }
.cal-day { font-size: 13px; }
.cal-tag { font-size: 12px; color: $primary-color; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.week { display: flex; gap: 16px; }
.week__list { width: 160px; }
.week__item { padding: 8px; border: 1px solid $border-color; border-radius: $radius-base; margin-bottom: 6px; cursor: pointer; &.active { border-color: $primary-color; } }
.week__names { font-size: 12px; color: $text-secondary; }
.week__detail { flex: 1; min-width: 0; }
.week__month { margin-top: 12px; display: flex; align-items: center; }
</style>
