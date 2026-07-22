<template>
  <div class="login">
    <div class="login__box">
      <div class="login__brand">
        <el-icon class="login__logo"><Ship /></el-icon>
        <h1>跨境物流管理系统</h1>
        <p>Cross-Border Logistics Admin</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login__btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
        <p class="login__tip">演示账号（任意密码）：admin 超级管理员 · user05 运营主管 · user02 客服专员 · user03 财务专员 · user04 代理商</p>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock, Ship } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { rules as commonRules } from '@/utils/validate'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const form = reactive({ username: 'admin', password: '123456' })
const rules = { username: commonRules.username, password: commonRules.password }

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.login(form)
    ElMessage.success('登录成功')
    router.push(route.query.redirect || { name: 'Dashboard' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $primary-color 0%, $primary-active 100%);

  &__box {
    width: 400px;
    padding: $space-xl 40px 40px;
    background: $bg-card;
    border-radius: $card-radius;
    box-shadow: $shadow-lg;
  }
  &__brand {
    text-align: center;
    margin-bottom: $space-xl;
    h1 { font-size: $font-xl; color: $text-primary; margin-top: $space-sm; }
    p { font-size: $font-xs; color: $text-placeholder; margin-top: $space-xs; }
  }
  &__logo { font-size: 44px; color: $primary-color; }
  &__btn { width: 100%; }
  &__tip {
    text-align: center;
    font-size: $font-xs;
    color: $text-placeholder;
  }
}
</style>
