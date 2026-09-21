<template>
  <div>
    <SearchBar :model="query" @search="handleSearch" @reset="handleReset">
      <el-form-item label="国家/地区">
        <el-select v-model="query.countryName" placeholder="全部" clearable filterable style="width: 130px">
          <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="商品状态">
        <el-select v-model="query.state" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(s, i) in PRODUCT_STATE" :key="i" :label="s" :value="i" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="query.keyword" placeholder="请输入内容" clearable style="width: 300px">
          <template #prepend>
            <el-select v-model="query.selectType" style="width: 120px">
              <el-option label="SKU编码" value="1" />
              <el-option label="中文名称" value="2" />
              <el-option label="英文名称" value="3" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <template #actions><el-button type="success" :icon="Plus" :disabled="!can('add')" @click="openAdd">新增</el-button></template>
    </SearchBar>
    <PageCard>
      <ProTable v-model:page="query.page" v-model:size="query.size" :data="list" :columns="columns" :loading="loading" :total="total" :action-width="130" @change="loadData">
        <template #col-state="{ row }">
          <el-tag :type="STATE_TAG[row.state]" size="small">{{ PRODUCT_STATE[row.state] }}</el-tag>
        </template>
        <template #col-goodsName="{ row }">
          <div class="item-word">{{ row.cnName || '--' }}</div>
          <div class="item-word">{{ row.enName || '--' }}</div>
        </template>
        <template #col-material="{ row }">
          <div class="item-word">{{ row.cnMaterial || '--' }}</div>
          <div class="item-word">{{ row.enMaterial || '--' }}</div>
        </template>
        <template #col-purpose="{ row }">
          <div class="item-word">{{ row.cnPurpose || '--' }}</div>
          <div class="item-word">{{ row.enPurpose || '--' }}</div>
        </template>
        <template #col-declaration="{ row }">
          <el-button link type="primary" size="small" @click="onDeclaration(row)">报关信息</el-button>
        </template>
        <template #col-status="{ row }">
          <el-switch :model-value="normalizeSwitchValue(row.status, 0, 1)" :active-value="0" :inactive-value="1" active-text="启用" inactive-text="禁用" :disabled="!can('enable')" :before-change="() => beforeStatusChange(row)" />
        </template>
        <template #actions="{ row }">
          <el-button link type="primary" size="small" :disabled="!can('edit')" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" :disabled="!can('del')" @click="remove(row)">删除</el-button>
        </template>
      </ProTable>
    </PageCard>

    <Modal v-model="dialog.visible" :title="dialog.title" width="960px" :confirm-loading="dialog.loading" @confirm="submit">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="product-form">
        <el-form-item label="商品属性" prop="categorieIds" class="product-form__full">
          <el-select v-model="form.categorieIds" multiple placeholder="请选择" style="width: 100%">
            <el-option v-for="c in PRODUCT_CATEGORIES" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品图片" class="product-form__full">
          <div class="product-img">
            <div v-if="form.url" class="product-img__box">
              <img :src="form.url" class="product-img__pic" />
              <el-icon class="product-img__del" @click="form.url = ''"><Close /></el-icon>
            </div>
            <el-upload v-else :show-file-list="false" :auto-upload="false" accept="image/*" :on-change="onImgChange">
              <div class="product-img__add"><el-icon><Plus /></el-icon><span>上传</span></div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="中文名称" prop="cnName"><el-input v-model="form.cnName" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="英文名称" prop="enName"><el-input v-model="form.enName" :maxlength="100" placeholder="请输入" /></el-form-item>
        <el-form-item label="SKU编码" prop="skuCode"><el-input v-model="form.skuCode" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="品牌" prop="brand"><el-input v-model="form.brand" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="规格" prop="size"><el-input v-model="form.size" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-select v-model="form.unit" placeholder="请选择" style="width: 100%">
            <el-option v-for="u in MEASURE_UNIT_NAMES" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="中文材质" prop="cnMaterial"><el-input v-model="form.cnMaterial" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="英文材质" prop="enMaterial"><el-input v-model="form.enMaterial" :maxlength="100" placeholder="请输入" /></el-form-item>
        <el-form-item label="中文用途" prop="cnPurpose"><el-input v-model="form.cnPurpose" :maxlength="50" placeholder="请输入" /></el-form-item>
        <el-form-item label="英文用途" prop="enPurpose"><el-input v-model="form.enPurpose" :maxlength="100" placeholder="请输入" /></el-form-item>
        <el-form-item label="备注" class="product-form__full">
          <el-input v-model="form.remark" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" :maxlength="200" placeholder="请输入" />
        </el-form-item>
        <!-- 一件代发条件区块（包装/仓储/尺寸/重量等）依赖多租户与仓配流程，占位省略 -->
      </el-form>
    </Modal>

    <!-- 报关信息二级 CRUD（国家/HS编码/税率/申报品名 动态行） -->
    <Modal v-model="decl.visible" title="报关信息" width="820px" :confirm-loading="decl.loading" @confirm="saveDeclaration">
      <div class="decl-list">
        <div class="decl-row decl-row--head">
          <span>国家/地区</span><span>HS编码</span><span>税率</span><span>申报品名</span><span>操作</span>
        </div>
        <div v-for="(d, i) in decl.rows" :key="i" class="decl-row">
          <el-select v-model="d.countryName" placeholder="国家" filterable>
            <el-option v-for="c in COUNTRIES" :key="c" :label="c" :value="c" />
          </el-select>
          <el-input v-model="d.hsCode" :maxlength="20" placeholder="HS编码" />
          <el-input v-model="d.taxRate" :maxlength="10" placeholder="税率" />
          <el-input v-model="d.declareName" :maxlength="100" placeholder="申报品名" />
          <div class="decl-row__ops">
            <el-icon v-if="i === 0" class="decl-icon decl-icon--add" @click="addDecl"><CirclePlus /></el-icon>
            <el-icon v-else class="decl-icon decl-icon--del" @click="decl.rows.splice(i, 1)"><Remove /></el-icon>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Plus, Close, CirclePlus, Remove } from '@element-plus/icons-vue'
