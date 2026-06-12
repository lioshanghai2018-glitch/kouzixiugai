import uniCloud from './uniCloud'

export const getOrders = (params = {}) => uniCloud.callMethod('getOrders', params)

export const getOrderDetail = (orderNo) => uniCloud.callMethod('getOrderDetail', { orderNo })

export const createOrder = (data) => uniCloud.callMethod('createOrder', data)

// 订单状态更新：必须传 orderNo（不是 _id），与云对象 merchant-api 保持一致
export const updateOrderStatus = (orderNo, status, extraData = {}) =>
  uniCloud.callMethod('updateOrderStatus', { orderNo, status, ...extraData })

export const applyRefund = (id, reason) => uniCloud.callMethod('applyRefund', { id, reason })

export const processRefund = (id, refundAmount, action) => uniCloud.callMethod('processRefund', { id, refundAmount, action })

export const deleteOrder = (id) => uniCloud.callMethod('deleteOrder', { id })