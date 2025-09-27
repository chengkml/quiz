package com.ck.quiz.menu.dto;

import com.ck.quiz.menu.entity.Menu;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 菜单更新传输对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuUpdateDto {

    /**
     * 菜单ID（不可更新）
     */
    private String menuId;

    /**
     * 菜单名称（默认语言）
     */
    @Size(max = 128, message = "菜单名称长度不能超过128个字符")
    private String menuName;

    /**
     * 菜单标签
     */
    @Size(max = 128, message = "菜单标签长度不能超过128个字符")
    private String menuLabel;

    /**
     * 菜单类型：MENU, DIRECTORY, BUTTON
     */
    @NotBlank(message = "菜单类型不能为空")
    @Pattern(regexp = "^(MENU|DIRECTORY|BUTTON)$", message = "菜单类型必须为MENU、DIRECTORY或BUTTON")
    private Menu.MenuType menuType;

    /**
     * 父菜单ID
     */
    @Size(max = 32, message = "父菜单ID长度不能超过32个字符")
    private String parentId;

    /**
     * 前端路由地址或后端接口路径
     */
    @Size(max = 256, message = "URL长度不能超过256个字符")
    private String url;

    /**
     * 菜单图标
     */
    @Size(max = 128, message = "菜单图标长度不能超过128个字符")
    private String menuIcon;

    /**
     * 排序字段
     */
    @Min(value = 0, message = "排序号必须大于或等于0")
    private Integer seq;

    /**
     * 状态：ENABLED, DISABLED
     */
    @NotBlank(message = "菜单状态不能为空")
    @Pattern(regexp = "^(ENABLED|DISABLED)$", message = "状态必须为ENABLED或DISABLED")
    private Menu.MenuState state;

    /**
     * 菜单描述
     */
    @Size(max = 512, message = "菜单描述长度不能超过512个字符")
    private String menuDescr;


}