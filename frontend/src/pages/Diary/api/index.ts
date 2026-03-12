import axios from '@/core/src/http';

export type DiaryMood = 'HAPPY' | 'CALM' | 'SAD' | 'ANGRY' | 'TIRED' | 'EXCITED';

export interface DiaryDto {
  id: string;
  title: string;
  content: string;
  diaryDate: string;
  mood: DiaryMood;
  weather?: string;
  archived: boolean;
  createDate: string;
  updateDate: string;
  createUser: string;
}

export interface DiaryQueryDto {
  title?: string;
  mood?: DiaryMood;
  diaryDateStart?: string;
  diaryDateEnd?: string;
  archived?: boolean;
  pageNum?: number;
  pageSize?: number;
}

export interface DiaryCreateDto {
  title: string;
  content: string;
  diaryDate: string;
  mood: DiaryMood;
  weather?: string;
  archived?: boolean;
}

export interface DiaryUpdateDto extends DiaryCreateDto {
  id: string;
}

export const getDiaryList = (params: DiaryQueryDto) => axios.post('/diary/search', params);

export const getDiaryById = (id: string) => axios.get(`/diary/get/${id}`);

export const createDiary = (params: DiaryCreateDto) => axios.post('/diary/create', params);

export const updateDiary = (params: DiaryUpdateDto) => axios.put('/diary/update', params);

export const deleteDiary = (id: string) => axios.delete(`/diary/delete/${id}`);

export const archiveDiary = (id: string, archived: boolean) =>
  axios.post(`/diary/${id}/archive`, null, { params: { archived } });
