import axios from '@/core/src/http';

const base = '/quiz';

// 获取题目列表（分页查询）
const getQuestionList = params => axios.post(`${base}/api/question`, params);

// 获取题目详情
const getQuestionById = id => axios.get(`${base}/api/question/${id}`);

// 创建题目
const createQuestion = params => axios.post(`${base}/api/question/create`, params);

// 批量创建题目
const batchCreateQuestion = params => axios.post(`${base}/api/question/batch/create`, params);

// 更新题目
const updateQuestion = params => axios.put(`${base}/api/question/update`, params);

// 删除题目
const deleteQuestion = id => axios.delete(`${base}/api/question/${id}`);

// 根据知识点生成题目（一次性返回）
const generateQuestions = params => axios.post(`${base}/api/question/generate`, params);

// 根据知识点流式生成题目（SSE） - 前端通过 EventSource 连接该地址
const generateQuestionsStreamUrl = (params: any) => {
  const qs = [];
  if (params.knowledgeDescr !== undefined) qs.push(`knowledgeDescr=${encodeURIComponent(params.knowledgeDescr)}`);
  if (params.num !== undefined) qs.push(`num=${encodeURIComponent(params.num)}`);
  if (params.modelName !== undefined) qs.push(`modelName=${encodeURIComponent(params.modelName)}`);
  return `${base}/api/question/generate/stream?${qs.join('&')}`;
}

// 为问题关联知识点
const associateKnowledge = params => axios.post(`${base}/api/question/${params.questionId}/associate-knowledge`, params.knowledgeIds);

// 取消问题与知识点的关联
const disassociateKnowledge = params => axios.post(`${base}/api/question/disassociate-knowledge`, params);

// 获取问题关联的知识点列表
const getQuestionKnowledge = questionId => axios.get(`${base}/api/question/${questionId}/knowledge`);

// 获取所有学科列表
const getAllSubjects = () => axios.get(`${base}/api/subject/list/user/all`);

// 根据学科ID获取分类列表
const getCategoriesBySubjectId = (subjectId) => axios.get(`${base}/api/categories/subject/${subjectId}`);

// 获取学科分类树
const getSubjectCategoryTree = () => axios.get(`${base}/api/categories/subject/category/tree`);

// 根据模型类型获取模型列表（例如 TEXT）
const getModelsByType = (type) => axios.get(`${base}/api/model/list/${type}`);

export {
  getQuestionList,
  getQuestionById,
  createQuestion,
  batchCreateQuestion,
  updateQuestion,
  deleteQuestion,
  generateQuestions,
  generateQuestionsStreamUrl,
  associateKnowledge,
  disassociateKnowledge,
  getQuestionKnowledge,
  getAllSubjects,
  getCategoriesBySubjectId,
  getSubjectCategoryTree,
  getModelsByType
};