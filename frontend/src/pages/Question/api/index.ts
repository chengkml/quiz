import axios from '@/core/src/http';

const base = 'quiz';

// 获取题目列表（分页查询）
const getQuestionList = params => axios.get(`${base}/api/question`, {params});

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

// 根据知识点生成题目
const generateQuestions = params => axios.post(`${base}/api/question/generate`, null, {params});

export {
  getQuestionList,
  getQuestionById,
  createQuestion,
  batchCreateQuestion,
  updateQuestion,
  deleteQuestion,
  generateQuestions
};