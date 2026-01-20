import axios from '@/core/src/http';

// 分页查询脚本信息（POST /script/info/search）
export const getScriptInfoList = (body: any) => {
  return axios.post('/script/info/search', body);
};

// 根据ID查询脚本信息（GET /script/info/get/{id}）
export const getScriptInfoById = (id: string) => axios.get(`/script/info/get/${id}`);

// 根据脚本编码查询脚本信息（GET /script/info/code/{code}）
export const getScriptInfoByCode = (code: string) => axios.get(`/script/info/code/${code}`);

// 创建脚本信息（POST /script/info/create）
export const createScriptInfo = (params: any) => axios.post('/script/info/create', params);

// 更新脚本信息（PUT /script/info/update）
export const updateScriptInfo = (params: any) => axios.put('/script/info/update', params);

// 删除脚本信息（DELETE /script/info/delete/{id}）
export const deleteScriptInfo = (id: string) => axios.delete(`/script/info/delete/${id}`);

// 执行脚本（POST /script/info/{id}/exec?queueId=xxx）
export const execScript = (id: string, queueId: string) => axios.post(`/script/info/${id}/exec`, null, { params: { queueId } });

// 查询脚本执行任务列表（GET /script/info/jobs）
export const searchJobs = (params: any) => axios.get('/script/info/jobs', { params });

// 删除作业（POST /script/info/delete/job/{jobId}）
export const deleteJob = (jobId: string) => axios.post(`/script/info/delete/job/${jobId}`);

export default {
  getScriptInfoList,
  getScriptInfoById,
  getScriptInfoByCode,
  createScriptInfo,
  updateScriptInfo,
  deleteScriptInfo,
  execScript,
  searchJobs,
  deleteJob,
};