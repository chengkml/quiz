package com.ck.quiz.role_menu.service;

import com.ck.quiz.menu.dto.MenuDto;

import java.util.List;

/**
 * 角色-菜单关系业务接口
 * <p>
 * 功能：
 * 1. 管理角色与菜单的绑定关系（新增 / 替换 / 删除）
 * 2. 根据角色或用户查询其所拥有的菜单权限
 * 3. 支持返回菜单的平铺列表或树形结构
 */
public interface RoleMenuService {

    /**
     * 替换角色的菜单权限
     * <p>
     * 实现逻辑：
     * 1. 先删除该角色已有的所有菜单绑定关系
     * 2. 再新增传入的菜单绑定记录
     *
     * @param roleId  角色ID
     * @param menuIds 新的菜单ID集合
     * @return 插入的记录数（菜单绑定数量）
     */
    int replaceRoleMenus(String roleId, List<String> menuIds);

    /**
     * 获取角色的菜单权限树（树形结构）
     * <p>
     * 常用于前端菜单渲染（目录 → 菜单 → 按钮）。
     *
     * @param roleId 角色ID
     * @return 菜单树DTO列表
     */
    List<MenuDto> getMenuTreeByRoleId(String roleId);

    /**
     * 获取用户的菜单权限树（树形结构）
     * <p>
     * 查询逻辑通常是：
     * 用户 → 角色 → 菜单
     * 最终汇总用户拥有的所有菜单并构建树形结构。
     *
     * @param userId 用户ID
     * @return 菜单树DTO列表
     */
    List<MenuDto> getMenuTreeByUserId(String userId);

}
