// 商家 web端鉴权
import uniCloud from '../api/uniCloud.js'

const STORAGE_KEY = {
  MERCHANT_ID: 'merchant_id',
  TOKEN: 'uni_id_token',
  USER_INFO: 'shop_info'
}

export function isLoggedIn() {
  return !!localStorage.getItem(STORAGE_KEY.MERCHANT_ID)
}

export function getMerchantId() {
  return localStorage.getItem(STORAGE_KEY.MERCHANT_ID) || ''
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY.TOKEN) || ''
}

export function setMerchantId(id) {
  localStorage.setItem(STORAGE_KEY.MERCHANT_ID, id)
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEY.TOKEN, token)
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY.MERCHANT_ID)
  localStorage.removeItem(STORAGE_KEY.TOKEN)
  localStorage.removeItem(STORAGE_KEY.USER_INFO)
}

export function logout() {
  clearAuth()
  window.location.href = '/login'
}

export async function loginMerchant(phone, password) {
  const res = await uniCloud.post('/merchantLogin', { method: 'merchantLogin', params: { phone, password } })
  if (res.data && res.data.merchantId) {
    setMerchantId(res.data.merchantId)
    if (res.data.token) setToken(res.data.token)
    if (res.data.shopInfo) localStorage.setItem(STORAGE_KEY.USER_INFO, JSON.stringify(res.data.shopInfo))
  }
  return res.data
}

export function loginAsTestMerchant(merchantId) {
  setMerchantId(merchantId)
  setToken('test-mode')
  localStorage.setItem(STORAGE_KEY.USER_INFO, JSON.stringify({ name: '测试店铺', mode: 'test' }))
}
