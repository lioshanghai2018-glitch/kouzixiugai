import uniCloud from './uniCloud'

const extractData = (res) => res?.data?.data || []

export const getList = () => uniCloud.callMethod('getRiders').then(res => ({ data: extractData(res) }))

export const add = (data) => uniCloud.callMethod('addRider', data)

export const update = (id, data) => uniCloud.callMethod('updateRider', { id, ...data })

export const remove = (id) => uniCloud.callMethod('deleteRider', { id })

// 分配骑手：传 orderNo（不是 _id），与云对象 merchant-api 保持一致
export const assignOrder = (orderNo, riderId) => uniCloud.callMethod('assignOrder', { orderNo, riderId })

export const autoAssignOrders = () => uniCloud.callMethod('autoAssignOrders')