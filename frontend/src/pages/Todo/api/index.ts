import axios from '@/core/src/http';

// 分页查询待办（POST search）
export const getTodoList = (params) => axios.post('/todo/search', params);

// 获取待办详情 - 修正为路径参数
export const getTodoById = (id: string) => axios.get(`/todo/${id}`);

// 创建待办
export const createTodo = (params) => axios.post('/todo/create', params);

// 更新待办 - 修正为PUT方法
export const updateTodo = (params) => axios.put('/todo/update', params);

// 删除待办 - 修正为DELETE方法和路径参数
export const deleteTodo = (id: string) => axios.delete(`/todo/${id}`);

// 初始化思维导图 - 修正为路径参数
export const initMindMap = (id: string) => axios.post(`/todo/${id}/init-mindmap`);

export default {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  initMindMap,
};