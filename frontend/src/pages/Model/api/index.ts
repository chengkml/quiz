import axios from '@/core/src/http';

const base = '/quiz';

// 获取模型列表（分页查询）
const getModelList = params => axios.get(`${base}/api/model`, {params});

// 获取模型详情
const getModelById = id => axios.get(`${base}/api/model/${id}`);

// 创建模型
const createModel = params => axios.post(`${base}/api/model/create`, params);

// 更新模型
const updateModel = params => axios.put(`${base}/api/model/update`, params);

// 删除模型
const deleteModel = id => axios.delete(`${base}/api/model/${id}`);

// 获取默认模型
const getDefaultModel = () => axios.get(`${base}/api/model/default`);

// 获取激活状态的模型列表
const getActiveModels = () => axios.get(`${base}/api/model/active/list`);

// 设置默认模型
const setDefaultModel = id => axios.put(`${base}/api/model/${id}/set-default`);

export {
  getModelList,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  getDefaultModel,
  getActiveModels,
  setDefaultModel
};