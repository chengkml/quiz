import axios from '@/core/src/http';

const base = '/quiz';

// 获取历史答卷列表
const getExamHistoryList = (params) => axios.get(`${base}/api/exam/results`, { params });

// 获取历史答卷详情
const getExamHistoryDetail = (resultId) => axios.get(`${base}/api/exam/result/${resultId}`);

// 删除历史答卷
const deleteExamHistory = (resultId) => axios.delete(`${base}/api/exam/results/${resultId}`);

export {
  getExamHistoryList,
  getExamHistoryDetail,
  deleteExamHistory
};