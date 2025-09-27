// 角色管理相关的TypeScript类型定义

// 角色创建DTO
export interface RoleCreateDto {
  roleId: string;
  roleName: string;
  roleDescr?: string;
  roleType: string;
  state: string; // "1"=启用，"0"=禁用
  createUser: string;
}

// 角色更新DTO
export interface RoleUpdateDto {
  roleId: string;
  roleName: string;
  roleDescr?: string;
  roleType: string;
  state: string;
}

// 角色查询DTO
export interface RoleQueryDto {
  roleName?: string;
  roleType?: string;
  state?: string;
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
}

// 角色DTO
export interface RoleDto {
  roleId: string;
  roleName: string;
  roleDescr: string;
  roleType: string;
  state: string; // "1"=启用，"0"=禁用
  createDate: string;
  createUser: string;
  updateDate?: string;
  updateUser?: string;
}

// 角色查询参数
export interface RoleQueryParams {
  roleName?: string;
  roleType?: string;
  state?: string;
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: string;
}

// 检查角色名称唯一性响应
export interface CheckRoleNameResponse {
  success: boolean;
  exists: boolean;
  message?: string;
}

// 角色类型选项
export interface RoleTypeOption {
  label: string;
  value: string;
}

// 角色表格列配置
export interface RoleTableColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: RoleDto) => React.ReactNode;
}