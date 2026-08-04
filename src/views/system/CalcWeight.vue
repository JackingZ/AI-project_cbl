<template>
  <PageCard>
    <el-alert type="success" :closable="false" style="margin-bottom: 12px">
      <template #title>
        长度单位：CM，重量单位：KG　　从左到右依次是：批次箱数，单箱实重，单箱长度，单箱宽度，单箱高度
      </template>
    </el-alert>

    <el-row :gutter="30">
      <el-col :span="10">
        <el-form ref="formRef" :model="ruleForm" :rules="rules" label-width="130px">
          <el-form-item label="结算重量算法" prop="a1">
            <el-select v-model="ruleForm.a1" placeholder="请选择" style="width: 100%">
              <el-option label="取实重" :value="1" />
              <el-option label="取实重或体积重的最大值" :value="2" />
              <el-option label="取实重或体积重的平均值" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="ruleForm.a1 === 2" label="分泡比率(%)" prop="bubble">
            <el-input v-model.number="ruleForm.bubble" type="number" step="0.01" />
          </el-form-item>
          <el-form-item label="单箱最低收费重" prop="boxLowestWeight">
            <el-input v-model.number="ruleForm.boxLowestWeight" type="number" step="0.01" clearable />
          </el-form-item>
          <el-form-item label="单票最低收费重" prop="orderLowestWeight">
            <el-input v-model.number="ruleForm.orderLowestWeight" type="number" step="0.01" clearable />
          </el-form-item>
          <el-form-item v-if="ruleForm.a1 === 2" label="多件重量算法" prop="a2">
            <el-radio-group v-model="ruleForm.a2">
              <el-radio :value="1">先累加后比较</el-radio>
              <el-radio :value="2">先比较后累加</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="14">
        <el-row v-for="(item, index) in boxForm" :key="index" type="flex" style="align-items: center; margin-bottom: 22px">
          <div style="color: #606266; font-size: 14px">批次{{ index + 1 }}</div>
          <el-input v-model.number="item.beachTotal" type="number" step="0.01" clearable placeholder="总箱数" style="width: 100px; margin-left: 10px" />
          <el-input v-model.number="item.weight" type="number" step="0.01" clearable placeholder="单箱实重" style="width: 100px; margin-left: 10px" />
          <el-input v-model.number="item.length" type="number" step="0.01" clearable placeholder="单箱长度" style="width: 100px; margin-left: 10px" />
          <el-input v-model.number="item.width" type="number" step="0.01" clearable placeholder="单箱宽度" style="width: 100px; margin-left: 10px" />
          <el-input v-model.number="item.height" type="number" step="0.01" clearable placeholder="单箱高度" style="width: 100px; margin-left: 10px" />
          <el-icon v-if="index === 0" class="calc-icon calc-icon--add" @click="addBeatch"><CirclePlus /></el-icon>
          <el-icon v-else class="calc-icon calc-icon--del" @click="delBeatch(index)"><Remove /></el-icon>
        </el-row>
      </el-col>
    </el-row>

    <el-row type="flex" justify="end">
      <el-button type="primary" @click="submitForm">计算</el-button>
      <el-button @click="reset">重置</el-button>
    </el-row>
    <el-row>
      <div class="calc-result">
        <p v-show="isBubble !== null">是否需要分泡：{{ isBubble ? '是' : '否' }}，分泡前：{{ beforeBubble }} 分泡后：{{ afterbubble }}</p>
        <p>收费重量：{{ estimatedWeight }}</p>
        <p>最终结算重量：{{ settlementWeight }}</p>
      </div>
    </el-row>
  </PageCard>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CirclePlus, Remove } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'

defineOptions({ name: 'SysWeight' })

// A1 结算重量算法: 1取实重 / 2取实重或体积重最大值 / 3取平均值
// A2 多件重量算法: 1先累加后比较 / 2先比较后累加
const rules = {
  a1: [{ required: true, message: '请选择结算重量算法', trigger: 'blur' }],
  bubble: [{ required: true, message: '请输入分泡比率', trigger: 'blur' }],
  a2: [{ required: true, message: '请选择多件重量算法', trigger: 'blur' }]
}
const initForm = () => [
  { beachTotal: 1, weight: 7.95, height: 41, length: 57, width: 40 },
  { beachTotal: 1, weight: 13.8, height: 32, length: 47, width: 32 },
  { beachTotal: 1, weight: 13, height: 38, length: 53, width: 33 }
]
const formRef = ref(null)
const ruleForm = reactive({ a1: 2, bubble: 20, boxLowestWeight: 10, orderLowestWeight: 50, a2: 2 })
const boxForm = ref(initForm())

