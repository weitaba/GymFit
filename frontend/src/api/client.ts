import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail || '请求失败'
      return Promise.reject(new Error(typeof detail === 'object' ? detail.detail : detail))
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请稍后重试'))
    }
    return Promise.reject(new Error('网络错误，无法连接服务器'))
  },
)

export default apiClient
