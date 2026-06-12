import uniCloud from './uniCloud'

const extractData = (res) => res?.data?.data || []

export const getList = () => uniCloud.callMethod('getCommunities').then(res => ({ data: extractData(res) }))

export const add = (data) => uniCloud.callMethod('addCommunity', data)

export const update = (id, data) => uniCloud.callMethod('updateCommunity', { id, ...data })

export const remove = (id) => uniCloud.callMethod('deleteCommunity', { id })