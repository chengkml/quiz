import axios from '@/core/src/http';

const base = '/quiz';
import { PageResponse } from '@/types';

// 定时任务列表请求参数
export interface CronTaskListParams {
  limit?: number;
  offset?: number;
  queueName?: string;
  state?: string;
  keyWord?: string;
}

// 定时任务DTO
export interface CronTaskDto {
  id?: string;
  name?: string;
  label?: string;
  taskClass?: string;
  queueName?: string;
  cronExpression?: string;
  fireParams?: string;
  state?: string;
  nextFireTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 获取定时任务列表
export const getCronTaskList = async (params: CronTaskListParams): Promise<PageResponse<CronTaskDto>> => {
  const response = await axios.get(`${base}/api/cron/task/getCronTaskList`, { params });
  return response;
};

// 删除定时任务
export const deleteCronTask = async (ids: string[]): Promise<boolean> => {
  const response = await axios.post(`${base}/api/cron/task/delete`, ids);
  return response;
};

// 保存定时任务
export const saveCronTask = async (cronTaskDto: CronTaskDto): Promise<CronTaskDto> => {
  const response = await axios.post(`${base}/api/cron/task/save`, cronTaskDto);
  return response;
};

// 触发定时任务
export const triggerCronTask = async (id: string): Promise<boolean> => {
  const response = await axios.post(`${base}/api/cron/task/trigger/${id}`);
  return response;
};

// 获取任务类型选项
export const getTaskOptions = async (): Promise<any[]> => {
  const response = await axios.get(`${base}/api/cron/task/options`);
  return response;
};

export default {
  getCronTaskList,
  deleteCronTask,
  saveCronTask,
  triggerCronTask,
  getTaskOptions,
};