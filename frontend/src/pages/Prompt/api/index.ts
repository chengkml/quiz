import { request } from '@/utils/request';

// 创建提示词模板
export const createPromptTemplate = (data: any) => {
  return request.post('/prompt/template/create', data);
};

// 更新提示词模板
export const updatePromptTemplate = (data: any) => {
  return request.post('/prompt/template/update', data);
};

// 删除提示词模板
export const deletePromptTemplate = (id: number) => {
  return request.post(`/prompt/template/delete/${id}`);
};

// 获取提示词模板详情
export const getPromptTemplateDetail = (id: number) => {
  return request.get(`/prompt/template/detail/${id}`);
};

// 获取提示词模板列表（分页）
export const getPromptTemplateList = (params: any) => {
  return request.get('/prompt/template/list', { params });
};

// 获取所有提示词模板
export const getAllPromptTemplates = () => {
  return request.get('/prompt/template/all');
};