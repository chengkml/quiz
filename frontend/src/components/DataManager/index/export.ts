/**
 * DataManager 组件库导出文件
 */

// 主组件
export { default as DataManager } from './index';
export { default as AddEditModal } from '../components/AddEditModal';
export { default as DetailModal } from '../components/DetailModal';
export { default as ShortCardList } from '../components/ShortCardList';
export { default as LongCardList } from '../components/LongCardList';
export { default as TableList } from '../components/TableList';

// 类型定义
export type {
  DisplayMode,
  PaginationConfig,
  DataManagerConfig,
  DataManagerProps,
  ColumnConfig,
  CardConfig,
  CardActions,
  AddEditModalProps,
  DetailModalProps,
  FormFieldConfig,
  TabConfig,
  DetailFieldConfig,
} from '../../types/types';

// 工具函数
export {
  renderFormField,
  getFormInitialValues,
  validateFormFields,
  generateSelectOptions,
  paginateData,
  formatDate,
  formatRelativeTime,
  debounce,
  throttle,
} from '../../utils/utils';
