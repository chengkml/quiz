/**
 * 通用数据管理组件类型定义
 */

export interface FormFieldConfig {
  field: string;
  label: string;
  type?: 'text' | 'input' | 'textarea' | 'select' | 'number' | 'date' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  rules?: any[];
  options?: { label: string; value: any }[];
  initialValue?: any;
  width?: string | number;
  span?: number;
  disabled?: boolean;
  visible?: boolean | ((record: any) => boolean);
  render?: (fieldValue: any, allValues: any) => React.ReactNode;
  allowClear?: boolean;
  labelWidth?: number | string;
  onChange?: (value: any, allValues?: any) => void;
}

export type DisplayMode = 'shortCard' | 'longCard' | 'table';

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  showTotal?: boolean;
  showJumper?: boolean;
  showPageSize?: boolean;
}

export interface DataManagerConfig<T = any> {
  // 显示模式
  displayMode?: DisplayMode;
  // 是否显示模式切换按钮
  showModeToggle?: boolean;
  // 列表项配置
  columns?: ColumnConfig[];
  // 短卡片配置
  shortCardConfig?: CardConfig;
  // 长卡片配置
  longCardConfig?: CardConfig;
  // 表格列配置
  tableColumns?: any[];
  // 自定义列表项渲染
  renderItem?: (item: T, index: number) => React.ReactNode;
  // 自定义短卡片渲染
  renderShortCard?: (item: T, index: number, actions: CardActions) => React.ReactNode;
  // 自定义长卡片渲染
  renderLongCard?: (item: T, index: number, actions: CardActions) => React.ReactNode;
  // 是否显示搜索表单
  showFilterForm?: boolean;
  // 搜索表单内容
  filterContent?: React.ReactNode;
  // 是否显示树
  showTree?: boolean;
  // 树内容
  treeContent?: React.ReactNode;
  // 树数据 (如果提供则自动渲染 Tree)
  treeData?: any[];
  // 树选中回调
  onTreeSelect?: (keys: string[]) => void;
  // 当前选中树节点
  selectedTreeKeys?: string[];
  // 树展开的节点
  expandedKeys?: string[];
  // 树展开回调
  onTreeExpand?: (keys: string[]) => void;
  // 是否显示树过滤
  showTreeFilter?: boolean;
  // 过滤表单回调
  onFilter?: (values: any) => void;
  // 重置搜索表单
  onReset?: () => void;
}

export interface ColumnConfig {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: any) => React.ReactNode;
}

export interface CardConfig {
  title?: string | ((item: any) => React.ReactNode);
  subtitle?: string | ((item: any) => React.ReactNode);
  description?: string | ((item: any) => React.ReactNode);
  image?: string | ((item: any) => string);
  imagePosition?: 'top' | 'left';
  imageHeight?: number;
  imageWidth?: number;
  showFields?: string[];
  hideFields?: string[];
  fieldLabel?: {
    [key: string]: string;
  };
}

export interface CardActions {
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  onView?: (record: any) => void;
  [key: string]: any;
}

export interface DataManagerProps<T = any> {
  // 数据
  data: T[];
  // 加载状态
  loading?: boolean;
  // 分页配置
  pagination: PaginationConfig;
  // 分页变化回调
  onPaginationChange?: (pagination: PaginationConfig) => void;
  // 行为配置
  actions?: {
    onAdd?: () => void;
    onEdit?: (record: T) => void;
    onDelete?: (record: T) => void;
    onView?: (record: T) => void;
    [key: string]: any;
  };
  // 显示器配置
  config?: DataManagerConfig<T>;
  // 是否显示操作按钮
  showActions?: boolean;
  // 操作按钮位置
  actionsPosition?: 'top' | 'bottom' | 'both';
  // 操作按钮内容自定义
  actionButtons?: React.ReactNode;
  // 表格行高度
  tableScrollHeight?: number;
  // 卡片列数（栅栏）
  cardColumns?: number;
  // 卡片间距
  cardGutter?: number;
  // 卡片尺寸
  cardSize?: 'small' | 'medium' | 'large';
}

export interface AddEditModalProps {
  visible: boolean;
  isEdit?: boolean;
  record?: any;
  loading?: boolean;
  onOk?: (values: any) => Promise<void> | void;
  onCancel?: () => void;
  title?: string;
  formConfig?: FormFieldConfig[];
  children?: React.ReactNode;
  tabs?: TabConfig[];
}

export interface TabConfig {
  key: string;
  title: string;
  content: React.ReactNode;
}

export interface DetailModalProps {
  visible: boolean;
  record?: any;
  loading?: boolean;
  onCancel?: () => void;
  title?: string;
  detailFields?: DetailFieldConfig[];
  children?: React.ReactNode;
  tabs?: TabConfig[];
}

export interface DetailFieldConfig {
  key: string;
  label: string;
  dataIndex: string;
  render?: (value: any, record: any) => React.ReactNode;
  span?: number;
  type?: 'text' | 'link' | 'tag' | 'avatar' | 'image';
}
