import axios from '@/core/src/http';

export interface WrongQuestionDto {
  id: string;
  subjectId: string;
  subjectName?: string;
  categoryId?: string;
  categoryName?: string;
  type: 'SINGLE' | 'MULTIPLE' | 'BLANK' | 'SHORT_ANSWER';
  content: string;
  answer?: string;
  difficulty?: string;
  remark?: string;
  originalImageFileId?: string;
  originalImageName?: string;
  originalImageUrl?: string;
  ocrText?: string;
  createDate?: string;
  createUser?: string;
  createUserName?: string;
  updateDate?: string;
  updateUser?: string;
  updateUserName?: string;
}

export interface WrongQuestionCreateDto {
  subjectId: string;
  categoryId?: string;
  type: 'SINGLE' | 'MULTIPLE' | 'BLANK' | 'SHORT_ANSWER';
  content: string;
  answer?: string;
  difficulty?: string;
  remark?: string;
  originalImageFileId?: string;
  originalImageName?: string;
  ocrText?: string;
}

export interface WrongQuestionUpdateDto extends WrongQuestionCreateDto {
  id: string;
}

export interface WrongQuestionQueryDto {
  subjectId?: string;
  categoryId?: string;
  type?: 'SINGLE' | 'MULTIPLE' | 'BLANK' | 'SHORT_ANSWER';
  difficulty?: string;
  content?: string;
  pageNum?: number;
  pageSize?: number;
}

export const getWrongQuestionList = (params: WrongQuestionQueryDto) =>
  axios.post('/wrong-question/search', params);

export const getWrongQuestionById = (id: string) =>
  axios.get(`/wrong-question/get/${id}`);

export const createWrongQuestion = (data: WrongQuestionCreateDto) =>
  axios.post('/wrong-question/create', data);

export const updateWrongQuestion = (data: WrongQuestionUpdateDto) =>
  axios.put('/wrong-question/update', data);

export const deleteWrongQuestion = (id: string) =>
  axios.delete(`/wrong-question/delete/${id}`);

export const getAllSubjects = () => axios.get('/subject/list');

export const getCategoriesBySubjectId = (subjectId: string) =>
  axios.get(`/category/subject/${subjectId}`);

export const uploadWrongQuestionImage = (file: File, path = 'wrong-question/') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);
  return axios.post('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getModelsByType = (type: string) =>
  axios.get(`/llm-model/list-by-type/${type}`);
