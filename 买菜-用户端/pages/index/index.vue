<template>
  <view class="container">
    <!-- IP形象区域 -->
    <view class="ip-section">
      <image class="ip-image" src="https://mp-ae9bd108-da40-4ae6-923b-c3007dedec12.cdn.bspapp.com/luobozai.png" mode="aspectFill"></image>
    </view>

    <!-- 卡片1：问候 + 买菜邻里 -->
    <view class="card">
      <view class="greeting-section" @tap="goMine">
        <view class="greeting-header">
          <text class="greeting-text">{{greeting}}</text>
          <view class="vip-tag">
            <text>{{vipLevel}}</text>
          </view>
        </view>
        <view class="quick-actions">
          <view class="action-card" :data-index="0" @tap.stop="goCategory">
            <view class="iconfont icon-maicai action-icon"></view>
            <text class="action-title">{{quickActions[0].title}}</text>
            <text class="action-subtitle">{{quickActions[0].subtitle}}</text>
          </view>
          <view class="action-card" :data-index="1" @tap.stop="goNeighbor">
            <view class="iconfont icon-linlishequ action-icon"></view>
            <text class="action-title">{{quickActions[1].title}}</text>
            <text class="action-subtitle">{{quickActions[1].subtitle}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 卡片2：团购特惠 -->
    <view class="card" v-if="flashSaleProducts.length > 0">
      <view class="flash-sale-section">
        <view class="section-header">
          <text class="section-title">团购特惠</text>
          <view class="countdown-box">
            <text class="countdown-text">距结束 {{countdown}}</text>
          </view>
          <text class="view-more" @tap="onViewMore">查看更多</text>
        </view>
        <scroll-view class="product-scroll" scroll-x="true">
          <view class="product-list">
            <view class="product-card" v-for="item in flashSaleProducts" :key="item.id">
              <image class="product-image" :src="item.image" mode="aspectFill"></image>
              <view class="product-info">
                <text class="product-name">{{item.name}}</text>
                <text class="product-weight">{{item.weight}}</text>
                <view class="price-row">
                  <text class="original-price">{{item.originalPrice}}</text>
                  <text class="current-price">{{item.currentPrice}}</text>
                  <view class="quantity-inline">
                    <view class="btn-minus" v-if="item.quantity > 0" @tap.stop="decreaseFromFlash(item)">
                      <view class="minus-icon"></view>
                    </view>
                    <text class="quantity-num" v-if="item.quantity > 0">{{item.quantity}}</text>
                    <view class="btn-plus" @tap.stop="addToCart(item)">
                      <view class="add-icon"></view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 卡片3：轮播图（云端管理） -->
    <view class="card card-no-padding" v-if="banners.length > 0">
      <view class="group-section">
        <swiper class="group-swiper" circular="true" autoplay="true" interval="4000" @change="onSwiperChange">
          <swiper-item v-for="(banner, idx) in banners" :key="idx">
            <image class="group-image" :src="banner.image" mode="aspectFill" @tap="onBannerTap(banner)"></image>
          </swiper-item>
        </swiper>
        <view class="swiper-indicators" v-if="banners.length > 1">
          <view class="indicator" v-for="(banner, idx) in banners" :key="idx" :class="{ active: currentSwiper === idx }"></view>
        </view>
      </view>
    </view>

    <!-- 品牌Logo区域 -->
    <view class="brand-section">
      <image class="brand-logo" src="/static/images/logo.png" mode="aspectFit"></image>
    </view>

    <!-- 底部结算栏 -->
    <view class="checkout-bar" v-if="selectedCount > 0">
      <view class="checkout-left" @tap="goCart">
        <view class="checkout-cart-wrap">
          <image class="checkout-cart-icon" src="/static/images/gouwuche.png" mode="aspectFit"></image>
          <view class="checkout-cart-badge">
            <text>{{selectedCount}}</text>
          </view>
        </view>
        <view class="checkout-info">
          <text class="checkout-count">已选{{selectedCount}}件商品</text>
          <text class="checkout-total">合计：<text class="checkout-price">¥{{selectedTotal}}</text></text>
        </view>
      </view>
      <view class="checkout-btn" @tap="goCheckout">
        <text>去结算</text>
      </view>
    </view>

    <custom-tabbar :current="0" />
  </view>
</template>

<script>
  import { isLoggedIn, getMyUserInfo } from '@/utils/auth.js'
  import { STORAGE_KEYS } from '@/utils/config.js'
  import { API_BASE } from '@/utils/config.js'

  export default {
    data() {
      return {
        countdown: '02:59:59',
        vipLevel: 'V1',
        isLogin: false,
        userInfo: {},
        quickActions: [
          { title: '买菜', subtitle: '提前下单 送菜上门' },
          { title: '邻里', subtitle: '免费发布 邻里互动' }
        ],
        flashSaleLoading: false,
        flashSaleProducts: [],
        flashSaleEndTime: null,
        selectedCount: 0,
        selectedTotal: '0.00',
        currentSwiper: 0,
        banners: []
      }
    },

    computed: {
      greeting() {
        if (this.isLogin && this.userInfo.nickname) return 'Hi,' + this.userInfo.nickname
        return 'Hi,亲爱的邻居'
      }
    },

    onLoad() {
      this.startCountdown();
      this.loadFlashSaleProducts();
      this.loadBanners();
      this.updateCartInfo();
    },

    onShow() {
      this.isLogin = isLoggedIn()
      if (this.isLogin) {
        this.userInfo = getMyUserInfo() || {}
        this.vipLevel = this.userInfo.vipLevel || 'V1'
      }
      this.updateCartInfo()
    },

    methods: {
      async loadBanners() {
        try {
          const res = await uni.request({
            url: API_BASE + '/getBanners',
            method: 'POST',
            data: { method: 'getBanners', params: {} }
          })
          if (res.data && res.data.code === 0) {
            this.banners = res.data.data || []
          }
        } catch (e) {
          console.error('加载轮播图失败:', e)
        }
      },

      onBannerTap(banner) {
        if (banner.linkType === 'product' && banner.linkId) {
          uni.navigateTo({ url: '/pages/product/index?id=' + banner.linkId })
        } else if (banner.linkType === 'category' && banner.linkId) {
          uni.navigateTo({ url: '/pages/category/index?categoryId=' + banner.linkId })
        }
      },

      onSwiperChange(e) {
        this.currentSwiper = e.detail.current
      },

      startCountdown() {
        const now = new Date()
        const end = new Date(now)
        end.setHours(23, 59, 59, 999)
        this.flashSaleEndTime = end.getTime()
        this.tickCountdown()
      },

      tickCountdown() {
        const diff = this.flashSaleEndTime - Date.now()
        if (diff <= 0) { this.countdown = '00:00:00'; return }
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
        this.countdown = h + ':' + m + ':' + s
        setTimeout(() => this.tickCountdown(), 1000)
      },

      async loadFlashSaleProducts() {
        this.flashSaleLoading = true
        try {
          const res = await uni.request({
            url: API_BASE + '/getProducts',
            method: 'POST',
            data: { method: 'getProducts', params: { page: 1, pageSize: 10, onSale: true } }
          })
          if (res.data && res.data.code === 0) {
            const cart = uni.getStorageSync(STORAGE_KEYS.CART) || []
            this.flashSaleProducts = (res.data.data || []).map(p => {
              const cartItem = cart.find(c => c.id === p._id)
              return {
                id: p._id,
                name: p.name,
                weight: p.specs && p.specs[0] ? p.specs[0].name : '',
                image: p.image || p.coverImage || '',
                originalPrice: p.originalPrice ? '¥' + p.originalPrice : '',
                currentPrice: p.price ? '¥' + p.price : '',
                quantity: cartItem ? cartItem.quantity : 0,
                product: p
              }
            })
          }
        } catch (e) {
          console.error('加载团购商品失败:', e)
        }
        this.flashSaleLoading = false
      },

      addToCart(item) {
        let cart = uni.getStorageSync(STORAGE_KEYS.CART) || []
        const exist = cart.find(c => c.id === item.id)
        if (exist) {
          exist.quantity++
        } else {
          cart.push({ id: item.id, quantity: 1, product: item.product })
        }
        uni.setStorageSync(STORAGE_KEYS.CART, cart)
        item.quantity++
        this.updateCartInfo()
      },

      decreaseFromFlash(item) {
        if (item.quantity <= 0) return
        let cart = uni.getStorageSync(STORAGE_KEYS.CART) || []
        const exist = cart.find(c => c.id === item.id)
        if (exist) {
          exist.quantity--
          if (exist.quantity <= 0) {
            cart = cart.filter(c => c.id !== item.id)
          }
        }
        uni.setStorageSync(STORAGE_KEYS.CART, cart)
        item.quantity--
        this.updateCartInfo()
      },

      updateCartInfo() {
        const cart = uni.getStorageSync(STORAGE_KEYS.CART) || []
        this.selectedCount = cart.reduce((sum, c) => sum + c.quantity, 0)
        const total = cart.reduce((sum, c) => {
          const price = (c.product && c.product.price) || 0
          return sum + price * c.quantity
        }, 0)
        this.selectedTotal = total.toFixed(2)
      },

      goCategory() { uni.switchTab({ url: '/pages/category/index' }) },
      goNeighbor() { uni.navigateTo({ url: '/pages/neighbor/index' }) },
      goMine() { uni.switchTab({ url: '/pages/mine/index' }) },
      goCart() { uni.switchTab({ url: '/pages/order/index' }) },
      goCheckout() { uni.navigateTo({ url: '/pages/checkout/index' }) },
      onViewMore() { uni.switchTab({ url: '/pages/category/index' }) }
    }
  }
</script>

<style>
@import '/static/css/iconfont.css';

page { background-color: #F5F1EB; }

.container {
  padding: 0 24rpx 120rpx;
  background-color: #F5F1EB;
  min-height: 100vh;
}

.ip-section {
  margin: 0 -24rpx;
  padding: 0;
}

.ip-image {
  width: 100%;
  height: 720rpx;
  display: block;
}

.card {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-top: 20rpx;
}

.card-no-padding {
  padding: 0;
  overflow: hidden;
}

.greeting-section { padding: 8rpx 0; }

.greeting-header {
  display: flex;
  align-items: center;
}

.greeting-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #2D5A27;
}

.vip-tag {
  background-color: #4F9A42;
  color: #FFFFFF;
  font-size: 18rpx;
  font-weight: 600;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
}

.quick-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}

