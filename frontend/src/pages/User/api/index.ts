import axios from '@/core/src/http';

const base = '/quiz';

// 用户注册
const registerUser = params => axios.post(`${base}/api/user/register`, params);

// 用户登录
const loginUser = params => axios.post(`${base}/api/user/login`, params);

// 获取用户详情
const getUserById = id => axios.get(`${base}/api/user/${id}`);

// 分页查询用户
const searchUsers = params => axios.get(`${base}/api/user/search`, { params });

// 更新用户信息
const updateUser = params => axios.put(`${base}/api/user/update`, params);

// 管理员重置密码
const resetPassword = (id, newPassword) => axios.put(`${base}/api/user/${id}/reset/password`, null, { 
  params: { newPassword } 
});

// 启用用户
const enableUser = id => axios.post(`${base}/api/user/${id}/enable`);

// 禁用用户
const disableUser = id => axios.post(`${base}/api/user/${id}/disable`);

// 检查用户ID是否存在
const checkUserId = userId => axios.get(`${base}/api/user/check/userId`, { 
  params: { userId } 
});

// 删除用户
const deleteUser = id => axios.delete(`${base}/api/user/delete/${id}`);

// 用户登出
const logoutUser = () => axios.post(`${base}/api/user/logout`);

export {
  registerUser,
  loginUser,
  getUserById,
  searchUsers,
  updateUser,
  resetPassword,
  enableUser,
  disableUser,
  checkUserId,
  deleteUser,
  logoutUser
};