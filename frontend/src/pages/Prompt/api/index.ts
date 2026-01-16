import axios from '@/core/src/http';

// 创建提示词模板
export const createPromptTemplate = (data: any) => {
  return axios.post('/prompt-templates/create', data);
};

// 更新提示词模板
export const updatePromptTemplate = (data: any) => {
  return axios.put('/prompt-templates/update', data);
};

// 删除提示词模板
export const deletePromptTemplate = (id: string) => {
  return axios.delete(`/prompt-templates/delete/${id}`);
};

// 获取提示词模板详情
export const getPromptTemplateDetail = (id: string) => {
  return axios.get(`/prompt-templates/get/${id}`);
};

// 获取提示词模板列表（分页）
export const getPromptTemplateList = (params: any) => {
  return axios.post('/prompt-templates/search', params);
};

// 获取所有提示词模板
export const getAllPromptTemplates = () => {
  return axios.get('/prompt-templates/list');
};

// 检查模板名称是否唯一
export const checkTemplateName = (name: string, excludeId?: string) => {
  const params: any = { name };
  if (excludeId) {
    params.excludeId = excludeId;
  }
  return axios.get('/prompt-templates/check/name', { params });
};