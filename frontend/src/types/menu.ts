// 菜单类型定义

// 菜单类型枚举
export enum MenuType {
  DIRECTORY = 'DIRECTORY', // 目录
  MENU = 'MENU',           // 菜单
  BUTTON = 'BUTTON'        // 按钮
}

// 基础菜单DTO
export interface MenuDto {
  menuName: string;         // 菜单ID
  menuLabel: string;        // 菜单名称
  menuType: MenuType;       // 菜单类型
  parentId?: string;        // 父菜单ID
  icon?: string;            // 图标
  seq: number;              // 排序
  state: string;       // 状态
  visible: boolean;         // 是否可见
  keepAlive: boolean;       // 是否缓存
  menuExtConf?: string; // 菜单扩展配置
  menuDescr?: string;          // 备注
  createTime: string;       // 创建时间
  updateTime: string;       // 更新时间
  createBy?: string;        // 创建人
  updateBy?: string;        // 更新人
}

// 菜单树形结构DTO
export interface MenuTreeDto extends MenuDto {
  children?: MenuTreeDto[]; // 子菜单
  level?: number;           // 层级（前端计算）
  expanded?: boolean;       // 是否展开（前端状态）
}

// 创建菜单DTO
export interface MenuCreateDto {
  menuId: string;         // 菜单ID
  menuName: string;         // 菜单英文名
  menuLabel: string;        // 菜单名称
  menuType: MenuType;       // 菜单类型
  parentId?: string;        // 父菜单ID
  icon?: string;            // 图标
  seq: number;              // 排序
  visible: boolean;         // 是否可见
  keepAlive: boolean;       // 是否缓存
  menuExtConf?: string;     // 菜单扩展配置（JSON字符串）
  menuDescr?: string;          // 备注
}

// 更新菜单DTO
export interface MenuUpdateDto {
  menuName?: string;        // 菜单ID（用于批量更新）
  menuLabel?: string;       // 菜单名称
  menuType?: MenuType;      // 菜单类型
  parentId?: string;        // 父菜单ID
  icon?: string;            // 图标
  seq?: number;             // 排序
  visible?: boolean;        // 是否可见
  keepAlive?: boolean;      // 是否缓存
  menuExtConf?: string;     // 菜单扩展配置（JSON字符串）
  menuDescr?: string;          // 备注
}

// 角色菜单关联DTO
export interface RoleMenuRelaDto {
  id: string;               // 关联ID
  roleId: string;           // 角色ID
  menuName: string;         // 菜单ID
  roleName?: string;        // 角色名称（关联查询）
  menuLabel?: string;       // 菜单名称（关联查询）
  createTime: string;       // 创建时间
}

// 菜单查询参数
export interface MenuQueryParams {
  menuLabel?: string;       // 菜单名称（模糊查询）
  menuType?: MenuType;      // 菜单类型
  parentId?: string;        // 父菜单ID
  state?: string;      // 状态
  visible?: boolean;        // 是否可见
  page?: number;            // 页码
  size?: number;            // 页大小
}

// 权限检查结果
export interface PermissionCheckResult {
  hasPermission: boolean;   // 是否有权限
  menuName?: string;        // 菜单ID
  url?: string;             // URL
}

// 批量操作结果
export interface BatchOperationResult {
  assignedCount?: number;   // 分配数量
  removedCount?: number;    // 移除数量
  deletedCount?: number;    // 删除数量
  totalCount: number;       // 总数量
}

// 存在性检查结果
export interface ExistenceCheckResult {
  exists: boolean;          // 是否存在
  menuName?: string;        // 菜单ID
  menuLabel?: string;       // 菜单名称
}

// API响应基础结构
export interface ApiResponse<T = any> {
  success: boolean;         // 是否成功
  message: string;          // 消息
  data?: T;                 // 数据
  totalElements?: number;   // 总元素数（分页）
  totalPages?: number;      // 总页数（分页）
  currentPage?: number;     // 当前页（分页）
  pageSize?: number;        // 页大小（分页）
}

// 菜单表单数据
export interface MenuFormData extends Omit<MenuCreateDto, 'seq'> {
  seq?: number;             // 排序（可选，自动计算）
}

// 拖拽节点数据
export interface DragNodeData {
  menuName: string;         // 菜单ID
  parentId?: string;        // 新父菜单ID
  seq: number;              // 新排序
  oldParentId?: string;     // 原父菜单ID
  oldSeq: number;           // 原排序
}

// 菜单树操作类型
export enum TreeActionType {
  EXPAND = 'expand',        // 展开
  COLLAPSE = 'collapse',    // 折叠
  DRAG = 'drag',            // 拖拽
  DROP = 'drop',            // 放置
  CREATE_CHILD = 'create_child', // 创建子菜单
  CREATE_ROOT = 'create_root',   // 创建根菜单
  REFRESH = 'refresh',      // 刷新
  DRAG_SORT = 'drag_sort'   // 拖拽排序
}

// 菜单树操作事件
export interface TreeActionEvent {
  type: TreeActionType;     // 操作类型
  node: MenuTreeDto;        // 操作节点
  targetNode?: MenuTreeDto; // 目标节点（拖拽时）
  position?: 'before' | 'after' | 'inside'; // 放置位置（拖拽时）
}