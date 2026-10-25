<template>
  <div>
    <!-- 服务组明细内嵌页（源 detail.vue，因源 chartClick 被注释入口未启用；保留 v-show 切换） -->
    <BillboardDetail v-show="detailShow" ref="detailRef" @close="detailShow = false" />

    <div v-show="!detailShow">
      <!-- 顶部标题 + 视图切换（head-info 降级为标题栏） -->
      <div class="bb-head">
        <span class="bb-head__title">销售看板</span>
        <el-radio-group v-model="viewType" @change="onView">
          <el-radio-button v-if="can('salesCompanyBillboard')" value="1">公司看板</el-radio-button>
          <el-radio-button v-if="can('salesDepartBillboard')" value="2">部门看板</el-radio-button>
          <el-radio-button v-if="can('salesMenBillboard')" value="3">员工看板</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 筛选区（右对齐；第一组，实际生效） -->
      <PageCard class="bb-filter">
        <el-form :inline="true" @submit.prevent>
          <el-form-item v-if="custType === '0'" label="所属公司">
            <el-select v-model="searchForm.parentId" clearable placeholder="请选择" style="width: 160px" @change="onCompany1">
              <el-option v-for="c in companyList" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="showComId" label="分公司">
            <el-select v-model="searchForm.comId" clearable placeholder="请选择" :disabled="custType === '0' && !searchForm.parentId" style="width: 160px" @change="onUnCompany1">
              <el-option v-for="c in unCompanyList1" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="viewType === '3'" label="部门">
            <el-tree-select v-model="searchForm.departId" :data="departmentList1" :disabled="!searchForm.comId" check-strictly style="width: 160px" placeholder="请选择" @change="onDepart1" />
          </el-form-item>
          <el-form-item label="年度">
            <el-date-picker v-model="searchForm.year" type="year" value-format="YYYY" placeholder="选择年度" style="width: 120px" @change="onYear1" />
          </el-form-item>
          <el-form-item label="期间">
            <el-select v-model="searchForm.period" :disabled="!searchForm.year" placeholder="请选择" style="width: 150px" @change="onFiscal1">
              <el-option v-for="f in fiscalList1" :key="f.id" :label="f.fiscalPeriod" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="周期">
            <el-select v-model="searchForm.week" placeholder="请选择" style="width: 200px" @change="onWeek1">
              <el-option v-for="w in weekList1" :key="w.id" :label="`第${w.id}周(${w.start}~${w.end})`" :value="w.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getPage">查询</el-button>
          </el-form-item>
        </el-form>
      </PageCard>

      <!-- 4 张统计卡（空运/海运/铁路/卡航） -->
      <div class="bb-cards">
        <div v-for="c in cardMeta" :key="c.key" class="bb-card">
          <SvgIconText :name="c.icon" :label="c.label" />
          <div class="bb-card__plan">{{ taskObj[c.plan] >= 0 ? `计划 ${taskObj[c.plan]} ${c.unit}` : '暂无计划' }}</div>
          <div class="bb-card__actual">{{ taskObj[c.actual] >= 0 ? taskObj[c.actual] : '--' }}</div>
          <div class="bb-card__percent" :class="taskObj[c.actual] < taskObj[c.plan] ? 'num-min' : 'num-max'">
            {{ taskObj[c.rate] != null ? taskObj[c.rate] + '%' : '--' }}
          </div>
        </div>
      </div>

      <!-- Tab（业务类型，两区块共用） -->
      <el-tabs v-model="activeName" @tab-change="handleClick">
        <el-tab-pane v-for="t in BIZ_TYPE_LIST" :key="t.id" :label="t.name" :name="t.id" />
      </el-tabs>

      <!-- 区块2：公司/部门/员工排名 图 + 排名列表 -->
      <div class="bb-block">
        <div class="bb-block__chart">
          <BillboardChart :rows="tableData2" :unit="unit" :height="360" />
        </div>
        <div class="bb-block__rank">
          <div class="bb-rank__title">{{ rank2Title }}</div>
          <div v-for="(item, i) in tableData2" :key="i" class="bb-rank__item">
            <span class="bb-rank__no" :class="{ 'tips-top': i < 3 }">{{ i + 1 }}</span>
            <span class="bb-rank__name">{{ item.name }}</span>
            <span class="bb-rank__val">{{ item.actualNum }} {{ unit }} · {{ item.percent }}%</span>
          </div>
          <el-empty v-if="!tableData2.length" description="暂无数据" :image-size="80" />
        </div>
      </div>

      <!-- 区块3：服务组排名 图 + 排名列表 -->
      <div class="bb-block">
        <div class="bb-block__chart">
          <BillboardChart :rows="tableData3" :unit="unit" :height="360" />
        </div>
        <div class="bb-block__rank">
          <div class="bb-rank__title">服务组排名</div>
          <div v-for="(item, i) in tableData3" :key="i" class="bb-rank__item">
            <span class="bb-rank__no" :class="{ 'tips-top': i < 3 }">{{ i + 1 }}</span>
            <span class="bb-rank__name">{{ item.groupName }}</span>
            <span class="bb-rank__val">{{ item.actualNum }} {{ unit }} · {{ item.percent }}%</span>
          </div>
          <el-empty v-if="!tableData3.length" description="暂无数据" :image-size="80" />
        </div>
      </div>

      <!--
        源含两个 v-if="false" 的独立筛选组（selectForm / serviceForm，模板 341-441、531-631 行），
        当前隐藏只保留 Tab；相关 onCompany2/3、onUnCompany2/3、onDepart2/3、onYear2/3、onFiscal2/3、onWeek2/3、
        handleTab、chartClick(打开 detail) 方法整段被注释。保留说明不放开。
      -->
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import BillboardChart from './components/BillboardChart.vue'
import BillboardDetail from './components/billboard-detail.vue'
import { usePagePerms } from '@/utils/hooks'
import {
  boardApi, BIZ_TYPE_LIST, unitByBiz,
  getCompanyOptions, getUnCompanyOptions, getDepartmentTree, getFiscalOptions, getWeekOptions
} from '@/api/modules/sales'

