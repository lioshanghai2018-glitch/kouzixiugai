import uniCloud from './uniCloud'

export const getFlashSale = () => uniCloud.callMethod('getFlashSale', {})

export const saveFlashSale = (data) => uniCloud.callMethod('saveFlashSale', data)

export const getFlashSaleProducts = (params) => uniCloud.callMethod('getFlashSaleProducts', params)

export const addFlashSaleProduct = (data) => uniCloud.callMethod('addFlashSaleProduct', data)

export const updateFlashSaleProduct = (id, data) => uniCloud.callMethod('updateFlashSaleProduct', { id, ...data })

export const deleteFlashSaleProduct = (id) => uniCloud.callMethod('deleteFlashSaleProduct', { id })
