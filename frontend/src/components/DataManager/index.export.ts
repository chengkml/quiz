/**
 * DataManager 组件库 - 完整导出
 * 
 * 使用方式：
 * 
 * // 导入主组件
 * import { DataManager, AddEditModal, DetailModal } from '@/components/DataManager';
 * 
 * // 导入单个组件
 * import DataManager from '@/components/DataManager';
 * 
 * // 导入类型
 * import type { DataManagerProps, FormFieldConfig } from '@/components/DataManager';
 * 
 * // 导入工具函数
 * import { formatDate, debounce } from '@/components/DataManager';
 */

// 导出主组件
export { default as DataManager } from './index';

// 导出模态框组件
export { default as AddEditModal } from './AddEditModal';
export { default as DetailModal } from './DetailModal';

// 导出列表视图组件
export { default as ShortCardList } from './ShortCardList';
export { default as LongCardList } from './LongCardList';
export { default as TableList } from './TableList';

// 导出所有类型定义
export type {
  // 基础类型
  DisplayMode,
  PaginationConfig,
  
  // 主组件配置
  DataManagerConfig,
  DataManagerProps,
  
  // 字段和列配置
  ColumnConfig,
  CardConfig,
  CardActions,
  
  // 模态框配置
  AddEditModalProps,
  TabConfig,
  DetailModalProps,
  
  // 表单配置
  FormFieldConfig,
  
  // 详情配置
  DetailFieldConfig,
} from './types';

// 导出工具函数
export {
  // 表单相关
  renderFormField,
  getFormInitialValues,
  validateFormFields,
  generateSelectOptions,
  
  // 数据处理
  paginateData,
  formatDate,
  formatRelativeTime,
  
  // 性能优化
  debounce,
  throttle,
} from './utils';
