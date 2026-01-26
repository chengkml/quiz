import axios from '@/core/src/http';

// 分页查询分组（POST search）
export const getGroupList = (params: any) => axios.post('/group/search', params);

// 获取分组详情
export const getGroupById = (id: string) => axios.get(`/group/get/${id}`);

// 创建分组
export const createGroup = (params: any) => axios.post('/group/create', params);

// 更新分组
export const updateGroup = (params: any) => axios.put('/group/update', params);

// 删除分组
export const deleteGroup = (id: string) => axios.delete(`/group/delete/${id}`);

// 校验分组名称唯一性
export const checkGroupName = (name: string, id?: string) => axios.get('/group/check/name', { params: { name, id } });

export default {
  getGroupList,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  checkGroupName,
};
