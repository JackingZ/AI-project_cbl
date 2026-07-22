<template>
  <div>
    <PageCard title="订单信息">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="add-form">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="form.businessType" placeholder="请选择" style="width: 100%">
                <el-option v-for="t in BUSINESS_TYPES" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户名称" prop="customerName">
              <el-input v-model="form.customerName" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="下单客户" prop="orderCustomerName">
              <el-input v-model="form.orderCustomerName" placeholder="请输入下单客户" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="目的国" prop="destinationCountry">
              <el-select v-model="form.destinationCountry" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="选填" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </PageCard>

    <PageCard title="商品明细">
      <template #extra>
        <el-button link type="primary" :icon="Plus" @click="addGoods">添加商品</el-button>
      </template>
      <el-table :data="goods" border>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="商品名称">
          <template #default="{ row }"><el-input v-model="row.name" placeholder="商品名称" /></template>
        </el-table-column>
        <el-table-column label="海关编码" width="150">
          <template #default="{ row }"><el-input v-model="row.hsCode" placeholder="HS编码" /></template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="{ row }"><el-input-number v-model="row.qty" :min="1" :controls="false" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="单价" width="120">
          <template #default="{ row }"><el-input-number v-model="row.price" :min="0" :precision="2" :controls="false" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="总箱数" width="120">
          <template #default="{ row }"><el-input-number v-model="row.boxes" :min="1" :controls="false" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="单箱重量(kg)" width="140">
          <template #default="{ row }"><el-input-number v-model="row.boxWeight" :min="0" :precision="2" :controls="false" style="width: 100%" /></template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="removeGoods($index)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty><Empty description="请添加商品明细" /></template>
      </el-table>
      <div class="add-summary">
        合计：{{ totalQty }} 件 · {{ totalBox }} 箱 · {{ totalWeight }} kg · 金额 {{ formatMoney(totalAmount) }}
      </div>
    </PageCard>

    <div class="add-actions">
      <el-button @click="goBack">返回</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交订单</el-button>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import PageCard from '@/components/Common/PageCard.vue'
import Empty from '@/components/Common/Empty.vue'
import { required } from '@/utils/validate'
import { formatMoney } from '@/utils/format'
import { addOrder, BUSINESS_TYPES, COUNTRIES } from '@/api/modules/orderlist'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({ businessType: '快递', customerName: '', orderCustomerName: '', destinationCountry: '美国', remark: '' })
const rules = {
  businessType: [required('请选择业务类型', 'change')],
  customerName: [required('请输入客户名称')],
  orderCustomerName: [required('请输入下单客户')],
  destinationCountry: [required('请选择目的国', 'change')]
}

const newRow = () => ({ name: '', hsCode: '', qty: 1, price: 0, boxes: 1, boxWeight: 0 })
const goods = ref([newRow()])
const addGoods = () => goods.value.push(newRow())
const removeGoods = i => goods.value.splice(i, 1)

const totalQty = computed(() => goods.value.reduce((s, g) => s + (g.qty || 0), 0))
const totalBox = computed(() => goods.value.reduce((s, g) => s + (g.boxes || 0), 0))
const totalWeight = computed(() => Number(goods.value.reduce((s, g) => s + (g.boxWeight || 0) * (g.boxes || 0), 0).toFixed(2)))
const totalAmount = computed(() => Number(goods.value.reduce((s, g) => s + (g.price || 0) * (g.qty || 0), 0).toFixed(2)))

const goBack = () => router.push({ name: 'OlSalesman' })

const submit = async () => {
  await formRef.value.validate()
  if (!goods.value.some(g => g.name)) return ElMessage.warning('请至少填写一条商品明细')
  submitting.value = true
  try {
    await addOrder({
      ...form,
      packages: totalQty.value,
      totalBox: totalBox.value,
      weight: totalWeight.value,
      amount: totalAmount.value,
      goods: goods.value.filter(g => g.name)
    })
    ElMessage.success('代客下单成功')
    goBack()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.add-summary {
  margin-top: $space-md;
  text-align: right;
  color: $text-secondary;
  font-size: $font-sm;
}
.add-actions {
  display: flex;
  justify-content: center;
  gap: $space-md;
  padding: $space-md 0;
}
</style>
