<template>
  <!--
    左侧可折叠卡片流面板（A/B/C 档共用）：标题 + 新增按钮 + 筛选插槽 + 卡片列表 + 分页 + 右键菜单。
    源为 app-slide（415px 可折叠）+ el-scrollbar 卡片流；此处降级为固定宽度面板 + 折叠箭头。
    卡片体由父级通过 #card 插槽自定义（各页字段不同），本组件负责状态圆点、选中态、右键菜单交互。
  -->
  <div class="pcl-wrap">
    <div v-show="isActive" class="pcl-slide">
      <div class="pcl-head">
        <span>{{ title }}</span>
        <el-button v-if="showAdd" type="primary" link size="small" @click="$emit('add')">新增报价</el-button>
      </div>

      <div class="pcl-search">
        <slot name="search" />
      </div>

      <el-scrollbar v-loading="loading" class="pcl-scroll">
        <div
          v-for="item in cards"
          :key="item.id"
          :class="{ 'active-card': currentId === item.id }"
          class="pcl-card"
          @click="$emit('row-click', item)"
          @contextmenu.prevent="onContextMenu(item, $event)"
        >
          <slot name="card" :item="item" />
        </div>
        <el-empty v-if="!loading && !cards.length" description="暂无数据" :image-size="80" />
      </el-scrollbar>

      <el-pagination
        small
        :current-page="page"
        :page-size="size"
        layout="total, prev, pager, next"
        :total="total"
        class="pcl-pager"
        @current-change="$emit('update:page', $event)"
      />
    </div>

    <div class="pcl-arrow" @click="isActive = !isActive">
      <el-icon><component :is="isActive ? ArrowLeft : ArrowRight" /></el-icon>
    </div>

    <!-- 右键上下文菜单：复制/查看/删除（门控由父级 menu 决定） -->
    <ul v-show="menu.visible" :style="{ left: menu.left + 'px', top: menu.top + 'px' }" class="contextmenu">
      <li v-if="canCopy" class="contextmenu-item" @click="emitMenu('copy')">复制</li>
      <li v-if="canView" class="contextmenu-item" @click="emitMenu('view')">查看</li>
      <li v-if="canDelete && menuDeletable(menu.row)" class="contextmenu-item" @click="emitMenu('delete')">删除</li>
    </ul>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

defineOptions({ name: 'PriceCardList' })

const props = defineProps({
  title: { type: String, default: '报价' },
  cards: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  currentId: { type: [String, Number], default: '' },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
  showAdd: { type: Boolean, default: false },
  canCopy: { type: Boolean, default: true },
  canView: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  // 判断某卡片是否可删除（源：audit !== '1' && audit !== '3'）
  menuDeletable: { type: Function, default: () => true }
})
const emit = defineEmits(['add', 'row-click', 'menu', 'update:page'])

const isActive = ref(true)
const menu = reactive({ visible: false, left: 0, top: 0, row: {} })

const onContextMenu = (row, e) => {
  menu.row = row
  menu.left = e.clientX
  menu.top = e.clientY
  menu.visible = true
}
const closeMenu = () => { menu.visible = false }
const emitMenu = action => { emit('menu', { action, row: menu.row }); closeMenu() }

watch(() => menu.visible, v => {
  if (v) document.body.addEventListener('click', closeMenu)
  else document.body.removeEventListener('click', closeMenu)
})
onBeforeUnmount(() => document.body.removeEventListener('click', closeMenu))
</script>

<style scoped lang="scss">
.pcl-wrap { display: flex; flex-flow: row nowrap; }
.pcl-slide {
  width: 415px; flex-shrink: 0; background: $bg-card; border-radius: $card-radius;
  padding: 16px; display: flex; flex-direction: column;
}
.pcl-head { display: flex; align-items: center; justify-content: space-between; line-height: 32px; }
.pcl-search { padding-top: 10px; }
.pcl-scroll { flex: 1; height: calc(100vh - 300px); }
.pcl-pager { text-align: right; margin-top: 10px; }
.pcl-arrow { display: flex; align-items: center; padding: 0 6px; cursor: pointer; color: $text-secondary; }

.pcl-card {
  font-size: 12px; margin-bottom: 10px; cursor: pointer;
  border: 1px solid $border-color; border-radius: $radius-base; padding: 10px;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1); }
}
.active-card { background: #fffaf5; border-color: #ff7d19; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1); }

.contextmenu {
  margin: 0; background: #fff; z-index: 3000; position: fixed; list-style-type: none;
  padding: 5px 0; border-radius: 4px; font-size: 12px; color: #333;
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
  .contextmenu-item { padding: 7px 16px; cursor: pointer; &:hover { background: #eee; } }
}
</style>