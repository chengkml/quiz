import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

/**
 * 全局 API 前缀
 * 由 webpack DefinePlugin 注入
 * 例如：'/api'
 */
declare const __API_BASE_PATH__: string;

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: __API_BASE_PATH__, // ✅ 统一从这里走
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: token,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清理登录状态
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('menuInfo');
      localStorage.removeItem('username');

      // 通知应用层（Router / Layout）
      window.dispatchEvent(new CustomEvent('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default http;
