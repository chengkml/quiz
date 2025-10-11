// 菜单类型定义

// 菜单类型枚举
export enum MenuType {
  DIRECTORY = 'DIRECTORY', // 目录
  MENU = 'MENU',           // 菜单
  BUTTON = 'BUTTON'        // 按钮
}

// 基础菜单DTO（与后端MenuDto保持一致）
export interface MenuDto {
  menuId: string;           // 菜单ID
  menuName: string;         // 菜单名称（唯一业务标识）
  menuLabel: string;        // 菜单显示名称（前端展示用）
  menuType: MenuType;       // 菜单类型
  parentId?: string;        // 父菜单ID
  parentName?: string;      // 父菜单名称（可选）
  url?: string;             // 菜单路由地址或按钮权限标识
  menuIcon?: string;        // 菜单图标
  seq: number;              // 排序号（数值越小越靠前）
  state: string;            // 菜单状态：ENABLED / DISABLED
  menuDescr?: string;       // 菜单描述
  createDate?: string;      // 创建时间
  createUser?: string;      // 创建人
  updateDate?: string;      // 最后更新时间
  updateUser?: string;      // 最后更新人
  children?: MenuDto[];     // 子菜单列表（树形结构）
}

// 菜单树形结构DTO
export interface MenuTreeDto extends MenuDto {
  children?: MenuTreeDto[]; // 子菜单
  level?: number;           // 层级（前端计算）
  expanded?: boolean;       // 是否展开（前端状态）
}

// 创建菜单DTO（与后端MenuCreateDto保持一致）
export interface MenuCreateDto {
  menuId?: string;          // 菜单ID（一般由后端生成）
  menuName: string;         // 菜单名称（唯一业务标识）
  menuLabel?: string;       // 菜单显示名称（前端展示用）
  menuType: MenuType;       // 菜单类型
  parentId?: string;        // 父菜单ID
  url?: string;             // 菜单路由地址或按钮权限标识
  menuIcon?: string;        // 菜单图标
  seq?: number;             // 排序号（数值越小越靠前）
  state?: string;           // 菜单状态：ENABLED / DISABLED
  menuDescr?: string;       // 菜单描述
}

// 更新菜单DTO（与后端MenuUpdateDto保持一致）
export interface MenuUpdateDto {
  menuId?: string;          // 菜单ID
  menuName?: string;        // 菜单名称（唯一业务标识）
  menuLabel?: string;       // 菜单显示名称（前端展示用）
  menuType?: MenuType;      // 菜单类型
  parentId?: string;        // 父菜单ID
  url?: string;             // 菜单路由地址或按钮权限标识
  menuIcon?: string;        // 菜单图标
  seq?: number;             // 排序号（数值越小越靠前）
  state?: string;           // 菜单状态：ENABLED / DISABLED
  menuDescr?: string;       // 菜单描述
}

// 角色菜单关联DTO（与后端RoleMenuRelaDto保持一致）
export interface RoleMenuRelaDto {
  id: string;               // 关联ID
  roleId: string;           // 角色ID
  menuId: string;           // 菜单ID
  roleName?: string;        // 角色名称（关联查询）
  menuName?: string;        // 菜单名称（关联查询）
  createDate?: string;      // 创建时间
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