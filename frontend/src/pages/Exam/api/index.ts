import axios from '@/core/src/http';

const base = '/quiz';

// 获取试卷列表（分页查询）
const getExamList = params => axios.get(`${base}/api/exam`, {params});

// 获取试卷详情
const getExamById = id => axios.get(`${base}/api/exam/${id}`);

// 创建试卷
const createExam = params => axios.post(`${base}/api/exam/create`, params);

// 更新试卷
const updateExam = params => axios.put(`${base}/api/exam/update`, params);

// 删除试卷
const deleteExam = id => axios.delete(`${base}/api/exam/${id}`);

// 发布试卷
const publishExam = id => axios.post(`${base}/api/exam/${id}/publish`);

// 归档试卷
const archiveExam = id => axios.post(`${base}/api/exam/${id}/archive`);

// 提交考试
const submitExam = (examId, params) => axios.post(`${base}/api/exam/${examId}/submit`, params);

// 添加题目到试卷
const addQuestionToExam = (examId, params) => 
  axios.post(`${base}/api/exam/${examId}/questions`, null, {params});

// 批量添加题目到试卷
const addQuestionsToExam = (examId, questionIds) => 
  axios.post(`${base}/api/exam/${examId}/questions/batch`, questionIds);

// 从试卷中移除题目
const removeQuestionFromExam = (examId, questionId) => 
  axios.delete(`${base}/api/exam/${examId}/questions/${questionId}`);

// 更新试卷中的题目
const updateExamQuestion = (examId, questionId, params) => 
  axios.put(`${base}/api/exam/${examId}/questions/${questionId}`, null, {params});

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
};