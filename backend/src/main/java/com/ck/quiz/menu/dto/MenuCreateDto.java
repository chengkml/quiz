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
 * 菜单创建传输对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuCreateDto {

    /**
     * 菜单ID（一般由后端生成，如果前端传则校验）
     */
    @Size(max = 32, message = "菜单ID长度不能超过32个字符")
    private String menuId;

    /**
     * 菜单名称（唯一业务标识）
     */
    @NotBlank(message = "菜单名称不能为空")
    @Size(max = 128, message = "菜单名称长度不能超过128个字符")
    private String menuName;

    /**
     * 菜单显示名称（前端展示用）
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
     * 菜单路由地址或按钮权限标识
     */
    @Size(max = 256, message = "URL长度不能超过256个字符")
    private String url;

    /**
     * 菜单图标
     */
    @Size(max = 128, message = "菜单图标长度不能超过128个字符")
    private String menuIcon;

    /**
     * 排序号（数值越小越靠前）
     */
    @Min(value = 0, message = "排序号必须大于或等于0")
    private Integer seq;

    /**
     * 菜单描述
     */
    @Size(max = 512, message = "菜单描述长度不能超过512个字符")
    private String menuDescr;
}
