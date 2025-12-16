import axios from '@/core/src/http';

// 获取菜单列表（分页查询）
const getMenuList = params => axios.get('/menu', {params});

// 获取菜单详情
const getMenuById = id => axios.get(`/menu/${id}`);

// 根据名称获取菜单
const getMenuByName = name => axios.get(`/menu/name/${name}`);

// 创建菜单
const createMenu = params => axios.post('/menu/create', params);

// 更新菜单
const updateMenu = (id, params) => axios.put(`/menu/${id}/update`, params);

// 删除菜单
const deleteMenu = id => axios.delete(`/menu/${id}/delete`);

// 启用菜单
const enableMenu = id => axios.post(`/menu/${id}/enable`);

// 禁用菜单
const disableMenu = id => axios.post(`/menu/${id}/disable`);

// 获取菜单树
const getMenuTree = () => axios.get('/menu/tree');

export {
  getMenuList,
  getMenuById,
  getMenuByName,
  createMenu,
  updateMenu,
  deleteMenu,
  enableMenu,
  disableMenu,
  getMenuTree
};