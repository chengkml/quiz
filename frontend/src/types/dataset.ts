// 数据集管理相关的TypeScript类型定义

// 数据集创建DTO
export interface DatasetCreateDto {
  datasetId: string;
  datasetNameEn: string;
  datasetNameCn: string;
  permission: 'public' | 'private';
  tableName: string;
  description?: string;
}

// 数据集更新DTO
export interface DatasetUpdateDto {
  datasetNameEn?: string;
  datasetNameCn?: string;
  permission?: 'public' | 'private';
  tableName?: string;
  description?: string;
}

// 数据集DTO
export interface DatasetDto {
  id: string;
  datasetId: string;
  datasetNameEn: string;
  datasetNameCn: string;
  permission: 'public' | 'private';
  tableName: string;
  creator: string;
  createTime: string;
  status: 'active' | 'inactive';
  description?: string;
}

// 数据集查询参数
export interface DatasetQueryParams {
  datasetId?: string;
  datasetNameEn?: string;
  datasetNameCn?: string;
  permission?: string;
  status?: string;
  creator?: string;
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

// 检查唯一性响应
export interface CheckUniqueResponse {
  success: boolean;
  exists: boolean;
  datasetId?: string;
  tableName?: string;
}

// 表格列配置
export interface DatasetTableColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: DatasetDto) => React.ReactNode;
}

// 表单字段配置
export interface FormField {
  field: string;
  label: string;
  required?: boolean;
  rules?: any[];
  component: 'input' | 'select' | 'textarea';
  placeholder?: string;
}

// 权限选项
export interface PermissionOption {
  label: string;
  value: 'public' | 'private';
}

// 状态选项
export interface StatusOption {
  label: string;
  value: string;
}