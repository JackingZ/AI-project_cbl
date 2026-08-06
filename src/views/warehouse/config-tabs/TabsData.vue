<template>
  <div class="tabs-data">
    <el-tabs v-model="activeName">
      <el-tab-pane v-if="can('scheduling')" label="班次信息" name="schedulingInformation">
        <SchedulingInformation v-if="activeName === 'schedulingInformation'" :ws-id="wsId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('shiftPost')" label="班次岗位分配" name="shiftPostAllocation">
        <ShiftPostAllocation v-if="activeName === 'shiftPostAllocation'" :ws-id="wsId" :ct-id="ctId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('dischargingHatch')" label="分拣口" name="dischargingHatch">
        <DischargingHatch v-if="activeName === 'dischargingHatch'" :ws-id="wsId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('operatingCenter')" label="操作中心" name="operatingCenter">
        <OperatingCenter v-if="activeName === 'operatingCenter'" :ws-id="wsId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('locationManagement')" label="库位信息" name="locationManagement">
        <LocationManagement v-if="activeName === 'locationManagement'" :ws-id="wsId" :ws-nm="wsNm" />
      </el-tab-pane>
      <el-tab-pane v-if="can('transferInfmt')" label="转仓信息" name="transferInformation">
        <TransferInformation v-if="activeName === 'transferInformation'" :ws-id="wsId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('clause')" label="入库条款" name="warehouseClause">
        <WarehouseClause v-if="activeName === 'warehouseClause'" :ws-id="wsId" />
      </el-tab-pane>
      <el-tab-pane v-if="can('custItemConfig')" label="成本项目配置" name="custItemConfig">
        <CustItemConfig v-if="activeName === 'custItemConfig'" :ws-id="wsId" />
      </el-tab-pane>
      <!-- 轮岗配置：源已注释，保持注释
      <el-tab-pane label="轮岗配置" name="postShiftConfiguration">
        <PostShiftConfiguration v-if="activeName === 'postShiftConfiguration'" :ws-id="wsId" />
      </el-tab-pane>
      -->
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePagePerms } from '@/utils/hooks'
import SchedulingInformation from './SchedulingInformation.vue'
import ShiftPostAllocation from './ShiftPostAllocation.vue'
import DischargingHatch from './DischargingHatch.vue'
import OperatingCenter from './OperatingCenter.vue'
import LocationManagement from './LocationManagement.vue'
import TransferInformation from './TransferInformation.vue'
import WarehouseClause from './WarehouseClause.vue'
import CustItemConfig from './CustItemConfig.vue'

defineProps({
  wsId: { type: [String, Number], default: '' },
  wsNm: { type: String, default: '' },
  ctId: { type: String, default: '' }
})
const { can } = usePagePerms('/warehouse/warehouse-config')
const activeName = ref('schedulingInformation')
</script>

<style scoped lang="scss">
.tabs-data { padding: 4px 4px 8px; }
</style>
