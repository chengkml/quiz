import axios from '@/core/src/http';

// 获取模型列表（分页查询）
export const getModelList = (params) => axios.get('/model', { params });

// 获取模型详情
export const getModelById = (id: string) => axios.get(`/model/${id}`);

// 创建模型
export const createModel = (params) => axios.post('/model/create', params);

// 更新模型
export const updateModel = (params) => axios.put('/model/update', params);

// 删除模型
export const deleteModel = (id: string) => axios.delete(`/model/${id}`);

// 设置默认模型
export const setDefaultModel = (id: string) => axios.put(`/model/${id}/set-default`);

export default {
  getModelList,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  setDefaultModel,
};