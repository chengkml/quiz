import axios from '@/core/src/http';

const base = '/quiz';

// 分页查询待办（POST search）
export const getTodoList = (params) => axios.post(`${base}/api/todo/search`, params);

// 获取待办详情
export const getTodoById = (id: string) => axios.get(`${base}/api/todo/get`, { params: { todoId: id } });

// 创建待办
export const createTodo = (params) => axios.post(`${base}/api/todo/create`, params);

// 更新待办
export const updateTodo = (params) => axios.post(`${base}/api/todo/update`, params);

// 删除待办
export const deleteTodo = (id: string) => axios.post(`${base}/api/todo/delete`, null, { params: { todoId: id } });

export default {
  getTodoList,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};