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

// 需求分析
export const analyzeRequirement = (id: string, params: {
  descr?: string;
  comment?: string;
  progressPercent?: number;
}) => axios.post(`/project/requirement/${id}/analyze`, params);

// 需求评审
export const reviewRequirement = (id: string, params: {
  descr?: string;
  comment?: string;
  decision: "TO_OPEN" | "TO_REVISION";
}) => axios.post(`/project/requirement/${id}/review`, params);

// 生命周期日志
export const getRequirementLifecycle = (id: string) => axios.get(`/project/requirement/${id}/lifecycle`);

export default {
  getRequirementList,
  getRequirementHistoryOptions,
  getRequirementById,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  analyzeRequirement,
  reviewRequirement,
  getRequirementLifecycle,
};
