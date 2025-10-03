import axios from '@/core/src/http';

const base = 'quiz';

// 获取知识点列表（分页查询）
const getKnowledgeList = params => axios.post(`${base}/api/knowledge/search`, params);

// 获取知识点详情
const getKnowledgeById = id => axios.get(`${base}/api/knowledge/${id}`);

// 根据名称获取知识点
const getKnowledgeByName = name => axios.get(`${base}/api/knowledge/name/${name}`);

// 创建知识点
const createKnowledge = params => axios.post(`${base}/api/knowledge`, params);

// 更新知识点
const updateKnowledge = params => axios.put(`${base}/api/knowledge`, params);

// 删除知识点
const deleteKnowledge = id => axios.delete(`${base}/api/knowledge/${id}`);

// 检查知识点名称是否存在
const checkKnowledgeNameExists = params => axios.get(`${base}/api/knowledge/check-name`, {params});

// 获取所有分类列表
const getAllCategories = () => axios.get(`${base}/api/categories/all`);

// 获取所有学科列表
const getAllSubjects = () => axios.get(`${base}/api/subject/list/all`);

// 根据学科ID获取分类列表
const getCategoriesBySubjectId = (subjectId) => axios.get(`${base}/api/categories/subject/${subjectId}`);

// 获取知识点关联的问题列表
const getKnowledgeQuestions = knowledgeId => axios.get(`${base}/api/knowledge/${knowledgeId}/questions`);

export {
  getKnowledgeList,
  getKnowledgeById,
  getKnowledgeByName,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  checkKnowledgeNameExists,
  getAllCategories,
  getAllSubjects,
  getCategoriesBySubjectId,
  getKnowledgeQuestions
};