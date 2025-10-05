import axios from '@/core/src/http';

const base = 'quiz';

// 创建角色
const createRole = params => axios.post(`${base}/api/role/create`, params);

// 更新角色
const updateRole = params => axios.put(`${base}/api/role/update`, params);

// 删除角色
const deleteRole = roleId => axios.delete(`${base}/api/role/delete/${roleId}`);

// 获取角色详情
const getRoleById = roleId => axios.get(`${base}/api/role/${roleId}`);

// 根据名称获取角色
const getRoleByName = roleName => axios.get(`${base}/api/role/name/${roleName}`);

// 分页查询角色
const getRoles = params => axios.get(`${base}/api/role`, { params });

// 获取启用角色列表
const getActiveRoles = () => axios.get(`${base}/api/role/list/active`);

// 启用角色
const enableRole = roleId => axios.post(`${base}/api/role/${roleId}/enable`);

// 禁用角色
const disableRole = roleId => axios.post(`${base}/api/role/${roleId}/disable`);

// 检查角色名称是否存在
const checkRoleName = (roleName, excludeRoleId = null) => {
  const params = { roleName };
  if (excludeRoleId) {
    params.excludeRoleId = excludeRoleId;
  }
  return axios.get(`${base}/api/role/check/name`, { params });
};

export {
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getRoleByName,
  getRoles,
  getActiveRoles,
  enableRole,
  disableRole,
  checkRoleName
};