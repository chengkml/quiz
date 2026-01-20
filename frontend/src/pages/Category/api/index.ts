import axios from '@/core/src/http';

// 获取分类列表（分页查询）
const getCategoryList = (params: any) => axios.post('/category/search', params);

// 获取分类详情
const getCategoryById = (id: string) => axios.get(`/category/get/${id}`);

// 创建分类
const createCategory = (params: any) => axios.post('/category/create', params);

// 更新分类
const updateCategory = (params: any) => axios.put('/category/update', params);

// 删除分类
const deleteCategory = (id: string) => axios.delete(`/category/delete/${id}`);

// 获取所有分类（简列表）
const getAllCategories = () => axios.get('/category/list');

// 检查分类名称是否存在（后端: /category/check/name?categoryName=xxx&excludeCategoryId=xxx）
const checkCategoryNameExists = (categoryName: string, excludeCategoryId?: string) => {
  const params: any = { categoryName };
  if (excludeCategoryId) params.excludeCategoryId = excludeCategoryId;
  return axios.get('/category/check/name', { params });
};

// 获取学科分类树
const getSubjectCategoryTree = () => axios.get('/category/subject-category-tree');

export {
  getCategoryList,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  checkCategoryNameExists,
  getSubjectCategoryTree,
};