defineOptions({ name: 'SalesBillboard' })
const { can } = usePagePerms()
// 登录 custType 固定 mock（SYSTEM '0'）
const custType = ref('0')

// svg-icon 降级：以文字标签呈现（目标无 svg-icon air/boat/train/car 资源）
const SvgIconText = (props) => h('div', { class: 'bb-card__label' }, props.label)
SvgIconText.props = ['name', 'label']

const detailShow = ref(false)
const detailRef = ref(null)

/* 视图类型（权限 v-if） */
const viewType = ref('1')
const showComId = computed(() => viewType.value !== '1' && (custType.value === '0' || (custType.value === '2')))

/* 筛选（第一组，实际生效） */
const searchForm = reactive({ comType: '1', parentId: '', comId: '', departId: '', year: String(new Date().getFullYear()), period: '', week: '' })
const companyList = ref([])
const unCompanyList1 = ref([])
const departmentList1 = ref([])
const fiscalList1 = ref([])
const weekList1 = ref([])

/* 统计卡 */
const taskObj = reactive({})
const cardMeta = [
  { key: 'air', icon: 'air', label: '空运', plan: 'planAir', actual: 'actualAir', rate: 'air', unit: 'KG' },
  { key: 'sea', icon: 'boat', label: '海运', plan: 'planSea', actual: 'actualSea', rate: 'sea', unit: 'CBM' },
  { key: 'train', icon: 'train', label: '铁路', plan: 'planTrain', actual: 'actualTrain', rate: 'train', unit: 'CBM' },
  { key: 'car', icon: 'car', label: '卡航', plan: 'planCar', actual: 'actualCar', rate: 'car', unit: 'KG' }
]

/* Tab + 单位（activeName ∈ ['1','2'] → CBM，否则 KG） */
const activeName = ref('0')
const unit = computed(() => unitByBiz(activeName.value))

