<template>
  <div class="page-card">
    <div v-if="title || $slots.extra" class="page-card__header">
      <span class="page-card__title">{{ title }}</span>
      <div class="page-card__extra"><slot name="extra" /></div>
    </div>
    <div class="page-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' }
})
</script>

<style scoped lang="scss">
.page-card {
  background: $bg-card;
  border-radius: $card-radius;
  box-shadow: $shadow-sm;
  padding: $page-padding;
  margin-bottom: $space-md;

  &:last-child { margin-bottom: 0; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $space-md;
  }
  &__title {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
    position: relative;
    padding-left: $space-sm;
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: $font-md;
      background: $primary-color;
      border-radius: $radius-sm;
    }
  }
}
</style>
