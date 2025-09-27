package com.ck.quiz.menu.service;

import com.ck.quiz.menu.dto.*;
import com.ck.quiz.menu.entity.Menu;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 菜单管理服务接口
 */
public interface MenuService {

    /**
     * 创建菜单
     *
     * @param menuCreateDto 菜单创建信息
     * @return 创建的菜单信息
     */
    MenuDto createMenu(MenuCreateDto menuCreateDto);

    /**
     * 根据菜单ID获取菜单信息
     *
     * @param menuId 菜单ID
     * @return 菜单信息
     */
    MenuDto getMenuById(String menuId);

    /**
     * 根据菜单名称获取菜单信息
     *
     * @param menuName 菜单名称
     * @return 菜单信息
     */
    MenuDto getMenuByName(String menuName);

    /**
     * 更新菜单信息
     *
     * @param menuUpdateDto 菜单更新信息
     * @return 更新后的菜单信息
     */
    MenuDto updateMenu(MenuUpdateDto menuUpdateDto);

    /**
     * 删除菜单
     *
     * @param menuId 菜单ID
     * @return 是否删除成功
     */
    boolean deleteMenu(String menuId);

    /**
     * 启用菜单
     *
     * @param menuId 菜单ID
     * @return 是否启用成功
     */
    boolean enableMenu(String menuId);

    /**
     * 禁用菜单
     *
     * @param menuId 菜单ID
     * @return 是否禁用成功
     */
    boolean disableMenu(String menuId);

    /**
     * 分页查询菜单
     *
     * @return 分页菜单列表
     */
    Page<MenuDto> searchMenus(MenuQueryDto menuQueryDto);

    /**
     * 获取完整菜单树
     *
     * @return 菜单树列表
     */
    List<MenuDto> getMenuTree();

    /**
     * 将ModoMenu实体转换为MenuDto
     */
    MenuDto convertToMenuDto(Menu menu);

    /**
     * 构建菜单树
     */
    List<MenuDto> buildMenuTree(List<Menu> menus);

}