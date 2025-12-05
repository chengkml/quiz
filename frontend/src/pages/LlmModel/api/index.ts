import axios from '@/core/src/http';

const base = '/quiz';

// 获取模型列表（分页查询）
export const getModelList = (params) => axios.get(`${base}/api/model`, { params });

// 获取模型详情
export const getModelById = (id: string) => axios.get(`${base}/api/model/${id}`);

// 创建模型
export const createModel = (params) => axios.post(`${base}/api/model/create`, params);

// 更新模型
export const updateModel = (params) => axios.put(`${base}/api/model/update`, params);

// 删除模型
export const deleteModel = (id: string) => axios.delete(`${base}/api/model/${id}`);

// 设置默认模型
export const setDefaultModel = (id: string) => axios.put(`${base}/api/model/${id}/set-default`);

export default {
  getModelList,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  setDefaultModel,
};