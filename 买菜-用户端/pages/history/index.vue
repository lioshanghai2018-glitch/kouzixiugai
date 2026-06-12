<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <text class="nav-title">浏览记录</text>
      <view class="clear-btn" @tap="clearHistory">
        <text>清空</text>
      </view>
    </view>

    <!-- 商品列表 -->
    <view class="product-list" v-if="historyList.length > 0">
      <view class="product-card" v-for="(item, index) in historyList" :key="index" @tap="goProduct(item.id)">
        <image class="product-img" :src="item.image" mode="aspectFill" />
        <view class="product-info">
          <text class="product-name">{{ item.name }}</text>
          <text class="product-spec">{{ item.spec }}</text>
          <view class="price-row">
            <text class="current-price">{{ item.currentPrice }}</text>
            <view class="add-btn" @tap.stop="addToCart(item)">
              <view class="add-icon"></view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-else>
      <text class="empty-icon">🕐</text>
      <text class="empty-text">暂无浏览记录</text>
      <text class="empty-sub">快去逛逛吧</text>
      <view class="go-btn" @tap="goCategory">
        <text>去选购</text>
      </view>
    </view>
  </view>
</template>

<script>
import { addToCart } from '@/utils/cart.js'

const HISTORY_KEY = 'browse_history'

export default {
  data() {
    return {
      historyList: []
    }
  },
  onShow() {
    this.loadHistory()
  },
  methods: {
    goBack() { uni.navigateBack() },
    loadHistory() {
      try {
        const data = uni.getStorageSync(HISTORY_KEY)
        this.historyList = data ? JSON.parse(data) : []
      } catch (e) {
        this.historyList = []
      }
    },
    clearHistory() {
      uni.showModal({
        title: '提示',
        content: '确定清空浏览记录？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync(HISTORY_KEY)
            this.historyList = []
            uni.showToast({ title: '已清空', icon: 'success' })
          }
        }
      })
    },
    goProduct(id) {
      uni.navigateTo({ url: '/pages/product/index?id=' + id })
    },
    addToCart(item) {
      addToCart({
        id: item.id,
        name: item.name,
        spec: item.spec,
        image: item.image,
        currentPrice: item.currentPrice,
        originalPrice: item.originalPrice || item.currentPrice,
        quantity: 1,
        selected: true
      })
      uni.showToast({ title: '已加入购物车', icon: 'success' })
    },
    goCategory() {
      uni.switchTab({ url: '/pages/category/index' })
    }
  }
}
</script>

<style>
.page { min-height: 100vh; background-color: #F5F1EB; padding-bottom: 40rpx; }
.nav-bar { display: flex; align-items: center; height: 88rpx; background-color: #FFFFFF; padding: 0 24rpx; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
.back-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { font-size: 44rpx; color: #333; font-weight: 300; }
.nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #333; text-align: center; }
.clear-btn { font-size: 26rpx; color: #4F9A42; }

.product-list { padding: 20rpx; margin-top: 88rpx; }
.product-card { display: flex; background-color: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; }
.product-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; }
.product-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.product-name { font-size: 28rpx; font-weight: 600; color: #333; }
.product-spec { font-size: 22rpx; color: #999; margin-top: 6rpx; }
.price-row { display: flex; align-items: center; justify-content: space-between; margin-top: 12rpx; }
.current-price { font-size: 30rpx; font-weight: 700; color: #FF3333; }
.add-btn { width: 48rpx; height: 48rpx; background-color: #4F9A42; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; }
.add-icon { width: 20rpx; height: 4rpx; background-color: #FFF; border-radius: 2rpx; position: relative; }
.add-icon::after { content: ''; position: absolute; width: 4rpx; height: 20rpx; background-color: #FFF; border-radius: 2rpx; top: -8rpx; left: 8rpx; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 32rpx; color: #333; font-weight: 600; margin-top: 16rpx; }
.empty-sub { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.go-btn { background-color: #4F9A42; color: #FFF; font-size: 28rpx; padding: 20rpx 64rpx; border-radius: 40rpx; margin-top: 32rpx; }
</style>