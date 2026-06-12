import uniCloud from './uniCloud'

export const getConversations = (params) => uniCloud.callMethod('getConversations', params)
export const getMessages = (params) => uniCloud.callMethod('getMessages', params)
export const sendMessage = (data) => uniCloud.callMethod('sendMessage', data)
export const markAsRead = (params) => uniCloud.callMethod('markAsRead', params)