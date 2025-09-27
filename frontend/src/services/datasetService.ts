import axios from 'axios';
import {
  DatasetDto,
  DatasetCreateDto,
  DatasetUpdateDto,
  DatasetQueryParams,
  PageResponse,
  ApiResponse,
  CheckUniqueResponse,
} from '../types/dataset';

export class DatasetService {
  private static baseURL = '/data_synth/api/datasets';

  // 查询数据集列表
  static async getDatasets(params: DatasetQueryParams): Promise<PageResponse<DatasetDto>> {
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  // 检查数据集ID是否存在
  static async checkDatasetId(datasetId: string): Promise<CheckUniqueResponse> {
    const response = await axios.get(`${this.baseURL}/check/datasetId`, { params: { datasetId } });
    return response.data;
  }

  // 检查表名是否存在
  static async checkTableName(tableName: string): Promise<CheckUniqueResponse> {
    const response = await axios.get(`${this.baseURL}/check/tableName`, { params: { tableName } });
    return response.data;
  }

  // 新增数据集
  static async createDataset(datasetData: DatasetCreateDto): Promise<ApiResponse<DatasetDto>> {
    const response = await axios.post(this.baseURL, datasetData);
    return response.data;
  }

  // 编辑数据集
  static async updateDataset(id: string, datasetData: DatasetUpdateDto): Promise<ApiResponse<DatasetDto>> {
    const response = await axios.put(`${this.baseURL}/${id}`, datasetData);
    return response.data;
  }

  // 启用数据集
  static async enableDataset(id: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${id}/enable`);
    return response.data;
  }

  // 禁用数据集
  static async disableDataset(id: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${id}/disable`);
    return response.data;
  }

  // 获取数据集详情
  static async getDatasetById(id: string): Promise<ApiResponse<DatasetDto>> {
    const response = await axios.get(`${this.baseURL}/${id}`);
    return response.data;
  }

  // 删除单个数据集
  static async deleteDataset(id: string): Promise<ApiResponse<void>> {
    const response = await axios.delete(`${this.baseURL}/${id}`);
    return response.data;
  }

  // 批量删除数据集
  static async deleteDatasets(ids: string[]): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/batch-delete`, { ids });
    return response.data;
  }

  // 获取数据集统计信息
  static async getDatasetStats(): Promise<ApiResponse<any>> {
    const response = await axios.get(`${this.baseURL}/stats`);
    return response.data;
  }
}

export default DatasetService;
