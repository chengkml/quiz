// 数据源管理相关的TypeScript类型定义

// 数据源类型枚举
export enum DataSourceType {
  MYSQL = 'MYSQL',
  ORACLE = 'ORACLE',
  MONGODB = 'MONGODB',
  POSTGRESQL = 'POSTGRESQL',
  S3 = 'S3',
  FTP = 'FTP',
  SFTP = 'SFTP'
}

// 数据源状态枚举
export enum DataSourceState {
  ENABLED = '1',
  DISABLED = '0'
}

// 数据源创建DTO
export interface DataSourceCreateDto {
  dsName: string;
  dsType: DataSourceType;
  dsDesc?: string;
  host?: string;
  port?: number;
  databaseName?: string;
  schemaName?: string;
  url?: string;
  username: string;
  password?: string;
  accessKey?: string;
  secretKey?: string;
  bucketName?: string;
  region?: string;
  state: DataSourceState,
  connectionParams?: string; // JSON格式的连接参数
}

// 数据源更新DTO
export interface DataSourceUpdateDto extends DataSourceCreateDto {
  dsId: string;
  version: number; // 乐观锁版本号
}

// 数据源DTO
export interface DataSourceDto {
  dsId: string;
  dsName: string;
  dsType: DataSourceType;
  dsDesc?: string;
  state: DataSourceState;
  host?: string;
  port?: number;
  databaseName?: string;
  schemaName?: string;
  url?: string;
  username: string;
  password?: string;
  accessKey?: string;
  secretKey?: string;
  bucketName?: string;
  region?: string;
  connectionParams?: string;
  lastTestTime?: string;
  lastTestResult?: boolean;
  version: number;
  createTime: string;
  updateTime: string;
  creator?: string;
}

// 数据源查询参数
export interface DataSourceQueryParams {
  page: number;
  size: number;
  name?: string;
  type?: DataSourceType | null;
  state?: DataSourceState;
}

// 数据源测试结果DTO
export interface DataSourceTestDto {
  testResult: 'SUCCESS' | 'FAILURE';
  errorDetail?: string;
  testTime: string;
}

// 分页响应
export interface PageResponse<T> {
  success: boolean;
  data: {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number; // 当前页码（从0开始）
    size: number;
    first: boolean;
    last: boolean;
  };
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 名称存在性检查响应
export interface NameExistsResponse {
  success: boolean;
  exists: boolean;
}

// 数据源类型选项
export interface DataSourceTypeOption {
  label: string;
  value: DataSourceType;
}

// 表单字段分组配置
export interface FieldGroupConfig {
  [key: string]: string[];
}

// 数据源状态选项
export interface DataSourceStateOption {
  label: string;
  value: DataSourceState;
  color: string;
  icon: string;
}

// 操作按钮配置
export interface ActionButtonConfig {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'dashed' | 'text' | 'link' | null;
  status?: 'warning' | 'danger' | 'success';
  disabled?: boolean;
}

// 表单验证规则
export interface FormValidationRule {
  required?: boolean;
  message?: string;
  pattern?: RegExp;
  min?: number;
  max?: number;
  validator?: (rule: any, value: any) => Promise<void>;
}

// 表单字段配置
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'input' | 'select' | 'password' | 'number' | 'textarea' | null;
  required?: boolean;
  placeholder?: string;
  rules?: FormValidationRule[];
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  visibleFor?: DataSourceType[];
}

// 连接测试状态
export enum TestConnectionStatus {
  IDLE = 'idle',
  TESTING = 'testing',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// 模态框类型
export enum ModalType {
  CREATE = 'create',
  EDIT = 'edit',
  VIEW = 'view'
}

// 数据源操作类型
export enum DataSourceAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ENABLE = 'enable',
  DISABLE = 'disable',
  TEST = 'test'
}