import SearchBar from '@/components/Common/SearchBar.vue'
import PageCard from '@/components/Common/PageCard.vue'
import ProTable from '@/components/Table/ProTable.vue'
import Modal from '@/components/Common/Modal.vue'
import { useListQuery, useCrudForm, usePagePerms } from '@/utils/hooks'
import { normalizeSwitchValue } from '@/utils/format'
import { required, noChineseRule } from '@/utils/validate'
import { productApi, PRODUCT_STATE, PRODUCT_CATEGORIES, MEASURE_UNIT_NAMES } from '@/api/modules/system'
import { COUNTRIES } from '@/api/modules/orderlist'

defineOptions({ name: 'SysProduct' })
const STATE_TAG = ['info', 'success', 'danger']
const { query, list, total, loading, loadData, handleSearch, handleReset } = useListQuery(productApi.list, { countryName: '', state: '', keyword: '', selectType: '1' })
const { can } = usePagePerms()
const columns = [
  { prop: 'state', label: '审核状态', width: 100, align: 'center' },
  { prop: 'skuCode', label: 'SKU编码', width: 120 },
  { prop: 'goodsName', label: '商品名称(中文/英文)', minWidth: 180 },
  { prop: 'brand', label: '品牌', width: 100 },
  { prop: 'size', label: '规格', width: 90 },
  { prop: 'material', label: '材质(中文/英文)', minWidth: 150 },
  { prop: 'purpose', label: '用途(中文/英文)', minWidth: 150 },
  { prop: 'unitName', label: '计量单位', width: 90, align: 'center' },
  { prop: 'title', label: '商品类别', width: 100 },
  { prop: 'declaration', label: '报关信息', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 130, align: 'center' },
  { prop: 'createTime', label: '添加时间', width: 160 }
]
const rules = {
  categorieIds: [required('请选择商品属性', 'change')],
  cnName: [required('请输入中文名称')],
  enName: [required('请输入英文名称'), noChineseRule('英文名称不能有中文')],
  skuCode: [required('请输入SKU编码')],
  brand: [required('请输入品牌')],
  size: [required('请输入规格')],
  cnMaterial: [required('请输入中文材质')],
  enMaterial: [required('请输入英文材质'), noChineseRule('英文材质不能有中文')],
  cnPurpose: [required('请输入中文用途')],
  enPurpose: [required('请输入英文用途'), noChineseRule('英文用途不能有中文')]
}
const defaultForm = () => ({ categorieIds: [], url: '', cnName: '', enName: '', skuCode: '', brand: '', size: '', unit: '', cnMaterial: '', enMaterial: '', cnPurpose: '', enPurpose: '', remark: '', status: 0 })
const { formRef, dialog, form, openAdd, openEdit, submit, remove } = useCrudForm({ api: productApi, defaultForm, reload: loadData, label: '商品' })

