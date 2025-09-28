import axios from 'axios';
import {
  CatalogDto,
  CatalogCreateDto,
  CatalogUpdateDto,
  CatalogQueryParams,
  PageResponse,
  ApiResponse,
  CatalogStats,
  TableInfo,
  FieldInfoDto,
  TablePreviewDto,
} from '../types/catalog';

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
      window.location.href = '/quiz/login';
    }
    return Promise.reject(error);
  }
);

// 合成目录管理API服务
export class CatalogService {
  // 查询合成目录列表
  static async getCatalogs(params: CatalogQueryParams): Promise<PageResponse<CatalogDto>> {
    return api.get('/catalog', { params });
  }

  // 获取合成目录详情
  static async getCatalogById(modelId: string): Promise<ApiResponse<CatalogDto>> {
    return api.get(`/catalog/${modelId}`);
  }

  // 新增合成目录
  static async createCatalog(catalogData: CatalogCreateDto): Promise<ApiResponse<CatalogDto>> {
    return api.post('/catalog', catalogData);
  }

  // 编辑合成目录
  static async updateCatalog(modelId: string, catalogData: CatalogUpdateDto): Promise<ApiResponse<CatalogDto>> {
    return api.put(`/catalog/${modelId}`, catalogData);
  }

  // 删除合成目录
  static async deleteCatalog(modelId: string): Promise<ApiResponse> {
    return api.delete(`/catalog/${modelId}`);
  }

  // 批量删除合成目录
  static async deleteCatalogs(modelIds: string[]): Promise<ApiResponse> {
    return api.post('/catalog/batch-delete', { modelIds });
  }

  // 开始训练模型
  static async startTraining(modelId: string): Promise<ApiResponse> {
    return api.post(`/catalog/${modelId}/train`);
  }

  // 停止训练模型
  static async stopTraining(modelId: string): Promise<ApiResponse> {
    return api.post(`/catalog/${modelId}/stop`);
  }

  // 重新训练模型
  static async retryTraining(modelId: string): Promise<ApiResponse> {
    return api.post(`/catalog/${modelId}/retry`);
  }

  // 获取关联表字段信息
  static async getTableFields(tabId: string): Promise<ApiResponse<FieldInfoDto[]>> {
    return api.get(`/catalog/table/${tabId}/fields`);
  }

  // 获取关联表数据预览
  static async getTablePreview(tabId: string, limit?: number): Promise<ApiResponse<TablePreviewDto>> {
    return api.get(`/catalog/table/${tabId}/preview`, { params: { limit } });
  }

  // 获取可用的关联表列表
  static async getAvailableTables(): Promise<ApiResponse<TableInfo[]>> {
    return api.get('/catalog/tables');
  }

  // 检查模型名称是否存在
  static async checkModelName(modelName: string, excludeModelId?: string): Promise<ApiResponse<{ exists: boolean }>> {
    return api.get('/catalog/check/modelName', { 
      params: { modelName, excludeModelId } 
    });
  }

  // 获取统计信息
  static async getCatalogStats(): Promise<ApiResponse<CatalogStats>> {
    return api.get('/catalog/stats');
  }

  // 获取用户的合成目录列表
  static async getUserCatalogs(createUser: string): Promise<ApiResponse<CatalogDto[]>> {
    return api.get('/catalog/user', { params: { createUser } });
  }

  // 更新模型配置参数
  static async updateSamplingConfig(modelId: string, config: Record<string, any>): Promise<ApiResponse> {
    return api.put(`/catalog/${modelId}/sampling-config`, config);
  }

  // 更新训练配置参数
  static async updateTrainingConfig(modelId: string, config: Record<string, any>): Promise<ApiResponse> {
    return api.put(`/catalog/${modelId}/training-config`, config);
  }

  // 导出合成目录数据
  static async exportCatalog(modelId: string): Promise<Blob> {
    const response = await api.get(`/catalog/${modelId}/export`, {
      responseType: 'blob',
    });
    return response;
  }

  // 导出合成目录列表
  static async exportCatalogs(params?: CatalogQueryParams): Promise<Blob> {
    const response = await api.get('/catalog/export', {
      params,
      responseType: 'blob',
    });
    return response;
  }

  // 获取模型训练日志
  static async getTrainingLogs(modelId: string): Promise<ApiResponse<string[]>> {
    return api.get(`/catalog/${modelId}/logs`);
  }

  // 获取模型训练进度
  static async getTrainingProgress(modelId: string): Promise<ApiResponse<{ progress: number; status: string }>> {
    return api.get(`/catalog/${modelId}/progress`);
  }
}

export default CatalogService;