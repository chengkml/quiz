import axios from '@/core/src/http';

const base = '/quiz';

// 获取队列列表
const getQueueList = () => axios.get(`${base}/api/job/queue/list`);

// 搜索队列数据（带分页）
const searchQueues = params => axios.get(`${base}/api/job/queue/search`, { params });

// 删除队列
const deleteQueue = id => axios.post(`${base}/api/job/queue/delete/${id}`);

// 队列名唯一性检查
const checkQueueNameUniq = (id, name) => 
  axios.get(`${base}/api/job/queue/check/uniq`, { params: { id, name } });

// 创建队列
const createQueue = params => axios.post(`${base}/api/job/queue/create`, params);

// 禁用队列
const disableQueue = id => axios.post(`${base}/api/job/queue/disable/${id}`);

// 启用队列
const enableQueue = id => axios.post(`${base}/api/job/queue/enable/${id}`);

// 更新队列大小
const updateQueueSize = (id, size) => 
  axios.post(`${base}/api/job/queue/update/${id}/size`, { size });

export {
  getQueueList,
  searchQueues,
  deleteQueue,
  checkQueueNameUniq,
  createQueue,
  disableQueue,
  enableQueue,
  updateQueueSize
};