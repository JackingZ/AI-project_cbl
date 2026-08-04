<template>
  <div>
    <PageCard title="着陆页配置">
      <template #extra>
        <el-button type="primary" :disabled="!can('save')" @click="save">保 存</el-button>
      </template>

      <el-form :model="form" label-width="120px" class="pc-cfg__form">
        <el-divider content-position="left">首页导航</el-divider>
        <el-form-item label="导航 Logo">
          <ImgUploader v-model="form.navLogo" :disabled="!can('upload')" tip="建议尺寸 70 × 42" />
        </el-form-item>

        <el-divider content-position="left">首页 Banner（最多 5 张）</el-divider>
        <el-form-item label="Banner 图组">
          <div class="pc-cfg__imgs">
            <ImgUploader
              v-for="(b, i) in form.banners"
              :key="i"
              :model-value="form.banners[i]"
              :disabled="!can('upload')"
              tip="建议 448 × 278"
              @update:model-value="v => (form.banners[i] = v)"
            />
          </div>
        </el-form-item>

        <el-divider content-position="left">底部信息</el-divider>
        <el-form-item label="底部 Logo">
          <ImgUploader v-model="form.bottomLogo" :disabled="!can('upload')" tip="建议 148 × 90" />
        </el-form-item>
        <el-form-item label="底部二维码 1">
          <div class="pc-cfg__qr">
            <el-input v-model="form.qr1Title" placeholder="二维码标题" style="width: 200px" />
            <ImgUploader v-model="form.qr1Img" :disabled="!can('upload')" tip="建议 192 × 192" />
          </div>
        </el-form-item>
        <el-form-item label="底部二维码 2">
          <div class="pc-cfg__qr">
            <el-input v-model="form.qr2Title" placeholder="二维码标题" style="width: 200px" />
            <ImgUploader v-model="form.qr2Img" :disabled="!can('upload')" tip="建议 192 × 192" />
          </div>
        </el-form-item>

        <el-divider content-position="left">联系方式</el-divider>
        <el-form-item label="联系电话" :error="phoneError">
          <el-input v-model="form.phone" placeholder="请输入联系电话" style="width: 320px" />
        </el-form-item>
        <el-form-item label="工作时间">
          <el-input v-model="form.workTime" maxlength="50" show-word-limit placeholder="如：周一至周五 9:00-18:00" style="width: 420px" />
        </el-form-item>
      </el-form>
    </PageCard>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import PageCard from '@/components/Common/PageCard.vue'
import ImgUploader from '@/components/Common/ImgUploader.vue'
import { useActivatedRefresh, usePagePerms } from '@/utils/hooks'
import { pcApi } from '@/api/modules/system'

defineOptions({ name: 'SysPc' })
const { can } = usePagePerms()

const form = reactive({
  navLogo: '', banners: ['', '', '', '', ''], bottomLogo: '',
  qr1Title: '', qr1Img: '', qr2Title: '', qr2Img: '',
  phone: '', workTime: ''
})
const phoneError = ref('')

const loadData = async () => {
  const res = await pcApi.res.list()
  const cfg = res.data[0]
  if (cfg) {
    Object.assign(form, cfg)
    if (!Array.isArray(form.banners)) form.banners = ['', '', '', '', '']
    while (form.banners.length < 5) form.banners.push('')
  }
}

const save = async () => {
  // 联系电话不能含中文（源校验）
  phoneError.value = ''
  if (/[一-龥]/.test(form.phone)) {
    phoneError.value = '联系电话不能包含中文'
    return
  }
  await pcApi.update(1, { ...form, banners: [...form.banners] })
  ElMessage.success('着陆页配置已保存')
}

useActivatedRefresh(loadData)
</script>

<style scoped lang="scss">
.pc-cfg__form { max-width: 720px; }
.pc-cfg__imgs { display: flex; flex-wrap: wrap; gap: $space-md; }
.pc-cfg__qr { display: flex; align-items: flex-start; gap: $space-md; }
</style>
