package com.ck.quiz.menu.dto;

import com.ck.quiz.menu.entity.Menu;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 菜单信息传输对象（与 Menu 实体对应）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuDto {

    /**
     * 菜单ID
     */
    private String menuId;

    /**
     * 菜单名称（唯一业务标识）
     */
    private String menuName;

    /**
     * 菜单显示名称（前端展示用）
     */
    private String menuLabel;

    /**
     * 菜单类型：MENU, DIRECTORY, BUTTON
     */
    private Menu.MenuType menuType;

    /**
     * 父菜单ID
     */
    private String parentId;

    /**
     * 父菜单名称（可选）
     */
    private String parentName;

    /**
     * 菜单路由地址或按钮权限标识
     */
    private String url;

    /**
     * 菜单图标
     */
    private String menuIcon;

    /**
     * 排序号（数值越小越靠前）
     */
    private Integer seq;

    /**
     * 菜单状态：ENABLED / DISABLED
     */
    private Menu.MenuState state;

    /**
     * 菜单描述
     */
    private String menuDescr;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 最后更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 最后更新人
     */
    private String updateUser;

    /**
     * 子菜单列表（树形结构）
     */
    private List<MenuDto> children;
}
