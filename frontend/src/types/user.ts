// 用户管理相关的TypeScript类型定义

// 用户创建DTO
export interface UserCreateDto {
  userId: string;
  userName: string;
  userPwd: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  defaultTeam?: string;
  logo?: string;
}

// 用户更新DTO
export interface UserUpdateDto {
  userName?: string;
  email?: string;
  phone?: string;
  defaultTeam?: string;
  logo?: string;
}

// 角色DTO
export interface RoleDto {
  roleId: string;
  roleName: string;
  roleDescr: string;
  roleType: string;
  state: string;
  createDate: string;
  createUser: string;
}

// 用户DTO
export interface UserDto {
  id: string;
  userId: string;
  userName: string;
  email: string;
  phone: string;
  state: '正常' | '禁用';
  createDt: string;
  defaultTeam: string;
  logo: string;
  roles: RoleDto[];
}

// 用户查询参数
export interface UserQueryParams {
  userId?: string;
  userName?: string;
  state?: string;
  page: number;
  size: number;
}

// 分页响应
export interface PageResponse<T> {
  success: boolean;
  data: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 重置密码请求
export interface ResetPasswordRequest {
  newPassword: string;
}

// 分配角色请求
export interface AssignRolesRequest {
  roleIds: string[];
}

// 检查唯一性响应
export interface CheckUniqueResponse {
  success: boolean;
  exists: boolean;
  userId?: string;
  email?: string;
  phone?: string;
}

// 表格列配置
export interface UserTableColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: UserDto) => React.ReactNode;
}

// 登录用户信息
export interface LoginUserInfo {
  id: string;
  userId: string;
  userName: string;
  email?: string;
  phone?: string;
  logo?: string;
  defaultTeam?: string;
  roles?: RoleDto[];
}

// 表单字段配置
export interface FormField {
  field: string;
  label: string;
  required?: boolean;
  rules?: any[];
  component: 'input' | 'password' | 'select' | 'textarea';
  placeholder?: string;
}