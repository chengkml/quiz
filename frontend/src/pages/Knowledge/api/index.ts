import axios from '@/core/src/http';

export interface KnowledgeDto {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  subjectId: string;
  subjectName?: string;
  content: string;
  easinessFactor?: number;
  interval?: number;
  repetition?: number;
  nextReviewDate?: string;
  archived?: boolean;
  totalReviewCount?: number;
  lastScore?: number | null;
  createDate?: string;
  updateDate?: string;
  createUser?: string;
  updateUser?: string;
}

export interface ReviewRequestDto {
  id: string;
  score: number;
}

export interface ReviewResultDto {
  id: string;
  score: number;
  newEasinessFactor: number;
  newInterval: number;
  newRepetition: number;
  nextReviewDate: string;
  message: string;
}

// 获取知识点列表（分页查询）
const getKnowledgeList = params => axios.post('/knowledge/search', params);

// 获取知识点详情
const getKnowledgeById = id => axios.get(`/knowledge/${id}`);

// 根据名称获取知识点
const getKnowledgeByName = name => axios.get(`/knowledge/name/${name}`);

// 创建知识点
const createKnowledge = params => axios.post('/knowledge', params);

// 批量创建题目（知识点页面中创建题目使用）
const batchCreateQuestion = params => axios.post('/question/batch/create', params);

// 更新知识点
const updateKnowledge = params => axios.put('/knowledge', params);

// 删除知识点
const deleteKnowledge = id => axios.delete(`/knowledge/${id}`);

// 归档/取消归档知识点
const archiveKnowledge = (id: string, archived: boolean = true) =>
  axios.post(`/knowledge/archive/${id}`, null, { params: { archived } });

// 重置知识点学习状态
const resetKnowledge = (id: string) => axios.post(`/knowledge/reset/${id}`);

// 获取今日待复习知识点
const getDueToday = () => axios.get('/knowledge/due-today');

// 提交复习评分
const reviewKnowledge = (data: ReviewRequestDto) => axios.post('/knowledge/review', data);

// 获取知识点复习历史
const getReviewHistory = (cardId: string) => axios.get(`/knowledge/review-history/${cardId}`);

// 检查知识点名称是否存在
const checkKnowledgeNameExists = params => axios.get('/knowledge/check-name', {params});

// 获取所有分类列表
const getAllCategories = () => axios.get('/categories/all');

// 获取所有学科列表
const getAllSubjects = () => axios.get('/subject/list');

// 获取学科分类树
const getSubjectCategoryTree = () => axios.get('/category/subject-category-tree');

// 根据学科ID获取分类列表
const getCategoriesBySubjectId = (subjectId) => axios.post('/category/search', { subjectId, pageSize: 1000 });

// 获取知识点关联的问题列表
const getKnowledgeQuestions = knowledgeId => axios.get(`/knowledge/${knowledgeId}/questions`);

// 创建学科
const createSubject = params => axios.post('/subject/create', params);

// 更新学科
const updateSubject = params => axios.put('/subject/update', params);

// 删除学科
const deleteSubject = id => axios.delete(`/subject/delete/${id}`);

// 检查学科名称是否存在
const checkSubjectName = (name, excludeId) => {
  const params = { subjectName: name };
  if (excludeId) {
    params.excludeSubjectId = excludeId;
  }
  return axios.get('/subject/check/name', { params });
};

// 创建分类
const createCategory = params => axios.post('/category/create', params);

// 更新分类
const updateCategory = params => axios.put('/category/update', params);

// 删除分类
const deleteCategory = id => axios.delete(`/category/delete/${id}`);

// 流式润色知识点URL
const streamPolishKnowledgeUrl = (content, modelName?: string) => {
  const qs = [`content=${encodeURIComponent(content)}`];
  if (modelName) qs.push(`modelName=${encodeURIComponent(modelName)}`);
  return `/api/knowledge/polish/stream?${qs.join('&')}`;
};

// 根据知识点流式生成题目（SSE） - 前端通过 EventSource 连接该地址
const generateQuestionsStreamUrl = (params: any) => {
  const qs = [];
  if (params.knowledgeId !== undefined) qs.push(`knowledgeId=${encodeURIComponent(params.knowledgeId)}`);
  if (params.num !== undefined) qs.push(`num=${encodeURIComponent(params.num)}`);
  if (params.modelName !== undefined) qs.push(`modelName=${encodeURIComponent(params.modelName)}`);
  return `/api/knowledge/generate-questions/stream?${qs.join('&')}`;
};

// 根据模型类型获取模型列表（例如 TEXT）
const getModelsByType = (type) => axios.get(`/llm-model/list-by-type/${type}`);

export {
  getKnowledgeList,
  getKnowledgeById,
  getKnowledgeByName,
  createKnowledge,
  batchCreateQuestion,
  updateKnowledge,
  deleteKnowledge,
  checkKnowledgeNameExists,
  getAllCategories,
  getAllSubjects,
  getCategoriesBySubjectId,
  getKnowledgeQuestions,
  getSubjectCategoryTree,
  streamPolishKnowledgeUrl,
  generateQuestionsStreamUrl,
  getModelsByType,
  archiveKnowledge,
  resetKnowledge,
  getDueToday,
  reviewKnowledge,
  getReviewHistory,
  createSubject,
  updateSubject,
  deleteSubject,
  checkSubjectName,
  createCategory,
  updateCategory,
  deleteCategory
};