// 商家web端鉴权工具
import uniCloud from '../api/uniCloud.js'

const STORAGE_KEY = {
  MERCHANT_ID: 'merchant_id',
  TOKEN: 'uni_id_token',
  TOKEN_EXPIRED: 'uni_id_token_expired',
  USER_INFO: 'shop_info'
}

export function isLoggedIn() {
  const token = localStorage.getItem(STORAGE_KEY.TOKEN)
  const expired = localStorage.getItem(STORAGE_KEY.TOKEN_EXPIRED)
  if (!token) return false
  if (expired && Date.now() > Number(expired)) {
    clearAuth()
    return false
  }
  return !!localStorage.getItem(STORAGE_KEY.MERCHANT_ID)
}

export function getMerchantId() {
  return localStorage.getItem(STORAGE_KEY.MERCHANT_ID) || ''
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY.TOKEN) || ''
}

export function setAuth(data) {
  if (data.merchantId) localStorage.setItem(STORAGE_KEY.MERCHANT_ID, data.merchantId)
  if (data.token) localStorage.setItem(STORAGE_KEY.TOKEN, data.token)
  if (data.tokenExpired) localStorage.setItem(STORAGE_KEY.TOKEN_EXPIRED, String(data.tokenExpired))
  if (data.shopInfo) localStorage.setItem(STORAGE_KEY.USER_INFO, JSON.stringify(data.shopInfo))
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY.MERCHANT_ID)
  localStorage.removeItem(STORAGE_KEY.TOKEN)
  localStorage.removeItem(STORAGE_KEY.TOKEN_EXPIRED)
  localStorage.removeItem(STORAGE_KEY.USER_INFO)
}

export function logout() {
  clearAuth()
  window.location.href = '/login'
}

export async function loginMerchant(phone, password) {
  const res = await uniCloud.callMethod('merchantLogin', { phone, password })
  const data = res.data
  if (data && data.merchantId) {
    setAuth(data)
  }
  return data
}