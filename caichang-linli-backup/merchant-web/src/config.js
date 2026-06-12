// 4端统一 baseURL（与 utils/config.js 对齐）
export const BASE_URL = 'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com'
export const CLOUD_OBJECT = '/merchant-api'
export const API_BASE = BASE_URL + CLOUD_OBJECT

// 订单状态枚举
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PENDING_SORTING: 'pending_sorting',
  SORTING: 'sorting',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded'
}

// 订单状态中文映射
export const ORDER_STATUS_TEXT = {
  pending_payment: '待付款',
  paid: '已付款',
  pending_sorting: '待分拣',
  sorting: '分拣中',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  refunding: '退款中',
  refunded: '已退款'
}

// 商品状态
export const PRODUCT_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SOLD_OUT: 'sold_out'
}
export const PRODUCT_STATUS_TEXT = {
  online: '在售',
  offline: '已下架',
  sold_out: '已售罄'
}

// 骑手状态
export const RIDER_STATUS = {
  OFFLINE: 'offline',
  IDLE: 'idle',
  DELIVERING: 'delivering'
}
export const RIDER_STATUS_TEXT = {
  offline: '离线',
  idle: '空闲',
  delivering: '配送中'
}

// 帖子状态
export const POST_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  DELETED: 'deleted'
}
export const POST_STATUS_TEXT = {
  active: '正常',
  closed: '已关闭',
  deleted: '已删除'
}

// 认证状态
export const CERT_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  CERTIFIED: 'certified',
  REJECTED: 'rejected'
}
export const CERT_STATUS_TEXT = {
  none: '未认证',
  pending: '审核中',
  certified: '已认证',
  rejected: '已拒绝'
}

// 通用：把任意状态值归一为中文（兼容旧数据中英文混用）
export function statusToText(status, type = 'order') {
  if (!status) return ''
  const map = {
    order: ORDER_STATUS_TEXT,
    product: PRODUCT_STATUS_TEXT,
    rider: RIDER_STATUS_TEXT,
    post: POST_STATUS_TEXT,
    cert: CERT_STATUS_TEXT
  }[type]
  if (map && map[status]) return map[status]
  // 旧数据兼容：若传入的是中文，直接返回
  return status
}
