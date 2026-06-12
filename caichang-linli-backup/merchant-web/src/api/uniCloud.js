import axios from 'axios'
import { getMerchantId, getToken, setMerchantId, setToken } from '../utils/auth.js'

const uniCloud = axios.create({
  baseURL: 'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com/merchant-api'
})

// 自动 bootstrap：单商家场景下，localStorage 没 merchantId 时自动从云端拿
let _bootstrapPromise = null
function autoBootstrapMerchant() {
  if (_bootstrapPromise) return _bootstrapPromise
  _bootstrapPromise = axios.post(
    'https://fc-mp-ae9bd108-da40-4ae6-923b-c3007dedec12.next.bspapp.com/merchant-api/merchantAutoLogin',
    { method: 'merchantAutoLogin', params: {} }
  ).then(res => {
    if (res.data && res.data.code === 0 && res.data.data) {
      const d = res.data.data
      if (d.merchantId) setMerchantId(d.merchantId)
      if (d.token) setToken(d.token)
      return true
    }
    return false
  }).catch(() => false)
  return _bootstrapPromise
}

// 请求拦截：自动注入 merchantId + token；必要时自动 bootstrap
uniCloud.interceptors.request.use(async config => {
  const params = (config.data && config.data.params) || {}
  if (!params.merchantId) {
    let mid = getMerchantId()
    if (!mid) {
      // 没存 merchantId → 尝试从云端拿唯一商家
      await autoBootstrapMerchant()
      mid = getMerchantId()
    }
    if (mid) params.merchantId = mid
  }
  const token = getToken()
  if (token) {
    config.headers['uni-id-token'] = token
    if (!params.token) params.token = token
  }
  if (config.data) config.data.params = params
  return config
})

// 响应拦截：401 → 跳登录
uniCloud.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

uniCloud.callMethod = (method, params = {}) => {
  return uniCloud.post(`/${method}`, { method, params })
}

export default uniCloud