const isBubble = ref(null)
const beforeBubble = ref(0)
const afterbubble = ref(0)
const estimatedWeight = ref(0)
const settlementWeight = ref(0)

const addBeatch = () => boxForm.value.push({ beachTotal: 0, weight: 0, height: 0, length: 0, width: 0 })
const delBeatch = index => { boxForm.value = boxForm.value.filter((_, i) => i !== index) }

// 生成每个箱子的计量信息（实重/体积重）
const measuringBox = () => {
  let boxList = []
  boxForm.value.forEach(item => {
    const { weight, height, length, width, beachTotal } = item
    const v = (length * width * height) / 1000 / 1000 // 单箱体积(方)
    const vWeight = Number(v) * 167 // 体积重(KG)
    const row = { aWeight: weight, vWeight: Number(vWeight) }
    boxList = [...boxList, ...Array(beachTotal).fill(row)]
  })
  return boxList
}
const calcVweight = boxs => {
  const { boxLowestWeight } = ruleForm
  let vw = 0
  boxs.forEach(item => { vw += Math.max(item.vWeight, boxLowestWeight || 0) })
  return vw
}
const calcAweight = boxs => {
  const { boxLowestWeight } = ruleForm
  let aw = 0
  boxs.forEach(item => { aw += Math.max(item.aWeight, boxLowestWeight || 0) })
  return aw
}
const handleBubble = boxs => {
  const { bubble, a1 } = ruleForm
  const aw = calcAweight(boxs)
  if (a1 === 2) {
    if (estimatedWeight.value > aw) {
      isBubble.value = true
      beforeBubble.value = estimatedWeight.value
      afterbubble.value = (estimatedWeight.value - aw) * (1 - (bubble || 0) / 100) + aw
      return (estimatedWeight.value - aw) * (1 - (bubble || 0) / 100) + aw
    }
    isBubble.value = false
    return estimatedWeight.value
  }
  isBubble.value = false
  return estimatedWeight.value
}
const calcAccBeforeCompare = boxs => Math.max(calcVweight(boxs), calcAweight(boxs))
const calcCompareBeforeAcc = boxs => {
  const { boxLowestWeight } = ruleForm
  let r = 0
  boxs.forEach(item => {
    const aw = Math.max(item.aWeight, boxLowestWeight || 0)
    const vw = Math.max(item.vWeight, boxLowestWeight || 0)
    r += Math.max(aw, vw)
  })
  return r
}
const calcAverageOfAwAndVw = boxs => (calcAweight(boxs) + calcVweight(boxs)) / 2
const calcEstimatedWeight = boxs => {
  const { a1, a2 } = ruleForm
  switch (a1) {
    case 2: return a2 === 1 ? calcAccBeforeCompare(boxs) : calcCompareBeforeAcc(boxs)
    case 3: return calcAverageOfAwAndVw(boxs)
    case 1: return calcAweight(boxs)
    default: return 0
  }
}
const calcSettlementWeight = () => {
  const { orderLowestWeight } = ruleForm
  return Math.max(Math.ceil(estimatedWeight.value), orderLowestWeight || 0)
}
const calc = () => {
  const boxs = measuringBox()
  estimatedWeight.value = calcEstimatedWeight(boxs)
  estimatedWeight.value = handleBubble(boxs)
  return calcSettlementWeight()
}
const submitForm = () => { settlementWeight.value = calc() }
const reset = () => {
  Object.assign(ruleForm, { a1: 2, bubble: 20, boxLowestWeight: 10, orderLowestWeight: 50, a2: 1 })
  boxForm.value = initForm()
  isBubble.value = null
  beforeBubble.value = 0
  afterbubble.value = 0
  estimatedWeight.value = 0
  settlementWeight.value = 0
  formRef.value?.clearValidate()
  submitForm()
}

onMounted(submitForm)
</script>

<style scoped lang="scss">
.calc-icon { margin-left: 10px; font-size: 20px; cursor: pointer; }
.calc-icon--add { color: #409eff; }
.calc-icon--del { color: #f14535; }
.calc-result { margin-top: 12px; line-height: 1.8; color: $text-primary; }
</style>
