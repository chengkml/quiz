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

export interface VocabularyProficiencyOverview {
  totalWords: number;
  activeWords: number;
  archivedWords: number;
  masteredWords: number;
  dueTodayWords: number;
  averageRepetition: number;
  averageEasinessFactor: number;
}

export interface VocabularyProficiencyDashboardData {
  overview: VocabularyProficiencyOverview;
  proficiencyDistribution: SubjectCountData;
  reviewScoreDistribution: SubjectCountData;
  reviewCountByLastSevenDays: DateCountData;
}

export interface KnowledgeMasteryOverview {
  totalKnowledges: number;
  activeKnowledges: number;
  archivedKnowledges: number;
  masteredKnowledges: number;
  dueTodayKnowledges: number;
  averageRepetition: number;
  averageEasinessFactor: number;
}

export interface KnowledgeMasteryDashboardData {
  overview: KnowledgeMasteryOverview;
  masteryDistribution: SubjectCountData;
  knowledgeCountBySubject: SubjectCountData;
  reviewScoreDistribution: SubjectCountData;
  reviewCountByLastSevenDays: DateCountData;
}

export const getStatisticsThemes = () =>
  axios.get<StatisticsThemeDto[]>('/statistics/themes');

export const getQuestionBankDashboard = () =>
  axios.get<QuestionBankDashboardData>('/statistics/themes/question-bank/dashboard');

export const getVocabularyProficiencyDashboard = () =>
  axios.get<VocabularyProficiencyDashboardData>(
    '/statistics/themes/vocabulary-proficiency/dashboard',
  );

export const getKnowledgeMasteryDashboard = () =>
  axios.get<KnowledgeMasteryDashboardData>(
    '/statistics/themes/knowledge-mastery/dashboard',
  );
