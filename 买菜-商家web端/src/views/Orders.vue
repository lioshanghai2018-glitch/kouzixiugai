<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrders, updateOrderStatus, processRefund, deleteOrder } from '../api/orders'
import { getList as getRiders, assignOrder } from '../api/riders'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '../config.js'

// 旧字段兼容：web端/数据库里可能仍是 pending/confirmed/中文
const LEGACY_TO_CANONICAL = {
  'pending': ORDER_STATUS.PENDING_PAYMENT,
  '待支付': ORDER_STATUS.PENDING_PAYMENT,
  'confirmed': ORDER_STATUS.PAID,
  '已接单': ORDER_STATUS.PAID
}

const canonicalOf = (s) => LEGACY_TO_CANONICAL[s] || s

// v-if 用：检查 row.status 是否命中 canonical 枚举（自动兼容旧值）
const matchStatus = (row, canonical) => canonicalOf(row.status) === canonical

let pollTimer = null

const loading = ref(false)
const orders = ref([])
const riders = ref([])
const filterStatus = ref('')
const detailVisible = ref(false)
const currentOrder = ref(null)
const refundDialogVisible = ref(false)
const assignDialogVisible = ref(false)
const transferDialogVisible = ref(false) // 转单弹窗
const selectedRiderId = ref('')
const refundForm = ref({
  refundAmount: 0,
  action: 'approve'
})

const statusOptions = [
  { label: '全部', value: '' },
  { label: ORDER_STATUS_TEXT.pending_payment, value: ORDER_STATUS.PENDING_PAYMENT },
  { label: ORDER_STATUS_TEXT.paid, value: ORDER_STATUS.PAID },
  { label: ORDER_STATUS_TEXT.delivering, value: ORDER_STATUS.DELIVERING },
  { label: ORDER_STATUS_TEXT.completed, value: ORDER_STATUS.COMPLETED },
  { label: ORDER_STATUS_TEXT.cancelled, value: ORDER_STATUS.CANCELLED },
  { label: ORDER_STATUS_TEXT.refunding, value: ORDER_STATUS.REFUNDING },
  { label: ORDER_STATUS_TEXT.refunded, value: ORDER_STATUS.REFUNDED }
]

const statusMap = {
  ...ORDER_STATUS_TEXT,
  // 兼容旧中文
  '待支付': '待支付',
  '已接单': '已接单',
  '配送中': '配送中',
  '已完成': '已完成',
  '已取消': '已取消',
  '退款中': '退款中',
  '已退款': '已退款'
}

const statusTypeMap = {
  [ORDER_STATUS.PENDING_PAYMENT]: 'warning',
  [ORDER_STATUS.PAID]: 'primary',
  [ORDER_STATUS.DELIVERING]: 'primary',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'info',
  [ORDER_STATUS.REFUNDING]: 'warning',
  [ORDER_STATUS.REFUNDED]: 'success',
  // 兼容旧值
  pending: 'warning',
  confirmed: 'primary',
  '待支付': 'warning',
  '已接单': 'primary',
  '配送中': 'primary',
  '已完成': 'success',
  '已取消': 'info',
  '退款中': 'warning',
  '已退款': 'success'
}

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orders.value
  return orders.value.filter(o => canonicalOf(o.status) === filterStatus.value)
})

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await getOrders()
    console.log('getOrders 响应:', res)
    let data = res?.data
    if (data && !Array.isArray(data)) {
      data = data.data
    }
    orders.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取订单失败:', e)
    ElMessage.error('获取订单失败')
  } finally {
    loading.value = false
  }
}

const fetchRiders = async () => {
  try {
    const res = await getRiders()
    riders.value = res?.data || []
  } catch (e) {
    console.error('获取骑手列表失败:', e)
  }
}

const getRiderName = (order) => {
  return order.riderName || '-'
}

