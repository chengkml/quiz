import axios from '@/core/src/http';

export interface HomeworkDto {
    id: string;
    title: string;
    content: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    createDate?: string;
    createUser?: string;
    createUserName?: string;
    updateDate?: string;
    updateUser?: string;
    updateUserName?: string;
}

export interface HomeworkCreateDto {
    title?: string;
    content?: string;
    status?: string;
}

export interface HomeworkUpdateDto {
    id: string;
    title?: string;
    content?: string;
    status?: string;
}

export interface HomeworkQueryDto {
    title?: string;
    pageNum?: number;
    pageSize?: number;
}

// 分页查询
export const getHomeworkList = (params: HomeworkQueryDto) =>
    axios.post('/homework/search', params);

// 获取详情
export const getHomeworkById = (id: string) =>
    axios.get(`/homework/get/${id}`);

// 创建
export const createHomework = (data: HomeworkCreateDto) =>
    axios.post('/homework/create', data);

// 更新
export const updateHomework = (data: HomeworkUpdateDto) =>
    axios.put('/homework/update', data);

// 删除
export const deleteHomework = (id: string) =>
    axios.delete(`/homework/delete/${id}`);

// AI 生成待办
export const generateTodos = (id: string) =>
    axios.post(`/homework/${id}/generate-todos`);

export default {
    getHomeworkList,
    getHomeworkById,
    createHomework,
    updateHomework,
    deleteHomework,
    generateTodos,
};
