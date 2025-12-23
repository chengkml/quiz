// 系统参数管理相关的TypeScript类型定义

/**
 * 参数类型枚举
 */
export enum ParamType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
  LIST = 'LIST'
}

/**
 * 参数状态枚举
 */
export enum ParamStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/**
 * 系统参数DTO
 */
export interface SystemParamDto {
  id: string;
  paramKey: string;
  paramName: string;
  paramValue: string;
  defaultValue: string;
  paramType: ParamType;
  category: string;
  description: string;
  isEncrypted: boolean;
  isReadonly: boolean;
  status: ParamStatus;
  sortOrder: number;
  createUser: string;
  createDate: string;
  updateUser: string;
  updateDate: string;
}

/**
 * 系统参数创建DTO
 */
export interface SystemParamCreateDto {
  paramKey: string;
  paramName: string;
  paramValue?: string;
  defaultValue?: string;
  paramType: ParamType;
  category?: string;
  description?: string;
  isEncrypted?: boolean;
  isReadonly?: boolean;
  status?: ParamStatus;
  sortOrder?: number;
}

/**
 * 系统参数更新DTO
 */
export interface SystemParamUpdateDto {
  id: string;
  paramName?: string;
  paramValue?: string;
  defaultValue?: string;
  category?: string;
  description?: string;
  isEncrypted?: boolean;
  isReadonly?: boolean;
  status?: ParamStatus;
  sortOrder?: number;
}

/**
 * 系统参数查询参数
 */
export interface SystemParamQueryDto {
  paramKey?: string;
  paramName?: string;
  category?: string;
  status?: ParamStatus;
  page?: number;
  size?: number;
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  success: boolean;
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
