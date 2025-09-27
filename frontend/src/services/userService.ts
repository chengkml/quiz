import axios from 'axios';
import {
  UserDto,
  UserCreateDto,
  UserUpdateDto,
  UserQueryParams,
  PageResponse,
  ApiResponse,
  ResetPasswordRequest,
  AssignRolesRequest,
  CheckUniqueResponse,
  RoleDto,
} from '../types/user';

// 创建axios实例
const api = axios.create({
  baseURL: '/data_synth/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    // 处理401未授权错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/data_synth/login';
    }
    return Promise.reject(error);
  }
);

// 用户管理API服务
export class UserService {
  // 查询用户列表
  static async getUsers(params: UserQueryParams): Promise<PageResponse<UserDto>> {
    return api.get('/user', { params });
  }

  // 检查用户账号是否存在
  static async checkUserId(userId: string): Promise<CheckUniqueResponse> {
    return api.get(`/user/check/userId`, { params: { userId } });
  }

  // 检查邮箱是否存在
  static async checkEmail(email: string): Promise<CheckUniqueResponse> {
    return api.get(`/user/check/email`, { params: { email } });
  }

  // 检查手机号是否存在
  static async checkPhone(phone: string): Promise<CheckUniqueResponse> {
    return api.get(`/user/check/phone`, { params: { phone } });
  }

  // 新增用户
  static async createUser(userData: UserCreateDto): Promise<ApiResponse<UserDto>> {
    return api.post('/user/register', userData);
  }

  // 编辑用户
  static async updateUser(id: string, userData: UserUpdateDto): Promise<ApiResponse<UserDto>> {
    return api.post(`/user/${id}/update`, userData);
  }

  // 启用用户
  static async enableUser(id: string): Promise<ApiResponse> {
    return api.post(`/user/${id}/enable`);
  }

  // 禁用用户
  static async disableUser(id: string): Promise<ApiResponse> {
    return api.post(`/user/${id}/disable`);
  }

  // 重置密码
  static async resetPassword(id: string, data: ResetPasswordRequest): Promise<ApiResponse> {
    return api.post(`/user/${id}/resetPassword`, data);
  }

  // 分配角色
  static async assignRoles(id: string, data: AssignRolesRequest): Promise<ApiResponse> {
    return api.post(`/user/${id}/assignRoles`, data);
  }

  // 获取用户角色
  static async getUserRoles(id: string): Promise<ApiResponse<RoleDto[]>> {
    return api.get(`/user/${id}/roles`);
  }

  // 获取所有角色（可选功能）
  static async getAllRoles(): Promise<ApiResponse<RoleDto[]>> {
    return api.get('/roles');
  }

  // 获取用户详情
  static async getUserById(id: string): Promise<ApiResponse<UserDto>> {
    return api.get(`/user/${id}`);
  }

  // 删除单个用户
  static async deleteUser(id: string): Promise<ApiResponse> {
    return api.post(`/user/${id}/delete`);
  }

  // 批量删除用户（如果后端支持）
  static async deleteUsers(ids: string[]): Promise<ApiResponse> {
    return api.post('/user/batch-delete', { ids });
  }
}

export default UserService;