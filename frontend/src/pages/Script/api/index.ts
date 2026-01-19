import axios from '@/core/src/http';

// 分页查询脚本信息（POST /api/script/info/search）
export const getScriptInfoList = (body: any) => {
  return axios.post('/api/script/info/search', body);
};

// 根据ID查询脚本信息（GET /api/script/info/get/{id}）
export const getScriptInfoById = (id: string) => axios.get(`/api/script/info/get/${id}`);

// 根据脚本编码查询脚本信息（GET /api/script/info/code/{code}）
export const getScriptInfoByCode = (code: string) => axios.get(`/api/script/info/code/${code}`);

// 创建脚本信息（POST /api/script/info/create）
export const createScriptInfo = (params) => axios.post('/api/script/info/create', params);

// 更新脚本信息（PUT /api/script/info/update）
export const updateScriptInfo = (params) => axios.put('/api/script/info/update', params);

// 删除脚本信息（DELETE /api/script/info/delete/{id}）
export const deleteScriptInfo = (id: string) => axios.delete(`/api/script/info/delete/${id}`);

// 启用/禁用脚本（通过更新 state 字段）
export const enableScript = (id: string) => axios.put('/api/script/info/update', { id, state: 'ENABLED' });
export const disableScript = (id: string) => axios.put('/api/script/info/update', { id, state: 'DISABLED' });

// 执行脚本（POST /api/script/info/{id}/exec?queueId=xxx）
export const execScript = (id: string, queueId: string) => axios.post(`/api/script/info/${id}/exec`, null, { params: { queueId } });

// 查询脚本执行任务列表（GET /api/script/info/jobs）
export const searchJobs = (params) => axios.get('/api/script/info/jobs', { params });

// 删除作业（POST /api/script/info/delete/job/{jobId}）
export const deleteJob = (jobId: string) => axios.post(`/api/script/info/delete/job/${jobId}`);

export default {
  getScriptInfoList,
  getScriptInfoById,
  getScriptInfoByCode,
  createScriptInfo,
  updateScriptInfo,
  deleteScriptInfo,
  enableScript,
  disableScript,
  execScript,
  searchJobs,
  deleteJob,
};