<script setup>
const stats = [
  { label: '今日订单', value: '0' },
  { label: '今日销售额', value: '¥0.00' },
  { label: '商品数量', value: '0' },
  { label: '待处理订单', value: '0' }
]
</script>

<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.stat-card {
  background: linear-gradient(135deg, #4CAF50, #81C784);
  color: #fff;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
}
.stat-label {
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.9;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
}
</style>