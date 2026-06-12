import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '../layout/AdminLayout.vue'
import Dashboard from '../views/Dashboard.vue'
import Orders from '../views/Orders.vue'
import Riders from '../views/Riders.vue'
import Communities from '../views/Communities.vue'
import Products from '../views/Products.vue'
import Categories from '../views/Categories.vue'
import FlashSale from '../views/FlashSale.vue'
import Coupons from '../views/Coupons.vue'
import Posts from '../views/Posts.vue'
import Certs from '../views/Certs.vue'
import Chat from '../views/Chat.vue'
import Login from '../views/Login.vue'
import { isLoggedIn } from '../utils/auth.js'

const routes = [
  { path: '/login', component: Login, meta: { public: true } },
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'orders', component: Orders },
      { path: 'riders', component: Riders },
      { path: 'communities', component: Communities },
      { path: 'products', component: Products },
      { path: 'categories', component: Categories },
      { path: 'flash-sale', component: FlashSale },
      { path: 'coupons', component: Coupons },
      { path: 'posts', component: Posts },
      { path: 'certs', component: Certs },
      { path: 'chat', component: Chat }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.public || isLoggedIn()) {
    next()
  } else {
    next('/login')
  }
})

export default router