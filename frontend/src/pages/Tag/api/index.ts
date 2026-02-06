import axios from '@/core/src/http';

export interface TagDto {
    id: number;
    name: string;
    label: string;
    type: string;
    descr: string;
    color: string;
    createUser?: string;
    createDate?: string;
}

export interface TagCreateDto {
    name: string;
    label: string;
    type?: string;
    descr?: string;
    color?: string;
}

export interface TagUpdateDto {
    id: number;
    name?: string;
    label?: string;
    type?: string;
    descr?: string;
    color?: string;
}

export interface TagQueryDto {
    name?: string;
    label?: string;
    type?: string;
    pageNum: number;
    pageSize: number;
}

// 获取标签列表
export const getTagList = (params: any) => 
    axios.post('/tag/search', params);

// 获取标签详情
export const getTagById = (id: number) => 
    axios.get(`/tag/${id}`);

// 创建标签
export const createTag = (data: TagCreateDto) => 
    axios.post('/tag/create', data);

// 更新标签
export const updateTag = (data: TagUpdateDto) => 
    axios.post('/tag/update', data);

// 删除标签
export const deleteTag = (id: number) => 
    axios.delete(`/tag/${id}`);

// 检查标签名称是否存在
export const checkTagName = (tagName: string, type: string, excludeTagId?: number) => 
    axios.get('/tag/check/name', { params: { tagName, type, excludeTagId } });
