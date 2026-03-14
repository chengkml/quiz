import axios from '@/core/src/http';

export interface StatisticsThemeDto {
  themeKey: string;
  title: string;
  description: string;
  routePath: string;
}

export interface StatisticsOverview {
  todoCount: number;
  questionCount: number;
  yesterdayQuestionCount: number;
  subjectCount: number;
}

export interface DateCountData {
  [date: string]: number;
}

export interface SubjectCountData {
  [subject: string]: number;
}

export interface QuestionBankDashboardData {
  overview: StatisticsOverview;
  questionCountByLastSevenDays: DateCountData;
  questionCountBySubject: SubjectCountData;
  questionCountByLastMonth: DateCountData;
}

export const getStatisticsThemes = () =>
  axios.get<StatisticsThemeDto[]>('/statistics/themes');

export const getQuestionBankDashboard = () =>
  axios.get<QuestionBankDashboardData>('/statistics/themes/question-bank/dashboard');
