import axios from 'axios';

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
    // 处理401错误，跳转到登录页面
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/data_synth/login';
    }
    return Promise.reject(error);
  }
);
import {
  RoleCreateDto,
  RoleUpdateDto,
  RoleQueryParams,
  RoleDto,
  RoleStatsDto,
  CheckRoleNameResponse
} from '../types/role';
import { PageResponse, ApiResponse } from '../types/user';

// 角色管理API服务
export class RoleService {
  // 查询角色列表
  static async getRoles(params: RoleQueryParams): Promise<PageResponse<RoleDto>> {
    return api.get('/role', { params });
  }

  // 创建角色
  static async createRole(data: RoleCreateDto): Promise<ApiResponse<RoleDto>> {
    return api.post('/role', data);
  }

  // 更新角色
  static async updateRole(roleId: string, data: RoleUpdateDto): Promise<ApiResponse<RoleDto>> {
    return api.post(`/role/${roleId}/update`, data);
  }

  // 删除角色
  static async deleteRole(roleId: string): Promise<ApiResponse> {
    return api.post(`/role/${roleId}/delete`);
  }

  // 获取角色详情
  static async getRoleDetail(roleId: string): Promise<ApiResponse<RoleDto>> {
    return api.get(`/role/${roleId}`);
  }

  // 启用角色
  static async enableRole(roleId: string): Promise<ApiResponse> {
    return api.post(`/role/${roleId}/enable`);
  }

  // 禁用角色
  static async disableRole(roleId: string): Promise<ApiResponse> {
    return api.post(`/role/${roleId}/disable`);
  }

  // 检查角色名称是否存在
  static async checkRoleName(roleName: string, excludeRoleId?: string): Promise<CheckRoleNameResponse> {
    const params: any = { roleName };
    if (excludeRoleId) {
      params.excludeRoleId = excludeRoleId;
    }
    return api.get('/role/check-name', { params });
  }

}