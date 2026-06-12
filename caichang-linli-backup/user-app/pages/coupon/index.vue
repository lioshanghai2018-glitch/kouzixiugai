<template>
  <view class="page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="back-btn" @tap="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <text class="nav-title">优惠券</text>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{ active: currentTab === 0 }" @tap="switchTab(0)">
        <text>可用</text>
        <view class="tab-badge" v-if="availableCoupons.length > 0">
          <text>{{ availableCoupons.length }}</text>
        </view>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 1 }" @tap="switchTab(1)">
        <text>已用</text>
      </view>
      <view class="tab-item" :class="{ active: currentTab === 2 }" @tap="switchTab(2)">
        <text>过期</text>
      </view>
    </view>

    <!-- 优惠券列表 -->
    <scroll-view class="coupon-list" scroll-y="true">
      <view class="coupon-card" :class="{ disabled: coupon.status !== 'available' }" v-for="(coupon, index) in displayCoupons" :key="index">
        <view class="coupon-left">
          <text class="coupon-value">{{ coupon.value }}</text>
          <text class="coupon-condition">{{ coupon.condition }}</text>
        </view>
        <view class="coupon-right">
          <text class="coupon-name">{{ coupon.name }}</text>
          <text class="coupon-desc">{{ coupon.desc }}</text>
          <text class="coupon-expire">有效期至 {{ coupon.expireDate }}</text>
          <view class="coupon-status-tag" v-if="coupon.status === 'used'">
            <text>已使用</text>
          </view>
          <view class="coupon-status-tag expired" v-if="coupon.status === 'expired'">
            <text>已过期</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="displayCoupons.length === 0">
        <text class="empty-icon">🎫</text>
        <text class="empty-text">暂无优惠券</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      currentTab: 0,
      coupons: [
        { id: 1, name: '新人专享券', value: '¥10', condition: '满50可用', desc: '限首次下单使用', expireDate: '2026-06-30', status: 'available' },
        { id: 2, name: '限时满减券', value: '¥5', condition: '满30可用', desc: '限时优惠', expireDate: '2026-05-30', status: 'available' },
        { id: 3, name: '会员专享券', value: '¥8', condition: '满40可用', desc: 'VIP会员专享', expireDate: '2026-06-15', status: 'available' },
        { id: 4, name: '节日特惠券', value: '¥20', condition: '满100可用', desc: '节日活动', expireDate: '2026-04-01', status: 'used' },
        { id: 5, name: '限时秒杀券', value: '¥3', condition: '满20可用', desc: '秒杀专用', expireDate: '2026-03-01', status: 'expired' }
      ]
    }
  },
  computed: {
    availableCoupons() { return this.coupons.filter(c => c.status === 'available') },
    usedCoupons() { return this.coupons.filter(c => c.status === 'used') },
    expiredCoupons() { return this.coupons.filter(c => c.status === 'expired') },
    displayCoupons() {
      return [this.availableCoupons, this.usedCoupons, this.expiredCoupons][this.currentTab]
    }
  },
  methods: {
    goBack() { uni.navigateBack() },
    switchTab(idx) { this.currentTab = idx }
  }
}
</script>

<style>
.page { min-height: 100vh; background-color: #F5F1EB; }

.nav-bar { display: flex; align-items: center; height: 88rpx; background-color: #FFFFFF; padding: 0 24rpx; position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
.back-btn { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; }
.back-arrow { font-size: 44rpx; color: #333; font-weight: 300; }
.nav-title { flex: 1; font-size: 32rpx; font-weight: 600; color: #333; text-align: center; }

.tab-bar { display: flex; margin-top: 88rpx; background-color: #FFFFFF; padding: 0 24rpx; }
.tab-item { flex: 1; display: flex; align-items: center; justify-content: center; height: 88rpx; font-size: 28rpx; color: #666; position: relative; }
.tab-item.active { color: #4F9A42; font-weight: 600; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 4rpx; background-color: #4F9A42; border-radius: 2rpx; }
.tab-badge { position: absolute; top: 12rpx; right: 80rpx; min-width: 28rpx; height: 28rpx; background-color: #FF3333; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; }
.tab-badge text { font-size: 20rpx; color: #FFF; padding: 0 6rpx; }

.coupon-list { height: calc(100vh - 176rpx); padding: 20rpx; margin-top: 88rpx; }

.coupon-card { display: flex; background-color: #FFFFFF; border-radius: 16rpx; margin-bottom: 16rpx; overflow: hidden; }
.coupon-card.disabled { opacity: 0.6; }
.coupon-left { width: 200rpx; background: linear-gradient(135deg, #67A961, #3A7A42); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24rpx; }
.coupon-value { font-size: 44rpx; font-weight: 700; color: #FFFFFF; }
.coupon-condition { font-size: 22rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.coupon-right { flex: 1; padding: 20rpx; display: flex; flex-direction: column; position: relative; }
.coupon-name { font-size: 28rpx; font-weight: 600; color: #333; }
.coupon-desc { font-size: 22rpx; color: #666; margin-top: 4rpx; }
.coupon-expire { font-size: 20rpx; color: #999; margin-top: 8rpx; }
.coupon-status-tag { position: absolute; top: 20rpx; right: 20rpx; background-color: #999; border-radius: 8rpx; padding: 4rpx 12rpx; }
.coupon-status-tag.expired { background-color: #E0E0E0; }
.coupon-status-tag text { font-size: 20rpx; color: #FFF; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding-top: 120rpx; }
.empty-icon { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #999; margin-top: 16rpx; }
</style>