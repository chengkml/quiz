import axios from '@/core/src/http';

const base = '/quiz';

// 获取菜单列表（分页查询）
const getMenuList = params => axios.get(`${base}/api/menu`, {params});

// 获取菜单详情
const getMenuById = id => axios.get(`${base}/api/menu/${id}`);

// 根据名称获取菜单
const getMenuByName = name => axios.get(`${base}/api/menu/name/${name}`);

// 创建菜单
const createMenu = params => axios.post(`${base}/api/menu/create`, params);

// 更新菜单
const updateMenu = (id, params) => axios.put(`${base}/api/menu/${id}/update`, params);

// 删除菜单
const deleteMenu = id => axios.delete(`${base}/api/menu/${id}/delete`);

// 启用菜单
const enableMenu = id => axios.post(`${base}/api/menu/${id}/enable`);

// 禁用菜单
const disableMenu = id => axios.post(`${base}/api/menu/${id}/disable`);

// 获取菜单树
const getMenuTree = () => axios.get(`${base}/api/menu/tree`);

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