.action-card {
  width: 300rpx;
  height: 180rpx;
  background-color: transparent;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.action-icon {
  font-size: 95rpx;
  color: #4F9A42;
}

.action-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
  margin-top: 16rpx;
}

.action-subtitle {
  font-size: 20rpx;
  font-weight: 400;
  color: #999999;
  margin-top: 8rpx;
}

.flash-sale-section {}

.section-header {
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #2D5A27;
}

.countdown-box {
  background-color: #F5F5F5;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
}

.countdown-text {
  font-size: 22rpx;
  font-weight: 400;
  color: #FF3333;
}

.view-more {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  margin-left: auto;
}

.product-scroll {
  margin-top: 24rpx;
  white-space: nowrap;
}

.product-list { display: flex; }

.product-card {
  width: 220rpx;
  flex-shrink: 0;
  margin-right: 16rpx;
  overflow: hidden;
}

.product-image {
  width: 220rpx;
  height: 220rpx;
  border-radius: 16rpx;
  background-color: #f5f5f5;
}

.product-info { white-space: normal; overflow: hidden; }

.product-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  margin-top: 12rpx;
  display: block;
  white-space: normal;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}

.product-weight {
  font-size: 20rpx;
  font-weight: 400;
  color: #666666;
  margin-top: 4rpx;
  display: block;
  white-space: normal;
}

