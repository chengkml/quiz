import axios from '@/core/src/http';

// 获取历史答卷列表
const getExamHistoryList = (params) => axios.get('/exam/results', { params });

// 获取历史答卷详情
const getExamHistoryDetail = (resultId) => axios.get(`/exam/results/${resultId}`);

// 删除历史答卷
const deleteExamHistory = (resultId) => axios.delete(`/exam/results/${resultId}`);

export {
  getExamHistoryList,
  getExamHistoryDetail,
  deleteExamHistory
};