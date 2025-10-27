// 思维导图状态枚举
export enum MindMapStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

// 思维导图DTO
export interface MindMapDto {
  id: string;
  mapName: string;
  ownerId?: string;
  ownerName?: string;
  description?: string;
  mapData?: string;
  version?: number;
  isShared?: boolean;
  createDate?: string;
  createUser?: string;
  updateDate?: string;
  updateUser?: string;
}

// 思维导图创建DTO
export interface MindMapCreateDto {
  mapName: string;
  description?: string;
  mapData?: string;
  isShared?: boolean;
}

// 思维导图更新DTO
export interface MindMapUpdateDto {
  id: string;
  mapName: string;
  description?: string;
  mapData?: string;
  isShared?: boolean;
}

// 思维导图查询DTO
export interface MindMapQueryDto {
  mapName?: string;
  ownerId?: string;
  isShared?: boolean;
  pageNum?: number;
  pageSize?: number;
  sortColumn?: string;
  sortType?: string;
}

// 表单引用类型
export interface FormRef {
  current: {
    reset: () => void;
    submit: () => void;
    getFieldsValue: () => any;
    setFieldsValue: (values: any) => void;
  } | null;
}

// 分页配置类型
export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showTotal: boolean;
  showJumper: boolean;
  showPageSize: boolean;
}

// 思维导图数据结构
export interface MindMapData {
  nodeData: {
    id: string;
    topic: string;
    root?: boolean;
    [key: string]: any;
  };
  nodeChild: Array<{
    nodeData: {
      id: string;
      topic: string;
      [key: string]: any;
    };
    nodeChild: any[];
  }>;
}