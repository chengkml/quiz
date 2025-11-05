import axios from '@/core/src/http';

const base = '/quiz';

// 定义接口返回类型
export interface DashboardStats {
  totalQuestions: number;
  totalCategories: number;
  totalSubjects: number;
  totalKnowledgePoints: number;
  questionStats: Array<{
    name: string;
    count: number;
  }>;
}

export interface Statistics {
  todoCount: number;
  questionCount: number;
  yesterdayQuestionCount: number;
  subjectCount: number;
}

// 日期统计数据接口 - 日期为键，数量为值
export interface DateCountData {
  [date: string]: number;
}

// 学科统计数据接口 - 学科为键，数量为值
export interface SubjectCountData {
  [subject: string]: number;
}

// 获取仪表盘统计数据
export const getDashboardStats = () => axios.get(`${base}/api/statistics/dashboard`);

// 获取统计数据
export const getStatistics = () => axios.get(`${base}/api/statistics`);

// 获取近七天题目增加量
export const getQuestionCountByLastSevenDays = () => axios.get(`${base}/api/question/statistics/last-seven-days`);

// 获取各学科题目量
export const getQuestionCountBySubject = () => axios.get(`${base}/api/question/statistics/by-subject`);

// 获取近一个月题目增加量
export const getQuestionCountByLastMonth = () => axios.get(`${base}/api/question/statistics/last-month`);