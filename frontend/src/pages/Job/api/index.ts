import axios from '@/core/src/http';

// 搜索作业
export const searchJobs = (params) => axios.get('/cron/job/search', { params });

// 获取作业统计信息
export const getStatistics = () => axios.get('/cron/job/statistics');

// 搜索排队作业
export const searchQueueJobs = (params) => axios.get('/cron/job/queue/search', { params });

// 停止作业
export const stopJob = (jobId: string) => axios.post(`/cron/job/stop/${jobId}`);

// 重试作业
export const retryJob = (jobId: string) => axios.post(`/cron/job/retry/${jobId}`);

// 新增作业
export const addJob = (params) => axios.post('/cron/job/add/job', params);

// 删除作业
export const deleteJob = (jobId: string) => axios.post(`/cron/job/delete/job/${jobId}`);

// 获取作业类型选项
export const getJobOptions = () => axios.get('/cron/job/options');

// 获取队列列表
export const getQueueList = () => axios.get('/job/queue/list');

// 获取作业日志
export const getLogs = (jobId: string, params) => axios.get(`/cron/job/logs/${jobId}`, { params });

// 导出作业日志
export const exportLogs = (jobId: string) => axios.post(`/cron/job/download/logs/${jobId}`, {}, { responseType: 'blob' });

// 实时获取作业日志（SSE）
export const streamLogs = (jobId: string) => {
  const url = `/cron/job/logs/stream/${jobId}`;
  return new EventSource(url);
};

export default {
  searchJobs,
  getStatistics,
  searchQueueJobs,
  stopJob,
  retryJob,
  addJob,
  deleteJob,
  getJobOptions,
  getLogs,
  exportLogs,
};