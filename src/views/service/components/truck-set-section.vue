<template>
  <Modal v-model="visible" :width="modelWidth" :footer="false">
    <template #title>
      <p>{{ `设置区间-${relevanceRow.name || ''}` }}</p>
      <p style="font-size: 14px; color: #606266">{{ text }}</p>
    </template>
    <div v-loading="loading">
      <el-form label-width="100px">
        <!-- 托数范围 -->
        <div v-if="sectionType === '1'">
          <el-form-item v-for="(section, index) in form.sectionList" :key="index" :label="index === 0 ? '托数范围' : ' '">
            <div class="item-after-icon">
              <el-input-number v-model="section.start" :controls="false" placeholder="输入下限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
              <el-input-number v-model="section.end" :controls="false" placeholder="输入上限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
              <el-icon v-if="index === 0" class="item-icon-plus" @click="addSection('sectionList')"><CirclePlus /></el-icon>
              <el-icon v-else class="item-icon-reduce" @click="removeSection(index, 'sectionList')"><RemoveFilled /></el-icon>
            </div>
          </el-form-item>
        </div>
        <!-- 里程范围 -->
        <div v-else-if="sectionType === '3'">
          <el-form-item v-for="(section, index) in form.mileageSectionList" :key="index" :label="index === 0 ? '里程范围' : ' '">
            <div class="item-after-icon">
              <el-input-number v-model="section.start" :controls="false" placeholder="输入下限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
              <el-input-number v-model="section.end" :controls="false" placeholder="输入上限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
              <el-icon v-if="index === 0" class="item-icon-plus" @click="addSection('mileageSectionList')"><CirclePlus /></el-icon>
              <el-icon v-else class="item-icon-reduce" @click="removeSection(index, 'mileageSectionList')"><RemoveFilled /></el-icon>
            </div>
          </el-form-item>
        </div>
        <!-- 重量范围 + 方数范围 -->
        <div v-else class="section-wrap">
          <div class="section">
            <el-form-item v-for="(section, index) in form.weightSectionList" :key="index" :label="index === 0 ? '重量范围' : ' '">
              <div class="item-after-icon">
                <el-input-number v-model="section.start" :controls="false" placeholder="输入下限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
                <el-input-number v-model="section.end" :controls="false" placeholder="输入上限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addSection('weightSectionList')"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="removeSection(index, 'weightSectionList')"><RemoveFilled /></el-icon>
              </div>
            </el-form-item>
          </div>
          <div class="section">
            <el-form-item v-for="(section, index) in form.volumeSectionList" :key="index" :label="index === 0 ? '方数范围' : ' '">
              <div class="item-after-icon">
                <el-input-number v-model="section.start" :controls="false" placeholder="输入下限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
                <el-input-number v-model="section.end" :controls="false" placeholder="输入上限" style="width: 45%" :min="0" :max="9999" step-strictly class="input-number-valiate" />
                <el-icon v-if="index === 0" class="item-icon-plus" @click="addSection('volumeSectionList')"><CirclePlus /></el-icon>
                <el-icon v-else class="item-icon-reduce" @click="removeSection(index, 'volumeSectionList')"><RemoveFilled /></el-icon>
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <div style="text-align: right; margin: 20px 40px 0">
        <el-button size="small" @click="cancel">取 消</el-button>
        <el-button type="primary" size="small" @click="save">保 存</el-button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CirclePlus, RemoveFilled } from '@element-plus/icons-vue'
import Modal from '@/components/Common/Modal.vue'
import { truckApi } from '@/api/modules/service'

defineOptions({ name: 'TruckSetSection' })
const emit = defineEmits(['saved'])

const visible = ref(false)
const loading = ref(false)
const text = '(取值范围：>=起始值， <结束值)'
const sectionType = ref('') // 1托数 2重量方数 3里程
const modelWidth = ref('700px')
const isEdit = ref(false)
const relevanceRow = ref({})
const emptyForm = () => ({
  sectionList: [{ start: 0, end: undefined }],
  mileageSectionList: [{ start: 0, end: undefined }],
  weightSectionList: [{ start: 0, end: undefined }],
  volumeSectionList: [{ start: 0, end: undefined }]
})
const form = reactive(emptyForm())

