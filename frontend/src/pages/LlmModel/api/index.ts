import axios from '@/core/src/http';

// 获取模型列表（分页查询）
export const getModelList = (params) => axios.post('/llm-model/search', params);

// 获取模型详情
export const getModelById = (id: string) => axios.get(`/llm-model/get/${id}`);

// 创建模型
export const createModel = (params) => axios.post('/llm-model/create', params);

// 更新模型
export const updateModel = (params) => axios.put('/llm-model/update', params);

// 删除模型
export const deleteModel = (id: string) => axios.delete(`/llm-model/delete/${id}`);

// 设置默认模型
export const setDefaultModel = (id: string) => axios.put(`/llm-model/${id}/set-default`);

// 多模态测试
export const testMultimodalModel = (id: string, prompt: string, image: File) => {
  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('image', image);
  return axios.post(`/llm-model/${id}/test-multimodal`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default {
  getModelList,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  setDefaultModel,
  testMultimodalModel,
};