import axios from '@/core/src/http';

// 分页查询待办（POST search）
export const getTodoList = (params) => axios.post('/todo/search', params);

// 获取待办详情
export const getTodoById = (id: string) => axios.get(`/todo/get/${id}`);

// 创建待办
export const createTodo = (params) => axios.post('/todo/create', params);

// 更新待办
export const updateTodo = (params) => axios.put('/todo/update', params);

// 删除待办
export const deleteTodo = (id: string) => axios.delete(`/todo/delete/${id}`);

// 初始化思维导图
export const initMindMap = (id: string) => axios.post(`/todo/${id}/init-mindmap`);

// 完成待办
export const completeTodo = (id: string) => axios.post(`/todo/${id}/complete`);

export default {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  initMindMap,
  completeTodo,
};