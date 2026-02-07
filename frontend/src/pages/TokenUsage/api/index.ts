import axios from '@/core/src/http';

export interface TokenUsageStatDto {
  dimension: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalCost: number;
  requestCount: number;
}

export interface TokenUsageRecordDto {
  id: string;
  modelName: string;
  modelProvider: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  businessType: string;
  businessId: string;
  sessionId: string;
  requestContent?: string;
  responseContent?: string;
  errorFlag: boolean;
  errorMessage?: string;
  createDate: string;
  createUser: string;
}

export interface TokenUsageQueryDto {
  startDate?: string;
  endDate?: string;
  userId?: string;
  modelName?: string;
  businessType?: string;
  statType?: 'model' | 'business' | 'user' | 'date';
}

// 查询token使用统计
export const queryStatistics = (params: TokenUsageQueryDto) =>
  axios.post<TokenUsageStatDto[]>('/token-usage/statistics', params);

// 查询token使用记录列表
export const queryRecords = (params: TokenUsageQueryDto) =>
  axios.post<TokenUsageRecordDto[]>('/token-usage/records', params);

// 根据会话ID查询token使用记录
export const queryBySessionId = (sessionId: string) =>
  axios.get<TokenUsageRecordDto[]>(`/token-usage/session/${sessionId}`);

// 获取自己的token使用统计（按模型）
export const getMyStatisticsByModel = () =>
  axios.get<TokenUsageStatDto[]>('/token-usage/my-statistics/by-model');

// 获取自己的token使用统计（按业务类型）
export const getMyStatisticsByBusiness = () =>
  axios.get<TokenUsageStatDto[]>('/token-usage/my-statistics/by-business');

// 获取自己的token使用统计（按日期）
export const getMyStatisticsByDate = (params: {
  startDate?: string;
  endDate?: string;
  modelName?: string;
}) => axios.get<TokenUsageStatDto[]>('/token-usage/my-statistics/by-date', { params });

export default {
  queryStatistics,
  queryRecords,
  queryBySessionId,
  getMyStatisticsByModel,
  getMyStatisticsByBusiness,
  getMyStatisticsByDate,
};
