export { default } from './index/index';
export { default as DataManager } from './index/index';
export { default as AddEditModal } from './components/AddEditModal';
export { default as DetailModal } from './components/DetailModal';
export { default as ShortCardList } from './components/ShortCardList';
export { default as LongCardList } from './components/LongCardList';
export { default as TableList } from './components/TableList';

// 导出所有类型定义
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
} from '../types/types';

// 导出工具函数
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
} from '../utils/utils';
