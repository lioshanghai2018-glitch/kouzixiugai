<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">🏪</div>
      <h1>大研菜场 · 商家后台</h1>
      <p class="subtitle">管理您的店铺、订单、商品</p>

      <el-form :model="form" @submit.prevent="handleLogin" class="login-form">
        <el-form-item>
          <el-input v-model="form.phone" placeholder="手机号" maxlength="11" size="large">
            <template #prefix><span>📱</span></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" show-password size="large">
            <template #prefix><span>🔒</span></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" :loading="loading" @click="handleLogin" style="width:100%;">
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider>或</el-divider>

      <el-form-item>
        <el-input v-model="testMerchantId" placeholder="测试模式：输入 merchantId" size="large" />
        <el-button type="warning" size="large" :loading="testLoading" @click="handleTestLogin" style="width:100%;margin-top:12px;">
          进入测试模式
        </el-button>
      </el-form-item>

      <p class="footer">© 2026 大研菜场</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { loginMerchant, loginAsTestMerchant, getMerchantId, setMerchantId, setToken, clearAuth } from '../utils/auth.js'

const router = useRouter()
const form = reactive({ phone: '', password: '' })
const loading = ref(false)
const testLoading = ref(false)
const testMerchantId = ref(getMerchantId() || '')

const handleLogin = async () => {
  if (!form.phone || form.phone.length !== 11) {
    return ElMessage.warning('请输入正确的手机号')
  }
  if (!form.password) {
    return ElMessage.warning('请输入密码')
  }
  loading.value = true
  try {
    await loginMerchant(form.phone, form.password)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (e) {
    ElMessage.error(e?.msg || '登录失败')
  } finally {
    loading.value = false
  }
}

const handleTestLogin = async () => {
  if (!testMerchantId.value) {
    return ElMessage.warning('请输入 merchantId')
  }
  testLoading.value = true
  try {
    loginAsTestMerchant(testMerchantId.value)
    ElMessage.success('已进入测试模式')
    router.push('/dashboard')
  } finally {
    testLoading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #528A59 0%, #2D5A27 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-box {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.logo {
  font-size: 64px;
  text-align: center;
  margin-bottom: 16px;
}
h1 {
  font-size: 24px;
  color: #2D5A27;
  text-align: center;
  margin: 0 0 8px;
}
.subtitle {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin: 0 0 32px;
}
.login-form {
  margin-top: 24px;
}
.footer {
  text-align: center;
  color: #ccc;
  font-size: 12px;
  margin-top: 24px;
}
</style>
