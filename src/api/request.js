import axios from 'axios'
import { ElMessage } from 'element-plus'

// 统一 axios 实例：所有真实接口共用此封装，禁止在页面内单独 new axios
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000
})

// 请求拦截器：统一注入 token
service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器：统一剥离数据、统一错误提示、401 跳登录
service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code && res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      if (res.code === 401) redirectToLogin()
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res
  },
  error => {
    if (error.response?.status === 401) redirectToLogin()
    ElMessage.error(error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)

function redirectToLogin() {
  localStorage.removeItem('token')
  if (location.hash !== '#/login') location.hash = '#/login'
}

export default service
