import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message } from '@arco-design/web-react';

// 创建axios实例
const instance: AxiosInstance = axios.create({
  baseURL: '/api', // 使用相对地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;
    
    // 如果返回的数据格式不符合预期，进行格式化
    if (typeof data === 'object' && data !== null) {
      // 如果后端返回的数据没有success字段，默认认为成功
      if (!('success' in data)) {
        return {
          success: true,
          data: data,
          message: 'success',
        };
      }
    }
    
    return data;
  },
  (error) => {
    console.error('响应拦截器错误:', error);
    
    let errorMessage = '请求失败';
    
    if (error.response) {
      // 服务器返回了错误状态码
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          errorMessage = '未授权，请重新登录';
          // 可以在这里处理登录跳转
          break;
        case 403:
          errorMessage = '拒绝访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络错误，请检查网络连接';
    } else {
      // 其他错误
      errorMessage = error.message || '未知错误';
    }
    
    Message.error(errorMessage);
    
    return Promise.reject({
      success: false,
      message: errorMessage,
      error,
    });
  }
);

// 封装请求方法
export const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get(url, config);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post(url, data, config);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.put(url, data, config);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.delete(url, config);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.patch(url, data, config);
  },
};

export default instance;