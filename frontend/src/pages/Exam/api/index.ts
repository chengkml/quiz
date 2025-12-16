import axios from '@/core/src/http';

// 获取试卷列表（分页查询）
const getExamList = params => axios.get('/exam', {params});

// 获取试卷详情
const getExamById = id => axios.get(`/exam/${id}`);

// 创建试卷
const createExam = params => axios.post('/exam/create', params);

// 更新试卷
const updateExam = params => axios.put('/exam/update', params);

// 删除试卷
const deleteExam = id => axios.delete(`/exam/${id}`);

// 发布试卷
const publishExam = id => axios.post(`/exam/${id}/publish`);

// 归档试卷
const archiveExam = id => axios.post(`/exam/${id}/archive`);

// 提交考试
const submitExam = (examId, params) => axios.post(`/exam/${examId}/submit`, params);

// 获取用户历史答卷列表（可按试卷筛选）
const getExamResultsByUser = (userId, examId?) => axios.get('/exam/results', { params: { userId, examId } });

// 获取答卷详情
const getExamResultDetail = (resultId) => axios.get(`/exam/results/${resultId}`);

// 添加题目到试卷
const addQuestionToExam = (examId, params) => 
  axios.post(`/exam/${examId}/questions`, null, {params});

// 批量添加题目到试卷
const addQuestionsToExam = (examId, questionIds) => 
  axios.post(`/exam/${examId}/questions/batch`, questionIds);

// 从试卷中移除题目
const removeQuestionFromExam = (examId, questionId) => 
  axios.delete(`/exam/${examId}/questions/${questionId}`);

// 更新试卷中的题目
const updateExamQuestion = (examId, questionId, params) => 
  axios.put(`/exam/${examId}/questions/${questionId}`, null, {params});

// 一键智能生成试卷
const autoGenerateExam = (params) => axios.post('/exam/auto-generate', params);

export {
  getExamList,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  archiveExam,
  submitExam,
  addQuestionToExam,
  addQuestionsToExam,
  removeQuestionFromExam,
  updateExamQuestion
  , getExamResultsByUser
  , getExamResultDetail
  , autoGenerateExam
};