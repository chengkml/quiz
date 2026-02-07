import axios from '@/core/src/http';
import { PageResponse } from '@/types';

// 爬虫配置列表请求参数
export interface CrawlerConfigListParams {
  limit?: number;
  offset?: number;
  state?: string;
  keyword?: string;
}

// 爬虫配置DTO
export interface CrawlerConfigDto {
  id?: string;
  name?: string;
  label?: string;
  startUrl?: string;
  urlPatterns?: string;
  domain?: string;
  threadCount?: number;
  retryTimes?: number;
  sleepTime?: number;
  timeoutMillis?: number;
  charset?: string;
  userAgent?: string;
  headers?: string;
  cookies?: string;
  extractRules?: string;
  pipelineType?: string;
  pipelineConfig?: string;
  state?: string;
  createTime?: string;
  updateTime?: string;
  createBy?: string;
  updateBy?: string;
  remark?: string;
}

// 爬虫结果DTO
export interface CrawlerResultDto {
  id?: string;
  crawlerConfigId?: string;
  jobId?: string;
  url?: string;
  title?: string;
  extractedData?: string;
  rawHtml?: string;
  crawlTime?: string;
}

// 获取爬虫配置列表
export const getCrawlerConfigList = async (params: CrawlerConfigListParams): Promise<PageResponse<CrawlerConfigDto>> => {
  const response = await axios.get('/crawler/config/list', { params });
  return response;
};

// 根据ID获取爬虫配置
export const getCrawlerConfigById = async (id: string): Promise<CrawlerConfigDto> => {
  const response = await axios.get(`/crawler/config/${id}`);
  return response.data;
};

// 保存爬虫配置
export const saveCrawlerConfig = async (dto: CrawlerConfigDto): Promise<CrawlerConfigDto> => {
  const response = await axios.post('/crawler/config/save', dto);
  return response.data;
};

// 删除爬虫配置
export const deleteCrawlerConfig = async (ids: string[]): Promise<boolean> => {
  const response = await axios.post('/crawler/config/delete', ids);
  return response.success;
};

// 触发爬虫任务
export const triggerCrawler = async (crawlerConfigId: string, maxPageCount?: number): Promise<string> => {
  const params = maxPageCount ? { maxPageCount } : {};
  const response = await axios.post(`/crawler/trigger/${crawlerConfigId}`, null, { params });
  return response.data;
};

// 获取爬虫结果
export const getCrawlerResults = async (crawlerConfigId: string, params: { offset: number; limit: number }): Promise<PageResponse<CrawlerResultDto>> => {
  const response = await axios.get(`/crawler/results/${crawlerConfigId}`, { params });
  return response;
};
