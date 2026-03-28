import axios from '@/core/src/http';

export interface PoetryCardDto {
    id: string;
    title: string;
    author?: string;
    dynasty?: string;
    content?: string;
    mdAnalysis?: string;
    easinessFactor: number;
    interval: number;
    repetition: number;
    nextReviewDate: string;
    archived: boolean;
    totalReviewCount: number;
    lastScore: number | null;
    createDate: string;
    updateDate: string;
    createUser: string;
}

export interface PoetryCardCreateDto {
    title: string;
    author?: string;
    dynasty?: string;
    content?: string;
    mdAnalysis?: string;
}

export interface PoetryCardUpdateDto {
    id: string;
    title: string;
    author?: string;
    dynasty?: string;
    content?: string;
    mdAnalysis?: string;
}

export interface PoetryCardQueryDto {
    keyword?: string;
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

export interface ReviewRequestDto {
    id: string;
    score: number;
}

export interface ReviewLogDto {
    id: string;
    objId: string;
    reviewDate: string;
    score: number;
    efBefore: number;
    efAfter: number;
    nextIntervalDays: number;
}

export const getPoetryList = (params: PoetryCardQueryDto) =>
    axios.post('/poetry/search', params);

export const createPoetry = (data: PoetryCardCreateDto) =>
    axios.post('/poetry/create', data);

export const updatePoetry = (data: PoetryCardUpdateDto) =>
    axios.put('/poetry/update', data);

export const deletePoetry = (id: string) =>
    axios.delete(`/poetry/delete/${id}`);

export const archivePoetry = (id: string, archived: boolean = true) =>
    axios.post(`/poetry/archive/${id}`, null, { params: { archived } });

export const resetPoetry = (id: string) =>
    axios.post(`/poetry/reset/${id}`);

export const getDueToday = () =>
    axios.get('/poetry/due-today');

export const reviewPoetry = (data: ReviewRequestDto) =>
    axios.post('/poetry/review', data);

export const getReviewHistory = (cardId: string) =>
    axios.get(`/poetry/review-history/${cardId}`);
