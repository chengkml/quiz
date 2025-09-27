/**
 * 通用API响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: string | number;
}

/**
 * 分页响应类型
 */
export interface PageResponse<T = any> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

/**
 * 分页查询参数
 */
export interface PageParams {
  page: number;
  size: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

/**
 * 基础查询参数
 */
export interface BaseQueryParams extends PageParams, SortParams {
  [key: string]: any;
}

/**
 * 选项类型
 */
export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/**
 * 树形节点类型
 */
export interface TreeNode<T = any> {
  key: string;
  title: string;
  children?: TreeNode<T>[];
  data?: T;
  disabled?: boolean;
  checkable?: boolean;
}

/**
 * 表格列配置类型
 */
export interface TableColumn<T = any> {
  title: string;
  dataIndex: string;
  key?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sorter?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

/**
 * 表单字段类型
 */
export interface FormField {
  field: string;
  label: string;
  type: 'input' | 'select' | 'textarea' | 'number' | 'date' | 'switch' | 'radio' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  rules?: any[];
  disabled?: boolean;
  tooltip?: string;
}

/**
 * 文件上传响应类型
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

/**
 * 错误信息类型
 */
export interface ErrorInfo {
  code: string | number;
  message: string;
  details?: any;
}