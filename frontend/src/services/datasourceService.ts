import axios from 'axios';
import {
  DataSourceDto,
  DataSourceCreateDto,
  DataSourceUpdateDto,
  DataSourceQueryParams,
  DataSourceTestDto,
  PageResponse,
  ApiResponse,
  NameExistsResponse,
  DataSourceType
} from '../types/datasource';

// 创建axios实例
const api = axios.create({
  baseURL: '/quiz/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 数据源管理API服务
export class DataSourceService {
  // 分页查询数据源列表
  static async getDataSources(params: DataSourceQueryParams): Promise<PageResponse<DataSourceDto>> {
    const queryParams = {
      page: params.page, // 后端从0开始
      size: params.size,
      ...(params.name && { name: params.name }),
      ...(params.type && { type: params.type }),
      ...(params.state && { state: params.state })
    };
    return api.get('/datasources', { params: queryParams });
  }

  // 创建数据源
  static async createDataSource(data: DataSourceCreateDto): Promise<ApiResponse<DataSourceDto>> {
    return api.post('/datasources', data);
  }

  // 更新数据源
  static async updateDataSource(dsId: string, data: DataSourceUpdateDto): Promise<ApiResponse<DataSourceDto>> {
    return api.post(`/datasources/${dsId}/update`, data);
  }

  // 删除数据源
  static async deleteDataSource(dsId: string): Promise<ApiResponse> {
    return api.post(`/datasources/${dsId}/delete`);
  }

  // 启用数据源
  static async enableDataSource(dsId: string): Promise<ApiResponse> {
    return api.post(`/datasources/${dsId}/enable`);
  }

  // 禁用数据源
  static async disableDataSource(dsId: string): Promise<ApiResponse> {
    return api.post(`/datasources/${dsId}/disable`);
  }

  // 获取数据源详情
  static async getDataSourceById(dsId: string): Promise<ApiResponse<DataSourceDto>> {
    return api.get(`/datasources/${dsId}`);
  }

  // 测试连接（已保存的数据源）
  static async testConnectionById(dsId: string): Promise<ApiResponse<boolean>> {
    return api.post(`/datasources/${dsId}/test`);
  }

  // 测试连接（配置测试）
  static async testConnection(data: DataSourceCreateDto): Promise<ApiResponse<DataSourceTestDto>> {
    return api.post('/datasources/test', data);
  }

  // 检查名称是否存在
  static async checkNameExists(dsName: string): Promise<NameExistsResponse> {
    return api.get(`/datasources/exists/name/${encodeURIComponent(dsName)}`);
  }

  // 获取数据源类型列表
  static async getDataSourceTypes(): Promise<ApiResponse<DataSourceType[]>> {
    return api.get('/datasources/types');
  }

  // 验证数据源配置
  static async validateDataSource(data: DataSourceCreateDto): Promise<ApiResponse> {
    return api.post('/datasources/validate', data);
  }
}

// 导出默认实例
export default DataSourceService;

// 工具函数：处理API错误
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '网络异常，请检查连接';
};

// 工具函数：格式化查询参数
export const formatQueryParams = (params: any): any => {
  const formatted: any = {};
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      formatted[key] = params[key];
    }
  });
  return formatted;
};

// 工具函数：防抖
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};