import uniCloud from './uniCloud'

export const getList = () => uniCloud.callMethod('getCategories')

export const add = (data) => uniCloud.callMethod('addCategory', data)

export const update = (id, data) => uniCloud.callMethod('updateCategory', { id, ...data })

export const remove = (id) => uniCloud.callMethod('deleteCategory', { id })