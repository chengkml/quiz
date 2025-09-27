import axios from 'axios';
import { Message } from '@arco-design/web-react';

// 创建axios实例
const request = axios.create({
  baseURL: '/api', // 使用相对地址，符合前后端联调要求
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    const token = localStorage.getItem('token');
    if (token) {
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
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    
    // 根据后端返回的统一格式处理
    if (data && typeof data === 'object') {
      // 如果后端返回的是标准格式 {success, message, data, timestamp}
      if (data.hasOwnProperty('success')) {
        return data;
      }
      // 如果是直接返回数据
      return {
        success: true,
        data: data,
        message: 'success'
      };
    }
    
    return {
      success: true,
      data: data,
      message: 'success'
    };
  },
  (error) => {
    console.error('响应拦截器错误:', error);
    
    let errorMessage = '网络请求失败';
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '未授权，请重新登录';
          // 可以在这里处理登录跳转
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          errorMessage = '权限不足，无法访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = data?.message || '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络';
    } else {
      errorMessage = error.message || '请求配置错误';
    }
    
    // 显示错误消息
    Message.error(errorMessage);
    
    return Promise.reject({
      success: false,
      message: errorMessage,
      data: null
    });
  }
);

// 封装常用的请求方法
const http = {
  get: (url, params = {}) => {
    return request.get(url, { params });
  },
  
  post: (url, data = {}) => {
    return request.post(url, data);
  },
  
  put: (url, data = {}) => {
    return request.put(url, data);
  },
  
  delete: (url, params = {}) => {
    return request.delete(url, { params });
  },
  
  patch: (url, data = {}) => {
    return request.patch(url, data);
  }
};

export default http;