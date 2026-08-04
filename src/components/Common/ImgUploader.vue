<template>
  <div class="img-uploader">
    <div v-if="modelValue" class="img-uploader__item">
      <img :src="modelValue" alt="图片" @click="preview = true" />
      <i v-if="!disabled" class="img-uploader__del" @click="emit('update:modelValue', '')">
        <el-icon><Close /></el-icon>
      </i>
    </div>
    <el-upload
      v-else
      :show-file-list="false"
      :auto-upload="false"
      :disabled="disabled"
      accept="image/*"
      :on-change="onChange"
    >
      <div class="img-uploader__add" :class="{ 'is-disabled': disabled }">
        <el-icon><Plus /></el-icon>
        <span>上传</span>
      </div>
    </el-upload>
    <div v-if="tip" class="img-uploader__tip">{{ tip }}</div>

    <el-dialog v-model="preview" width="560px" append-to-body title="图片预览">
      <img :src="modelValue" style="width: 100%" alt="预览" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus, Close } from '@element-plus/icons-vue'

// 通用图片上传：本地 base64 存储（原型阶段无对象存储），支持预览/删除
const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  tip: { type: String, default: '' },
  maxSize: { type: Number, default: 2 } // MB
})
const emit = defineEmits(['update:modelValue'])
const preview = ref(false)

const onChange = file => {
  const raw = file.raw
  if (raw.size > props.maxSize * 1024 * 1024) return ElMessage.warning(`图片不能超过 ${props.maxSize}MB`)
  const reader = new FileReader()
  reader.onload = e => emit('update:modelValue', e.target.result)
  reader.readAsDataURL(raw)
}
</script>

<style scoped lang="scss">
.img-uploader {
  display: inline-block;
  &__item {
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: $radius-base;
    overflow: hidden;
    border: 1px solid $border-color;
    img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; }
  }
  &__del {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
  }
  &__add {
    width: 100px;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px dashed $border-color;
    border-radius: $radius-base;
    color: $text-secondary;
    cursor: pointer;
    &:hover { border-color: $primary-color; color: $primary-color; }
    &.is-disabled { cursor: not-allowed; opacity: 0.5; }
  }
  &__tip {
    font-size: $font-sm;
    color: $text-placeholder;
    margin-top: 4px;
  }
}
</style>