const showModel = async (row, type) => {
  sectionType.value = type
  modelWidth.value = type === '2' ? '960px' : '700px'
  relevanceRow.value = row
  Object.assign(form, emptyForm())
  visible.value = true
  await viewRange()
}
const viewRange = async () => {
  loading.value = true
  try {
    const priceType = sectionType.value === '3' ? '4' : relevanceRow.value.priceType
    const data = (await truckApi.viewRange(relevanceRow.value.id, priceType)).data || {}
    if (data.rangeList && data.rangeList.length) {
      isEdit.value = true
      if (sectionType.value === '1') form.sectionList = data.rangeList.map(i => ({ start: i.min, end: i.max }))
      if (sectionType.value === '2') {
        form.weightSectionList = data.rangeList.filter(e => e.type === '0').map(i => ({ start: i.min, end: i.max }))
        form.volumeSectionList = data.rangeList.filter(e => e.type === '1').map(i => ({ start: i.min, end: i.max }))
      }
      if (sectionType.value === '3') form.mileageSectionList = data.rangeList.map(i => ({ start: i.min, end: i.max }))
    } else {
      isEdit.value = false
    }
  } catch {
    isEdit.value = false
  } finally {
    loading.value = false
  }
}
const removeSection = (index, listName) => { form[listName] = form[listName].filter((_, i) => i !== index) }
const addSection = listName => { form[listName] = [...form[listName], { start: undefined, end: undefined }] }
const cancel = () => { Object.assign(form, emptyForm()); visible.value = false }

// 检验断层：后一段 start 必须等于前一段 end
const checkout = list => {
  for (let i = 1; i < list.length; i++) if (list[i].start !== list[i - 1].end) return false
  return true
}
// 校验必填
const checkoutRequired = list => list.every(item => !((item.start !== 0 && !item.start) || !item.end))

const save = async () => {
  let flag = true; let flag2 = true; let list = []
  let priceType = relevanceRow.value.priceType
  if (sectionType.value === '1') {
    flag = checkout(form.sectionList); flag2 = checkoutRequired(form.sectionList)
    list = form.sectionList.map(i => ({ max: i.end, min: i.start }))
  }
  if (sectionType.value === '2') {
    flag = checkout(form.weightSectionList) && checkout(form.volumeSectionList)
    flag2 = checkoutRequired(form.weightSectionList) && checkoutRequired(form.volumeSectionList)
    const w = form.weightSectionList.map(i => ({ max: i.end, min: i.start, type: '0' }))
    const v = form.volumeSectionList.map(i => ({ max: i.end, min: i.start, type: '1' }))
    list = w.concat(v)
  }
  if (sectionType.value === '3') {
    priceType = '4'
    flag = checkout(form.mileageSectionList); flag2 = checkoutRequired(form.mileageSectionList)
    list = form.mileageSectionList.map(i => ({ max: i.end, min: i.start }))
  }
  if (!flag2) { ElMessage.warning('区间范围不能为空'); return }
  if (!flag) { ElMessage.warning('区间不能出现断层'); return }
  await truckApi.saveRange({ ifEdit: isEdit.value, kscId: relevanceRow.value.id, priceType, rangeList: list })
  ElMessage.success('操作成功')
  cancel()
  emit('saved')
}

defineExpose({ showModel })
</script>

<style scoped lang="scss">
.input-number-valiate {
  width: 100%;
  :deep(.el-input__inner) { text-align: left; }
}
.section-wrap {
  display: flex; justify-content: space-between; position: relative;
  &::before {
    width: 4px; height: 100%; background: #eee; position: absolute;
    top: 50%; left: 50%; transform: translate(-50%, -50%); content: '';
  }
}
:deep(.el-form-item) { margin: 0; padding: 7px 0; }
.item-after-icon {
  position: relative;
  .item-icon-plus { position: absolute; top: 6px; color: #409eff; font-size: 18px; margin-left: 10px; cursor: pointer; }
  .item-icon-reduce { position: absolute; top: 6px; color: #f56c6c; font-size: 18px; margin-left: 10px; cursor: pointer; }
}
</style>
