import axios from '@/core/src/http';


const base = '/quiz';

// 创建提示词模板
export const createPromptTemplate = (data: any) => {
  return axios.post(`${base}/api/prompt-templates`, data);
};

// 更新提示词模板
export const updatePromptTemplate = (data: any) => {
  return axios.put(`${base}/api/prompt-templates`, data);
};

// 删除提示词模板
export const deletePromptTemplate = (id: number) => {
  return axios.delete(`${base}/api/prompt-templates/${id}`);
};

// 获取提示词模板详情
export const getPromptTemplateDetail = (id: number) => {
  return axios.get(`${base}/api/prompt-templates/${id}`);
};

// 获取提示词模板列表（分页）
export const getPromptTemplateList = (params: any) => {
  return axios.get(`${base}/api/prompt-templates/search`, { params });
};

// 获取所有提示词模板
export const getAllPromptTemplates = () => {
  return axios.get(`${base}/api/prompt-templates`);
};