<template>
  <div>
    <!-- 源页仅保留标题为可见内容，整块业务面板与弹窗在源码中被注释，此处保真保留为注释不放开 -->
    <PageCard>
      <div class="ss-empty">服务附加费</div>
    </PageCard>

    <!-- ============================================================
      源注释块 A：面板（togglePanel 两套镜像子面板）
      子面板 1（v-show="togglePanel"）
        - 新增附加费按钮 @click="addBrokerage"
        - 快递/卡派公司 select v-model="selectValue.orgId" @focus="getCountryList"（expressList）
        - 关联服务编码 select v-model="selectValue.serviceCode" @focus="getCountryList"（serviceCodeList）
        - 附加费名称 input v-model="selectValue.name"
        - 查询按钮 @click="queryAllForService"
      子面板 2（v-show="!togglePanel"）
        - 新增服务编码按钮 @click="addBrokerage"
        - 目的国 select v-model="selectValue.countryId" @focus="getCountryList"（countryList）
        - 关键字 input v-model="selectValue.keyword"，prepend select v-model="selectType"（服务编码1/服务名称2）
        - 查询按钮 @click="queryAllForService"
      两套子面板表格列（相同）：
        1. 服务类型 ssTypeName —— scope.row.type === 0 ? '本地快递' : '国际快递'（type 为数字）
        2. 服务编码 id
        3. 服务名称 name
        4. 起运国 countryNameFrom
        5. 目的国 countryNameTo
        6. 服务区域 —— 按钮「设置区域」@click="setArea(scope.row)"
        7. 服务区域 —— 按钮「关联FBA专线」@click="setArea(scope.row)"
        8. 添加时间 createTime
        9. 操作 —— 编辑 @click="editForm(scope.row)"、删除 @click="deletData(scope.row)"
      分页：@size-change="handleSizeChange" @current-change="handleCurrentChange"

      源注释块 B：新增/编辑服务附加费弹窗（标题 isEidt ? '编辑服务附加费' : '新增服务附加费'，550px）
        1. 所在国家 —— prop="countryId" select v-model="selectForm.countryIdFrom"（countryList）
        2. 快递/卡派公司 —— prop="id" select v-model="selectValue.orgId" @focus="getCountryList"（expressList）
        3. 附加费名称 —— prop="name" input v-model="selectForm.name"
        4. 触发条件 —— prop="ssTypeId" select v-model="selectForm.excute"（最大重量0/最大边长1/偏远地区2/送件上楼3/签收签字4，值为数字）
        5. 计量单位 —— prop="ssTypeId" select v-model="selectForm.um"（同上枚举，值为数字）
        6. 触发的最小值 —— input v-model="selectForm.value"
        7. 收费单位 —— input v-model="selectForm.value"，append select v-model="selectForm.currencyId"（currencyList）
        底部：取消 @click="cancel"、确定 @click="saveConfirm"

      源注释块 C：设置服务区域弹窗（标题「设置服务区域」，550px，v-model="serviveAreaShow"）
        - 报关服务区域 —— prop="type" select v-model="selectForm.type"（进口报关0/出口报关1，值为数字）
        - 底部：取消 @click="cancel"、确定 @click="saveConfirm"
      ============================================================ -->
  </div>
</template>

<script setup>
import PageCard from '@/components/Common/PageCard.vue'

defineOptions({ name: 'CostServiceSurcharge' })

// 源脚本仅有 loading 状态，无接口调用、无方法（业务逻辑随模板整块注释），此处保真保留空壳。
</script>

<style scoped>
.ss-empty { color: #999; text-align: center; padding: 40px 0; }
</style>
