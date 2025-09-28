import axios from 'axios';

// 类型定义
export type ModelType = 'GAN' | 'VAE' | 'DIFFUSION' | 'LLM';
export type SynthesizerState = 'ACTIVE'|'INACTIVE' | 'TRAINING' | 'FAILED' | 'CREATED';

export interface SynthesizerTrainingParamsDto {
  sampling_method: 1 | 2;
  sample_ratio?: number;
  sample_size?: number;
  sample_threshold: number;
  epochs: number;
  batch_size: number;
  use_multi_gpu: boolean;
  backend: string;
  gpu_ids?: number[];
}

export interface SynthesizerCreateDto {
  synthesizerName: string;
  modelType: ModelType;
  trainingDatasetId: string;
  trainingParams?: SynthesizerTrainingParamsDto;
  description?: string;
  createUser?: string;
}

export interface SynthesizerUpdateDto {
  synthesizerName?: string;
  description?: string;
  updateUser?: string;
}

export interface SynthesizerDto {
  synthesizerId: string;
  synthesizerName: string;
  modelType: ModelType;
  modelTypeDescription: string;
  trainingDatasetId: string;
  trainingParams: SynthesizerTrainingParamsDto;
  modelArtifactPath: string;
  modelConfigPath: string;
  state: SynthesizerState;
  stateDescription: string;
  description: string;
  createUser: string;
  createTime: string;
  updateUser: string;
  updateTime: string;
}

export interface SearchParams {
  name?: string;
  modelType?: ModelType;
  state?: SynthesizerState;
  createdBy?: string;
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  success: boolean;
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== 数据合成器服务类 ====================

class SynthesizerService {
  private baseURL = '/quiz/api/synthesizers';

  /**
   * 查询数据合成器列表
   */
  async getSynthesizers(params: SearchParams): Promise<PageResponse<SynthesizerDto>> {
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * 获取数据合成器详情
   */
  async getSynthesizerById(synthesizerId: string): Promise<ApiResponse<SynthesizerDto>> {
    const response = await axios.get(`${this.baseURL}/${synthesizerId}`);
    return response.data;
  }

  /**
   * 创建数据合成器
   */
  async createSynthesizer(data: SynthesizerCreateDto): Promise<ApiResponse<SynthesizerDto>> {
    const response = await axios.post(this.baseURL, data);
    return response.data;
  }

  /**
   * 更新数据合成器
   */
  async updateSynthesizer(synthesizerId: string, data: SynthesizerUpdateDto): Promise<ApiResponse<SynthesizerDto>> {
    const response = await axios.post(`${this.baseURL}/${synthesizerId}/update`, data);
    return response.data;
  }

  /**
   * 删除数据合成器
   */
  async deleteSynthesizer(synthesizerId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${synthesizerId}/delete`);
    return response.data;
  }

  /**
   * 获取可用的数据合成器列表
   */
  async getAvailableSynthesizers(): Promise<ApiResponse<SynthesizerDto[]>> {
    const response = await axios.get(`${this.baseURL}/available`);
    return response.data;
  }
}

// 导出单例
export const synthesizerService = new SynthesizerService();
export default synthesizerService;
