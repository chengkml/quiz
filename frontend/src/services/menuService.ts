import axios from 'axios';
import {
  MenuDto,
  MenuTreeDto,
  MenuCreateDto,
  MenuUpdateDto,
  MenuQueryParams,
  RoleMenuRelaDto,
  PermissionCheckResult,
  BatchOperationResult,
  ExistenceCheckResult,
  ApiResponse
} from '../types/menu';

// 菜单服务类
class MenuService {
  private baseURL = '/data_synth/api/menu';

  // ==================== 基础CRUD操作 ====================

  /**
   * 创建菜单
   */
  async createMenu(menuData: MenuCreateDto): Promise<ApiResponse<MenuDto>> {
    const response = await axios.post(this.baseURL, menuData);
    return response.data;
  }

  /**
   * 根据ID获取菜单详情
   */
  async getMenuById(menuId: string): Promise<ApiResponse<MenuDto>> {
    const response = await axios.get(`${this.baseURL}/${menuId}`);
    return response.data;
  }

  /**
   * 根据名称获取菜单
   */
  async getMenuByName(menuName: string): Promise<ApiResponse<MenuDto>> {
    const response = await axios.get(`${this.baseURL}/name/${menuName}`);
    return response.data;
  }

  /**
   * 分页查询菜单
   */
  async getMenus(params?: MenuQueryParams): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(this.baseURL, { params });
    return response.data;
  }

  /**
   * 更新菜单
   */
  async updateMenu(menuId: string, menuData: MenuUpdateDto): Promise<ApiResponse<MenuDto>> {
    const response = await axios.post(`${this.baseURL}/${menuId}/update`, menuData);
    return response.data;
  }

  /**
   * 删除菜单
   */
  async deleteMenu(menuId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${menuId}`);
    return response.data;
  }

  /**
   * 批量删除菜单
   */
  async batchDeleteMenus(menuIds: string[]): Promise<ApiResponse<BatchOperationResult>> {
    const response = await axios.post(`${this.baseURL}/batch`, menuIds);
    return response.data;
  }

  /**
   * 启用菜单
   */
  async enableMenu(menuId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${menuId}/enable`);
    return response.data;
  }

  /**
   * 禁用菜单
   */
  async disableMenu(menuId: string): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/${menuId}/disable`);
    return response.data;
  }

  // ==================== 树形结构操作 ====================

  /**
   * 获取菜单树
   */
  async getMenuTree(): Promise<ApiResponse<MenuTreeDto[]>> {
    const response = await axios.get(`${this.baseURL}/tree`);
    return response.data;
  }

  /**
   * 获取根菜单
   */
  async getRootMenus(): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/root`);
    return response.data;
  }

  /**
   * 获取子菜单
   */
  async getChildMenus(parentId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/${parentId}/children`);
    return response.data;
  }

  /**
   * 获取所有子菜单（递归）
   */
  async getAllChildMenus(parentId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/${parentId}/all-children`);
    return response.data;
  }

  // ==================== 角色权限管理 ====================

  /**
   * 分配菜单权限给角色
   */
  async assignMenusToRole(roleId: string, menuIds: string[]): Promise<ApiResponse<BatchOperationResult>> {
    const response = await axios.post(`${this.baseURL}/role/${roleId}/assign`, menuIds);
    return response.data;
  }

  /**
   * 移除角色的菜单权限
   */
  async removeMenusFromRole(roleId: string, menuIds: string[]): Promise<ApiResponse<BatchOperationResult>> {
    const response = await axios.post(`${this.baseURL}/role/${roleId}/remove`, menuIds);
    return response.data;
  }

  /**
   * 替换角色的菜单权限
   */
  async replaceRoleMenus(roleId: string, menuIds: string[]): Promise<ApiResponse<void>> {
    const response = await axios.post(`${this.baseURL}/role/${roleId}/replace`, menuIds);
    return response.data;
  }

  /**
   * 获取角色的菜单列表
   */
  async getRoleMenus(roleId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/role/${roleId}`);
    return response.data;
  }

  /**
   * 获取角色的菜单树
   */
  async getRoleMenuTree(roleId: string): Promise<ApiResponse<MenuTreeDto[]>> {
    const response = await axios.get(`${this.baseURL}/role/${roleId}/tree`);
    return response.data;
  }

  /**
   * 获取菜单关联的角色
   */
  async getMenuRoles(menuId: string): Promise<ApiResponse<RoleMenuRelaDto[]>> {
    const response = await axios.get(`${this.baseURL}/${menuId}/roles`);
    return response.data;
  }

  // ==================== 用户权限管理 ====================

  /**
   * 获取用户的菜单列表
   */
  async getUserMenus(userId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/user/${userId}`);
    return response.data;
  }

  /**
   * 获取用户的菜单树
   */
  async getUserMenuTree(userId: string): Promise<ApiResponse<MenuTreeDto[]>> {
    const response = await axios.get(`${this.baseURL}/user/${userId}/tree`);
    return response.data;
  }

  /**
   * 检查用户菜单权限
   */
  async checkUserMenuPermission(userId: string, menuId: string): Promise<ApiResponse<PermissionCheckResult>> {
    const response = await axios.get(`${this.baseURL}/user/${userId}/permission/${menuId}`);
    return response.data;
  }

  /**
   * 检查用户URL权限
   */
  async checkUserUrlPermission(userId: string, url: string): Promise<ApiResponse<PermissionCheckResult>> {
    const response = await axios.get(`${this.baseURL}/user/${userId}/url-permission`, {
      params: { url }
    });
    return response.data;
  }

  /**
   * 批量检查用户权限
   */
  async batchCheckUserPermissions(userId: string, menuIds: string[]): Promise<ApiResponse<Record<string, boolean>>> {
    const response = await axios.post(`${this.baseURL}/user/${userId}/batch-permission`, menuIds);
    return response.data;
  }

  // ==================== 按钮级权限 ====================

  /**
   * 获取菜单下的按钮
   */
  async getMenuButtons(parentMenuId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/${parentMenuId}/buttons`);
    return response.data;
  }

  /**
   * 获取用户在菜单下的按钮权限
   */
  async getUserMenuButtons(userId: string, parentMenuId: string): Promise<ApiResponse<MenuDto[]>> {
    const response = await axios.get(`${this.baseURL}/user/${userId}/menu/${parentMenuId}/buttons`);
    return response.data;
  }

  // ==================== 校验接口 ====================

  /**
   * 检查菜单ID是否存在
   */
  async checkMenuIdExists(menuId: string): Promise<ApiResponse<ExistenceCheckResult>> {
    const response = await axios.get(`${this.baseURL}/check/id/${menuId}`);
    return response.data;
  }

  /**
   * 检查菜单名称是否存在
   */
  async checkMenuNameExists(menuName: string): Promise<ApiResponse<ExistenceCheckResult>> {
    const response = await axios.get(`${this.baseURL}/check/name/${menuName}`);
    return response.data;
  }

  // ==================== 批量更新（前端实现） ====================

  /**
   * 批量更新菜单（前端遍历调用单个更新接口）
   */
  async batchUpdateMenus(updates: Array<{ menuId: string; data: MenuUpdateDto }>): Promise<{
    success: boolean;
    results: Array<{ menuId: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ menuId: string; success: boolean; error?: string }> = [];
    let successCount = 0;

    for (const update of updates) {
      try {
        await this.updateMenu(update.menuId, update.data);
        results.push({ menuId: update.menuId, success: true });
        successCount++;
      } catch (error: any) {
        results.push({
          menuId: update.menuId,
          success: false,
          error: error.message || '更新失败'
        });
      }
    }

    return {
      success: successCount === updates.length,
      results
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 构建菜单树（前端工具方法）
   */
  buildMenuTree(menus: MenuDto[]): MenuTreeDto[] {
    const menuMap = new Map<string, MenuTreeDto>();
    const rootMenus: MenuTreeDto[] = [];

    // 创建菜单映射
    menus.forEach(menu => {
      menuMap.set(menu.menuId, {
        ...menu,
        children: [],
        level: 0,
        expanded: false,
        selected: false
      });
    });

    // 构建树形结构
    menus.forEach(menu => {
      const menuNode = menuMap.get(menu.menuId)!;
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(menuNode);
        menuNode.level = (parent.level || 0) + 1;
      } else {
        rootMenus.push(menuNode);
      }
    });

    // 排序
    const sortMenus = (menus: MenuTreeDto[]) => {
      menus.sort((a, b) => a.seq - b.seq);
      menus.forEach(menu => {
        if (menu.children && menu.children.length > 0) {
          sortMenus(menu.children);
        }
      });
    };

    sortMenus(rootMenus);
    return rootMenus;
  }

  /**
   * 扁平化菜单树
   */
  flattenMenuTree(tree: MenuTreeDto[]): MenuDto[] {
    const result: MenuDto[] = [];
    
    const traverse = (nodes: MenuTreeDto[]) => {
      nodes.forEach(node => {
        const { children, level, expanded, selected, ...menuData } = node;
        result.push(menuData);
        if (children && children.length > 0) {
          traverse(children);
        }
      });
    };

    traverse(tree);
    return result;
  }

  /**
   * 查找菜单节点
   */
  findMenuNode(tree: MenuTreeDto[], menuId: string): MenuTreeDto | null {
    for (const node of tree) {
      if (node.menuId === menuId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = this.findMenuNode(node.children, menuId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * 获取菜单路径
   */
  getMenuPath(tree: MenuTreeDto[], menuId: string): MenuTreeDto[] {
    const path: MenuTreeDto[] = [];
    
    const findPath = (nodes: MenuTreeDto[], targetId: string): boolean => {
      for (const node of nodes) {
        path.push(node);
        if (node.menuId === targetId) {
          return true;
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId)) {
            return true;
          }
        }
        path.pop();
      }
      return false;
    };

    findPath(tree, menuId);
    return path;
  }
}

// 导出单例
export const menuService = new MenuService();
export default menuService;