// 商品图片本地读为 base64
const onImgChange = file => {
  const raw = file.raw
  if (raw.size > 1024 * 1024) return ElMessage.warning('单张图片不能超过 1MB')
  const reader = new FileReader()
  reader.onload = e => { form.url = e.target.result }
  reader.readAsDataURL(raw)
}

// 状态开关（0启用/1禁用，源反常）：变更前确认
const beforeStatusChange = row => {
  const next = normalizeSwitchValue(row.status, 0, 1) === 0 ? 1 : 0
  return new Promise((resolve, reject) => {
    ElMessageBox.confirm(`此操作将${next === 1 ? '禁用' : '启用'}该商品，是否继续？`, '温馨提示', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    }).then(async () => {
      await productApi.update(row.id, { status: next })
      row.status = next
      ElMessage.success('操作成功')
      resolve(true)
    }).catch(() => reject(new Error('cancel')))
  })
}

// 报关信息二级 CRUD
const decl = reactive({ visible: false, loading: false, id: null, rows: [] })
const emptyDecl = () => ({ countryName: '', hsCode: '', taxRate: '', declareName: '' })
const onDeclaration = row => {
  decl.id = row.id
  decl.rows = (row.declarations && row.declarations.length) ? row.declarations.map(d => ({ ...d })) : [emptyDecl()]
  decl.visible = true
}
const addDecl = () => decl.rows.push(emptyDecl())
const saveDeclaration = async () => {
  const valid = decl.rows.filter(d => d.countryName && d.hsCode)
  decl.loading = true
  try {
    await productApi.update(decl.id, { declarations: valid })
    ElMessage.success('报关信息已保存')
    decl.visible = false
    loadData()
  } finally {
    decl.loading = false
  }
}
</script>

<style scoped lang="scss">
.item-word { line-height: 1.4; }
.product-form {
  display: flex;
  flex-wrap: wrap;
  :deep(.el-form-item) { width: 49.9%; }
  &__full { width: 100% !important; }
}
.product-img {
  &__box { position: relative; width: 90px; height: 90px; }
  &__pic { width: 90px; height: 90px; object-fit: cover; border-radius: $radius-base; border: 1px solid var(--el-border-color); }
  &__del { position: absolute; top: -8px; right: -8px; cursor: pointer; background: #fff; border-radius: 50%; color: var(--el-color-danger); }
  &__add {
    width: 90px; height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; border: 1px dashed var(--el-border-color); border-radius: $radius-base; color: $text-secondary; cursor: pointer;
  }
}
.decl-list { display: flex; flex-direction: column; gap: $space-sm; }
.decl-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr 1.5fr 60px;
  gap: $space-sm;
  align-items: center;
  &--head { color: $text-secondary; font-size: $font-sm; }
  &__ops { display: flex; justify-content: center; }
}
.decl-icon { font-size: 20px; cursor: pointer; }
.decl-icon--add { color: var(--el-color-primary); }
.decl-icon--del { color: var(--el-color-danger); }
</style>