/* 排名 + 图 */
const tableData2 = ref([])
const tableData3 = ref([])
const rank2Title = computed(() => ({ '1': '公司排名', '2': '部门排名', '3': '员工排名' }[viewType.value] || '排名'))

onMounted(async () => {
  // 默认 viewType 按权限降序
  if (can('salesCompanyBillboard')) viewType.value = '1'
  else if (can('salesDepartBillboard')) viewType.value = '2'
  else if (can('salesMenBillboard')) viewType.value = '3'
  companyList.value = (await getCompanyOptions()).data
  unCompanyList1.value = (await getUnCompanyOptions()).data
  fiscalList1.value = (await getFiscalOptions()).data
  weekList1.value = (await getWeekOptions()).data
  searchForm.period = fiscalList1.value[0]?.id || ''
  searchForm.week = weekList1.value[0]?.id || ''
  await getPage()
})

/* 联动事件（对齐源 onXxx1） */
const onCompany1 = async () => {
  searchForm.comId = ''; searchForm.departId = ''
  unCompanyList1.value = (await getUnCompanyOptions()).data
}
const onUnCompany1 = async () => {
  searchForm.departId = ''
  departmentList1.value = (await getDepartmentTree(searchForm.comId)).data
}
const onDepart1 = () => {}
const onYear1 = async () => { fiscalList1.value = (await getFiscalOptions()).data }
const onFiscal1 = () => {}
const onWeek1 = () => {}
const onView = () => { getPage() }
const handleClick = () => { getPage() }

/* 查询：校验 → 卡片 + 两区块图 */
const currentId = computed(() => viewType.value === '1' ? (custType.value === '0' ? searchForm.parentId : '') : searchForm.comId)
async function getPage() {
  // 校验顺序（对齐源 $message.error 拦截）
  if (viewType.value === '1' && custType.value === '0' && !searchForm.parentId) return ElMessage.error('请选择所属公司')
  if (viewType.value !== '1' && !searchForm.comId) return ElMessage.error('请选择分公司')
  if (viewType.value === '3' && !searchForm.departId) return ElMessage.error('请选择部门')
  if (!searchForm.period) return ElMessage.error('请选择期间')
  const params = { ...searchForm, type: viewType.value, companyId: currentId.value, deptId: searchForm.departId, business: activeName.value }
  taskObj && Object.assign(taskObj, (await boardApi.getCard(params)).data)
  tableData2.value = (await boardApi.getChart(params)).data
  tableData3.value = (await boardApi.getGroupChart(params)).data
}
</script>

<style scoped lang="scss">
.bb-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: $space-md; }
.bb-head__title { font-size: $font-lg; font-weight: 600; }
.bb-filter { margin-bottom: $space-md; :deep(.el-form-item) { margin-bottom: 0; } }

.bb-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: $space-md; margin-bottom: $space-md; }
.bb-card {
  background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md;
  &__label { font-weight: 600; margin-bottom: $space-xs; }
  &__plan { font-size: $font-sm; color: $text-secondary; }
  &__actual { font-size: 24px; font-weight: 700; margin-top: $space-xs; }
  &__percent { font-size: $font-base; }
}
.num-min { color: #409EFF; }
.num-max { color: #FF9845; }

.bb-block {
  display: grid; grid-template-columns: 1fr 320px; gap: $space-md;
  background: $bg-card; border-radius: $card-radius; box-shadow: $shadow-sm; padding: $space-md; margin-bottom: $space-md;
}
.bb-rank__title { font-weight: 600; margin-bottom: $space-sm; }
.bb-rank__item { display: flex; align-items: center; gap: $space-sm; padding: 6px 0; border-bottom: 1px solid $border-color; }
.bb-rank__no {
  width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 50%;
  background: $bg-hover; color: $text-secondary; font-size: $font-sm;
}
.bb-rank__no.tips-top { background: #FF9845; color: #fff; }
.bb-rank__name { flex: 1; }
.bb-rank__val { color: $text-secondary; font-size: $font-sm; }
</style>
