<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const isCollapse = ref(false)
const router = useRouter()
const route = useRoute()

const menuItems = [
  { path: '/dashboard', title: '数据看板' },
  { path: '/orders', title: '订单管理' },
  { path: '/riders', title: '骑手管理' },
  { path: '/communities', title: '小区管理' },
  { path: '/products', title: '商品管理' },
  { path: '/categories', title: '分类管理' },
  { path: '/posts', title: '帖子管理' },
  { path: '/certs', title: '认证管理' },
  { path: '/chat', title: '客服消息' },
  { path: '/flash-sale', title: '特惠管理' },
  { path: '/coupons', title: '优惠券管理' }
]

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuSelect = (index) => {
  router.push(index)
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar" :class="{ 'collapse': isCollapse }">
      <div class="logo">
        <span v-if="!isCollapse">商家后台</span>
        <span v-else>商</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#2d3a4b"
        text-color="#fff"
        active-text-color="#4CAF50"
        @select="handleMenuSelect"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          {{ item.title }}
        </el-menu-item>
      </el-menu>
    </aside>
    <div class="main">
      <header class="header">
        <div class="header-title">买菜商家管理系统</div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 220px;
  background-color: #2d3a4b;
  transition: width 0.3s;
  overflow: hidden;
}
.sidebar.collapse {
  width: 64px;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #4CAF50;
  font-size: 18px;
  font-weight: bold;
  background-color: #1a2a3a;
}
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}
.header {
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.header-title {
  font-size: 16px;
  color: #333;
}
.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}
.el-menu {
  border-right: none;
}
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
:deep(.el-menu-item span) {
  margin-left: 10px;
}
</style>