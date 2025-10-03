import axios from '@/core/src/http';

const base = 'quiz';

// 获取分类列表（分页查询）
const getCategoryList = params => axios.post(`${base}/api/categories/search`, params);

// 获取分类详情
const getCategoryById = id => axios.get(`${base}/api/categories/${id}`);

// 根据名称获取分类
const getCategoryByName = name => axios.get(`${base}/api/categories/name/${name}`);

// 创建分类
const createCategory = params => axios.post(`${base}/api/categories`, params);

// 更新分类
const updateCategory = params => axios.put(`${base}/api/categories`, params);

// 删除分类
const deleteCategory = id => axios.delete(`${base}/api/categories/${id}`);

// 获取所有分类
const getAllCategories = () => axios.get(`${base}/api/categories/all`);

// 根据学科ID获取分类
const getCategoriesBySubjectId = subjectId => axios.get(`${base}/api/categories/subject/${subjectId}`);

// 根据父分类ID获取子分类
const getCategoriesByParentId = parentId => axios.get(`${base}/api/categories/parent/${parentId}`);

// 根据层级获取分类
const getCategoriesByLevel = level => axios.get(`${base}/api/categories/level/${level}`);

// 检查分类名称是否存在
const checkCategoryNameExists = (name, excludeId = null) => {
  const params = { name };
  if (excludeId) {
    params.excludeId = excludeId;
  }
  return axios.get(`${base}/api/categories/check-name`, { params });
};

export {
  getCategoryList,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesBySubjectId,
  getCategoriesByParentId,
  getCategoriesByLevel,
  checkCategoryNameExists
};