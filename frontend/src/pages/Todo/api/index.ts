import axios from '@/core/src/http';

const base = '/quiz';

// 分页查询待办（POST search）
export const getTodoList = (params) => axios.post(`${base}/api/todo/search`, params);

// 获取待办详情 - 修正为路径参数
export const getTodoById = (id: string) => axios.get(`${base}/api/todo/${id}`);

// 创建待办
export const createTodo = (params) => axios.post(`${base}/api/todo/create`, params);

// 更新待办 - 修正为PUT方法
export const updateTodo = (params) => axios.put(`${base}/api/todo/update`, params);

// 删除待办 - 修正为DELETE方法和路径参数
export const deleteTodo = (id: string) => axios.delete(`${base}/api/todo/${id}`);

// 初始化思维导图 - 修正为路径参数
export const initMindMap = (id: string) => axios.post(`${base}/api/todo/${id}/init-mindmap`);

export default {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  initMindMap,
};