const showDetail = (order) => {
  currentOrder.value = { ...order }
  detailVisible.value = true
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const handleStatusChange = async (order, newStatus) => {
  try {
    await ElMessageBox.confirm(`确定将订单状态改为"${statusMap[newStatus]}"吗？`, '提示', { type: 'warning' })
    const res = await updateOrderStatus(order._id, newStatus)
    // 接单时显示自动分配结果
    if (newStatus === 'confirmed') {
      ElMessage.success(res?.msg || '已接单')
    } else {
      ElMessage.success('状态更新成功')
    }
    fetchOrders()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

const openRefundDialog = (order) => {
  currentOrder.value = order
  refundForm.value = {
    refundAmount: order.totalAmount || 0,
    action: 'approve'
  }
  refundDialogVisible.value = true
}

const handleRefund = async () => {
  try {
    await processRefund(currentOrder.value._id, refundForm.value.refundAmount, refundForm.value.action)
    ElMessage.success(refundForm.value.action === 'reject' ? '已拒绝退款申请' : '退款处理完成')
    refundDialogVisible.value = false
    fetchOrders()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (order) => {
  try {
    await ElMessageBox.confirm('确定删除该订单吗？删除后不可恢复。', '警告', { type: 'warning' })
    await deleteOrder(order._id)
    ElMessage.success('删除成功')
    fetchOrders()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const openAssignDialog = (order) => {
  currentOrder.value = order
  selectedRiderId.value = order.riderId || ''
  assignDialogVisible.value = true
}

const openTransferDialog = (order) => {
  currentOrder.value = order
  selectedRiderId.value = order.riderId || ''
  transferDialogVisible.value = true
}

const handleAssign = async () => {
  if (!selectedRiderId.value) {
    ElMessage.warning('请选择骑手')
    return
  }
  try {
    await assignOrder(currentOrder.value._id, selectedRiderId.value)
    ElMessage.success('订单已分配给骑手')
    assignDialogVisible.value = false
    fetchOrders()
  } catch (e) {
    ElMessage.error('分配失败')
  }
}

onMounted(() => {
  fetchOrders()
  fetchRiders()
  // 8s 轮询拉新订单
  pollTimer = setInterval(fetchOrders, 8000)
})

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="orders-page">
    <h2 class="page-title">订单管理</h2>

    <!-- 筛选 -->
    <el-card class="filter-card">
      <div style="display: flex; align-items: center; gap: 16px;">
        <el-select v-model="filterStatus" placeholder="筛选订单状态" style="width: 200px;">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button @click="fetchOrders">刷新</el-button>
        <span style="color: #666;">共 {{ filteredOrders.length }} 条订单</span>
      </div>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="orders-card">
      <el-table :data="filteredOrders" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="140">
          <template #default="{ row }">
            <span style="font-weight: 600;">{{ row.orderNo || row._id?.slice(-8).toUpperCase() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="80">
          <template #default="{ row }">
            <span style="color: #ff4d4f; font-weight: bold;">¥{{ row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="userPhone" label="用户手机" width="110" />
        <el-table-column label="骑手" width="110">
          <template #default="{ row }">
            <div v-if="row.riderName" style="background: #e1f3d8; padding: 4px 8px; border-radius: 4px; text-align: center;">
              <span style="color: #67C23A; font-weight: 700; font-size: 13px;">{{ row.riderName }}</span>
              <div style="font-size: 11px; color: #999;">{{ row.riderPhone || '' }}</div>
            </div>
            <span v-else-if="row.status === 'confirmed' || row.status === '已接单'" style="background: #fdf6ec; color: #E6A23C; padding: 4px 8px; border-radius: 4px; font-size: 12px;">待分配</span>
            <span v-else style="color: #999;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status] || 'info'">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div v-for="(p, idx) in (row.products || []).slice(0, 2)" :key="idx" style="font-size: 12px; color: #666;">
              {{ p.name }} x{{ p.qty }}
            </div>
            <span v-if="(row.products || []).length > 2" style="font-size: 12px; color: #999;">...</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
            <!-- 待付款 → 接单/取消 -->
            <el-button v-if="matchStatus(row, 'pending_payment')" link type="success" @click="handleStatusChange(row, 'paid')">接单</el-button>
            <el-button v-if="matchStatus(row, 'pending_payment')" link type="danger" @click="handleStatusChange(row, 'cancelled')">取消</el-button>
            <!-- 已接单(paid) → 分配骑手/开始配送/转单 -->
            <el-button v-if="matchStatus(row, 'paid') && !row.riderId" type="warning" @click="openAssignDialog(row)">分配骑手</el-button>
            <el-button v-if="matchStatus(row, 'paid') && row.riderId" type="primary" @click="handleStatusChange(row, 'delivering')">开始配送</el-button>
            <el-button v-if="matchStatus(row, 'paid') && row.riderId" type="warning" @click="openTransferDialog(row)" style="font-weight: 600;">🔄 转单</el-button>
            <!-- 配送中 → 完成/转单 -->
            <el-button v-if="matchStatus(row, 'delivering')" type="success" @click="handleStatusChange(row, 'completed')">完成</el-button>
            <el-button v-if="matchStatus(row, 'delivering')" type="warning" @click="openTransferDialog(row)" style="font-weight: 600;">🔄 转单</el-button>
            <!-- 退款中 → 处理退款 -->
            <el-button v-if="matchStatus(row, 'refunding')" link type="warning" @click="openRefundDialog(row)">处理退款</el-button>
            <!-- 删除 -->
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredOrders.length === 0 && !loading" description="暂无订单" />
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-if="currentOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo || currentOrder._id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTypeMap[currentOrder.status]">{{ statusMap[currentOrder.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="用户手机">{{ currentOrder.userPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ currentOrder.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="退款金额" v-if="currentOrder.refundAmount">¥{{ currentOrder.refundAmount }}</el-descriptions-item>
          <el-descriptions-item label="退款原因" v-if="currentOrder.refundReason" :span="2">{{ currentOrder.refundReason }}</el-descriptions-item>
          <el-descriptions-item label="下单时间" :span="2">{{ formatTime(currentOrder.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ currentOrder.address?.name }} {{ currentOrder.address?.phone }}
            <br>{{ currentOrder.address?.address }}
          </el-descriptions-item>
        </el-descriptions>

        <h4 style="margin-top: 20px;">商品列表</h4>
        <el-table :data="currentOrder.products" size="small" border>
          <el-table-column prop="name" label="商品名称" />
          <el-table-column label="价格" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column label="小计" width="100">
            <template #default="{ row }">¥{{ (row.price * row.qty).toFixed(2) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 退款处理弹窗 -->
    <el-dialog v-model="refundDialogVisible" title="处理退款" width="400px">
      <el-form :model="refundForm" label-width="80px">
        <el-form-item label="订单金额">
          <span>¥{{ currentOrder?.totalAmount }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="refundForm.refundAmount" :min="0" :max="currentOrder?.totalAmount || 0" :precision="2" />
        </el-form-item>
        <el-form-item label="操作">
          <el-radio-group v-model="refundForm.action">
            <el-radio label="approve">同意退款</el-radio>
            <el-radio label="reject">拒绝退款</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRefund">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配骑手弹窗 -->
    <el-dialog v-model="assignDialogVisible" title="分配骑手" width="400px">
      <el-form label-width="80px">
        <el-form-item label="订单">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="收货地址">
          <span>{{ currentOrder?.address?.address }} {{ currentOrder?.address?.doorNo }}</span>
        </el-form-item>
        <el-form-item label="选择骑手">
          <el-select v-model="selectedRiderId" placeholder="请选择骑手" style="width: 100%;">
            <el-option
              v-for="rider in riders.filter(r => r.status === 'active' && r.riderStatus === 'online')"
              :key="rider._id"
              :label="`${rider.name} (${rider.phone})`"
              :value="rider._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssign">确定分配</el-button>
      </template>
    </el-dialog>

    <!-- 转单弹窗 -->
    <el-dialog v-model="transferDialogVisible" title="转单" width="400px">
      <el-form label-width="80px">
        <el-form-item label="当前骑手">
          <span style="color: #999;">{{ currentOrder?.riderName }} ({{ currentOrder?.riderPhone }})</span>
        </el-form-item>
        <el-form-item label="订单">
          <span>{{ currentOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="收货地址">
          <span>{{ currentOrder?.address?.address }} {{ currentOrder?.address?.doorNo }}</span>
        </el-form-item>
        <el-form-item label="选择骑手">
          <el-select v-model="selectedRiderId" placeholder="请选择新骑手" style="width: 100%;">
            <el-option
              v-for="rider in riders.filter(r => r.status === 'active' && r.riderStatus === 'online' && r._id !== currentOrder?.riderId)"
              :key="rider._id"
              :label="`${rider.name} (${rider.phone})`"
              :value="rider._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="handleAssign">确认转单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.orders-page {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}
.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}
.filter-card {
  margin-bottom: 16px;
}
.orders-card {
  margin-bottom: 20px;
}
</style>