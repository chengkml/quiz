import axios from '@/core/src/http';

// 分页查询需求
export const getRequirementList = (params: any) => axios.post('/project/requirement/search', params);

// 获取新增需求历史输入选项
export const getRequirementHistoryOptions = () => axios.get('/project/requirement/history-options');

// 获取需求详情
export const getRequirementById = (id: string) => axios.get(`/project/requirement/get/${id}`);

// 创建需求
export const createRequirement = (params: any) => axios.post('/project/requirement/create', params);

// 更新需求
export const updateRequirement = (params: any) => axios.put('/project/requirement/update', params);

// 删除需求
export const deleteRequirement = (id: string) => axios.delete(`/project/requirement/delete/${id}`);

export default {
  getRequirementList,
  getRequirementHistoryOptions,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
};
