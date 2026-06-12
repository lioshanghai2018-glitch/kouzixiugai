import axios from 'axios'
import { getMerchantId, getToken } from '../utils/auth.js'
import { API_BASE } from '../config.js'

const uniCloud = axios.create({
  baseURL: API_BASE
})

// 请求拦截：自动注入merchantId + token
uniCloud.interceptors.request.use(config => {
  const params = (config.data && config.data.params) || {}
  const mid = getMerchantId()
  if (mid && !params.merchantId) params.merchantId = mid
  const token = getToken()
  if (token) {
    config.headers['uni-id-token'] = token
  }
  if (config.data) config.data.params = params
  return config
})

// 响应拦截：401  清凭证跳登录
uniCloud.interceptors.response.use(
  res => res,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

uniCloud.callMethod = (method, params = {}) => {
  return uniCloud.post(`/${method}`, { method, params })
}

export default uniCloud