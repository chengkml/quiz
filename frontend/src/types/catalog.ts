// 合成目录管理相关的TypeScript类型定义

// 字段信息DTO
export interface FieldInfoDto {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  fieldDesc?: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  fieldLength?: number;
  defaultValue?: string;
}

// 表数据预览DTO
export interface TablePreviewDto {
  headers: string[];
  rows: any[][];
  totalCount: number;
  previewCount: number;
}

// 合成目录DTO
export interface CatalogDto {
  modelId: string;
  modelName: string;
  modelDesc?: string;
  createUser: string;
  createTime: string;
  state: 'TRAINING' | 'COMPLETED' | 'FAILED';
  stateDesc: string;
  tabId: string;
  tabName?: string;
  fields?: FieldInfoDto[];
  samplingConfig?: Record<string, any>;
  trainingConfig?: Record<string, any>;
  preview?: TablePreviewDto;
  canEdit: boolean;
  canDelete: boolean;
  canPreview: boolean;
}

// 合成目录创建DTO
export interface CatalogCreateDto {
  modelName: string;
  modelDesc?: string;
  createUser: string;
  tabId: string;
  samplingConfig?: Record<string, any>;
  trainingConfig?: Record<string, any>;
}

// 合成目录更新DTO
export interface CatalogUpdateDto {
  modelId: string;
  modelName?: string;
  modelDesc?: string;
  state?: 'TRAINING' | 'COMPLETED' | 'FAILED';
  tabId?: string;
  samplingConfig?: Record<string, any>;
  trainingConfig?: Record<string, any>;
}

// 合成目录查询参数
export interface CatalogQueryParams {
  modelId?: string;
  modelName?: string;
  state?: string;
  createUser?: string;
  tabId?: string;
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

// 状态选项
export interface StateOption {
  label: string;
  value: string;
}

// 统计信息
export interface CatalogStats {
  totalCount: number;
  trainingCount: number;
  completedCount: number;
  failedCount: number;
}

// 表格列配置
export interface CatalogTableColumn {
  title: string;
  dataIndex: string;
  width?: number;
  render?: (value: any, record: CatalogDto) => React.ReactNode;
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

// 关联表信息
export interface TableInfo {
  tabId: string;
  tabName: string;
  description?: string;
}

// 配置参数模板
export interface ConfigTemplate {
  name: string;
  description: string;
  config: Record<string, any>;
}