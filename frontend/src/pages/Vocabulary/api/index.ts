import axios from '@/core/src/http';

/**
 * 单词卡片 DTO
 */
export interface VocabularyCardDto {
    id: string;
    word: string;
    mdDefinition: string;
    easinessFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: string;
    archived: boolean;
    tags: string;
    totalReviewCount: number;
    lastScore: number | null;
    createDate: string;
    updateDate: string;
    createUser: string;
}

/**
 * 创建单词卡片 DTO
 */
export interface VocabularyCardCreateDto {
    word: string;
    mdDefinition: string;
    tags?: string;
}

/**
 * 更新单词卡片 DTO
 */
export interface VocabularyCardUpdateDto {
    id: string;
    word: string;
    mdDefinition: string;
    tags?: string;
}

/**
 * 单词卡片查询 DTO
 */
export interface VocabularyCardQueryDto {
    keyword?: string;
    tags?: string;
    archived?: boolean;
    minRepetition?: number;
    maxRepetition?: number;
    createDateStart?: string;
    createDateEnd?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
}

/**
 * 复习请求 DTO
 */
export interface ReviewRequestDto {
    cardId: string;
    score: number; // 0-5
}

/**
 * 复习结果 DTO
 */
export interface ReviewResultDto {
    cardId: string;
    word: string;
    score: number;
    newEasinessFactor: number;
    newInterval: number;
    newRepetition: number;
    nextReviewDate: string;
    message: string;
}

/**
 * 学习统计 DTO
 */
export interface StatisticsDto {
    totalWords: number;
    dueToday: number;
    archived: number;
    repetitionDistribution: Record<string, number>;
    efDistribution: Record<string, number>;
}

/**
 * 复习记录 DTO
 */
export interface ReviewLogDto {
    id: string;
    vocabularyCardId: string;
    reviewDate: string;
    score: number;
    efBefore: number;
    efAfter: number;
    nextIntervalDays: number;
}

// ========== API 函数 ==========

/**
 * 搜索/筛选单词列表
 */
export const getVocabularyList = (params: VocabularyCardQueryDto) =>
    axios.post('/vocabulary/search', params);

/**
 * 创建单词卡片
 */
export const createVocabulary = (data: VocabularyCardCreateDto) =>
    axios.post('/vocabulary/create', data);

/**
 * 更新单词卡片
 */
export const updateVocabulary = (data: VocabularyCardUpdateDto) =>
    axios.post('/vocabulary/update', data);

/**
 * 删除单词卡片
 */
export const deleteVocabulary = (id: string) =>
    axios.delete(`/vocabulary/delete/${id}`);

/**
 * 获取单词详情
 */
export const getVocabularyById = (id: string) =>
    axios.get(`/vocabulary/${id}`);

/**
 * 归档/取消归档单词
 */
export const archiveVocabulary = (id: string, archived: boolean = true) =>
    axios.post(`/vocabulary/archive/${id}`, null, { params: { archived } });

/**
 * 重置单词学习状态
 */
export const resetVocabulary = (id: string) =>
    axios.post(`/vocabulary/reset/${id}`);

/**
 * 获取今日待复习单词
 */
export const getDueToday = () =>
    axios.get('/vocabulary/due-today');

/**
 * 提交复习评分
 */
export const reviewVocabulary = (data: ReviewRequestDto) =>
    axios.post('/vocabulary/review', data);

/**
 * 获取学习统计
 */
export const getStatistics = () =>
    axios.get('/vocabulary/statistics');

/**
 * 获取单词复习历史
 */
export const getReviewHistory = (cardId: string) =>
    axios.get(`/vocabulary/review-history/${cardId}`);
