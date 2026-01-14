import axios from '@/core/src/http';

// 创建角色
const createRole = params => axios.post('/role/create', params);

// 更新角色
const updateRole = params => axios.put('/role/update', params);

// 删除角色
const deleteRole = roleId => axios.delete(`/role/delete/${roleId}`);

// 获取角色详情
const getRoleById = roleId => axios.get(`/role/get/${roleId}`);

// 根据名称获取角色
const getRoleByName = roleName => axios.get(`/role/name/${roleName}`);

// 分页查询角色
const getRoles = params => axios.post('/role/search', params);

// 检查角色名称是否存在
const checkRoleName = (roleName, excludeRoleId = null) => {
  const params = { name: roleName };
  if (excludeRoleId) {
    params.excludeId = excludeRoleId;
  }
  return axios.get('/role/check/name', { params });
};

export {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getRoleByName,
  getRoles,
  checkRoleName
};

// ================== 角色菜单分配相关接口 ==================

// 获取指定角色的已分配菜单树
export const getRoleMenuTree = (roleId) => axios.get(`/role/menu/rela/role/${roleId}/tree`);

// 替换指定角色的菜单分配（传入菜单ID数组）
export const replaceRoleMenus = (roleId, menuIds) => axios.post(`/role/menu/rela/${roleId}/replace`, menuIds);