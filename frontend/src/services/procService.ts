import axios from 'axios';
import {
  ProcCreateDto,
  ProcUpdateDto,
  ProcDto,
  ProcQueryParams,
  PageResponse,
  ApiResponse,
  CheckUniqueResponse,
} from '../types/proc';

// 处理任务服务
export class ProcService {
  // 获取处理任务列表
  static async getProcs(params: ProcQueryParams): Promise<PageResponse<ProcDto>> {
    const response = await axios.get('/api/procs', { params });
    return response.data;
  }

  // 获取处理任务详情
  static async getProc(id: string): Promise<ApiResponse<ProcDto>> {
    const response = await axios.get(`/api/procs/${id}`);
    return response.data;
  }

  // 创建处理任务
  static async createProc(data: ProcCreateDto): Promise<ApiResponse<ProcDto>> {
    const response = await axios.post('/api/procs', data);
    return response.data;
  }

  // 更新处理任务
  static async updateProc(id: string, data: ProcUpdateDto): Promise<ApiResponse<ProcDto>> {
    const response = await axios.put(`/api/procs/${id}`, data);
    return response.data;
  }

  // 删除处理任务
  static async deleteProc(id: string): Promise<ApiResponse> {
    const response = await axios.delete(`/api/procs/${id}`);
    return response.data;
  }

  // 启用处理任务
  static async enableProc(id: string): Promise<ApiResponse> {
    const response = await axios.put(`/api/procs/${id}/enable`);
    return response.data;
  }

  // 禁用处理任务
  static async disableProc(id: string): Promise<ApiResponse> {
    const response = await axios.put(`/api/procs/${id}/disable`);
    return response.data;
  }

  // 检查处理任务编码是否存在
  static async checkProcCode(procCode: string): Promise<CheckUniqueResponse> {
    const response = await axios.get('/api/procs/check-code', { params: { procCode } });
    return response.data;
  }
}