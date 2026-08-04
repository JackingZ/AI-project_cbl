<template>
  <div>
    <MoreInfoPanel
      owner-type="jht"
      :owner="jhtOwner"
      :show-back="false"
      :can="can"
    />
  </div>
</template>

<script setup>
import MoreInfoPanel from '@/components/Common/MoreInfoPanel.vue'
import { usePagePerms } from '@/utils/hooks'

// 设置：聚货通自身档案 6-tab 维护台（联系/地址/我的设置/收款/开票/文件），复用组织管理 MoreInfoPanel
// 固定主体 = 聚货通自身（ownerId=0），无“返回列表”，按钮走页面权限
defineOptions({ name: 'SysSet' })
const { can } = usePagePerms()
const jhtOwner = { id: 0, name: '聚货通（自身档案）' }
</script>
