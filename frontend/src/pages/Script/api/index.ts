import axios from '@/core/src/http';

const base = '/quiz';

// 分页查询脚本信息
export const getScriptInfoList = (params) => {
  // 确保分页参数格式正确
  const queryParams = {
    page: params.page || 1,
    pageSize: params.pageSize || 10,
    ...params
  };
  return axios.get(`${base}/api/script/info`, { params: queryParams });
};

// 根据ID查询脚本信息
export const getScriptInfoById = (id: string) => axios.get(`${base}/api/script/info/${id}`);

// 根据脚本编码查询脚本信息
export const getScriptInfoByCode = (code: string) => axios.get(`${base}/api/script/info/code/${code}`);

// 创建脚本信息
export const createScriptInfo = (params) => axios.post(`${base}/api/script/info`, params);

// 更新脚本信息
export const updateScriptInfo = (params) => axios.put(`${base}/api/script/info`, params);

// 删除脚本信息
export const deleteScriptInfo = (id: string) => axios.delete(`${base}/api/script/info/${id}`);

// 批量删除脚本
export const batchDeleteScriptInfo = (ids) => axios.delete(`${base}/api/script/info/batch`, { data: ids });

// 启用脚本
export const enableScriptInfo = (id) => axios.put(`${base}/api/script/info/enable`, { id });

// 禁用脚本
export const disableScriptInfo = (id) => axios.put(`${base}/api/script/info/disable`, { id });

// 启用脚本
export const enableScript = (id: string) => axios.put(`${base}/api/script/info/${id}/enable`);

// 禁用脚本
export const disableScript = (id: string) => axios.put(`${base}/api/script/info/${id}/disable`);

// 执行脚本
export const execScript = (id: string, queueId: string) => axios.post(`${base}/api/script/info/${id}/exec`, null, { params: { queueId } });

// 查询脚本执行任务列表
export const searchJobs = (params) => axios.get(`${base}/api/script/info/jobs`, { params: params });

export default {
  getScriptInfoList,
  getScriptInfoById,
  getScriptInfoByCode,
  createScriptInfo,
  updateScriptInfo,
  deleteScriptInfo,
  batchDeleteScriptInfo,
  enableScript,
  disableScript,
  execScript,
  searchJobs,
};