.price-row {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.original-price {
  font-size: 22rpx;
  font-weight: 400;
  color: #999999;
  text-decoration: line-through;
}

.current-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF3333;
  margin-left: 16rpx;
}

.quantity-inline {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.btn-minus,
.btn-plus {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-minus {
  border: 2rpx solid #E0E0E0;
  border-radius: 50%;
  background-color: #FFFFFF;
}

.btn-plus {
  background-color: #4F9A42;
  border-radius: 8rpx;
}

.minus-icon {
  width: 18rpx;
  height: 3rpx;
  background-color: #999999;
  border-radius: 2rpx;
}

.add-icon {
  width: 18rpx;
  height: 3rpx;
  background-color: #FFFFFF;
  border-radius: 2rpx;
  position: relative;
}

.add-icon::after {
  content: '';
  position: absolute;
  width: 3rpx;
  height: 18rpx;
  background-color: #FFFFFF;
  border-radius: 2rpx;
  top: -7rpx;
  left: 7rpx;
}

.quantity-num {
  font-size: 26rpx;
  color: #333333;
  min-width: 40rpx;
  text-align: center;
}

.group-section { position: relative; }

.group-swiper {
  width: 100%;
  height: 380rpx;
  overflow: hidden;
  font-size: 0;
  line-height: 0;
}

swiper-item {
  height: 100%;
  line-height: 0;
  font-size: 0;
  display: block;
  box-sizing: border-box;
}

.group-image {
  width: 100%;
  height: 100%;
  display: block;
}

.swiper-indicators {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 8rpx 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.1));
}

.indicator {
  width: 12rpx;
  height: 12rpx;
  background-color: #CCCCCC;
  border-radius: 50%;
  margin: 0 8rpx;
}

.indicator.active { background-color: #2D5A27; }

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0 12rpx;
}

.brand-logo {
  width: 96rpx;
  height: 96rpx;
}

.checkout-bar {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  height: 100rpx;
  background-color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.checkout-left { display: flex; align-items: center; }

.checkout-cart-wrap {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.checkout-cart-icon { width: 75rpx; height: 75rpx; }

.checkout-cart-badge {
  position: absolute;
  top: -4rpx;
  right: -8rpx;
  min-width: 28rpx;
  height: 28rpx;
  background-color: #FF3333;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

.checkout-cart-badge text { color: #FFFFFF; font-size: 18rpx; }

.checkout-info { display: flex; flex-direction: column; }

.checkout-count { font-size: 22rpx; color: #999999; }

.checkout-total { font-size: 22rpx; color: #333333; margin-top: 4rpx; }

.checkout-price { font-size: 28rpx; font-weight: 700; color: #4CAF50; }

.checkout-btn {
  background-color: #4f9a42;
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 600;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
}
</style>
