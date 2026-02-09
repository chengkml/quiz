import axios from '@/core/src/http';

// 获取知识点列表（分页查询）
const getKnowledgeList = params => axios.post('/knowledge/search', params);

// 获取知识点详情
const getKnowledgeById = id => axios.get(`/knowledge/${id}`);

// 根据名称获取知识点
const getKnowledgeByName = name => axios.get(`/knowledge/name/${name}`);

// 创建知识点
const createKnowledge = params => axios.post('/knowledge', params);

// 更新知识点
const updateKnowledge = params => axios.put('/knowledge', params);

// 删除知识点
const deleteKnowledge = id => axios.delete(`/knowledge/${id}`);

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

// 流式润色知识点URL
const streamPolishKnowledgeUrl = (content, modelName?: string) => {
  const qs = [`content=${encodeURIComponent(content)}`];
  if (modelName) qs.push(`modelName=${encodeURIComponent(modelName)}`);
  return `/api/knowledge/polish/stream?${qs.join('&')}`;
};

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
  getKnowledgeQuestions,
  getSubjectCategoryTree,
  streamPolishKnowledgeUrl
};