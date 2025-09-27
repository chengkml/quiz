package com.ck.quiz.menu.dto;

import com.ck.quiz.menu.entity.Menu;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 菜单查询 DTO
 * 用于接收前端传来的菜单查询条件，支持分页和排序
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuQueryDto {

    /**
     * 菜单名称，支持模糊查询
     */
    private String menuName;

    /**
     * 菜单类型，例如 MENU, DIRECTORY, BUTTON
     */
    private Menu.MenuType menuType;

    /**
     * 父菜单ID，用于查询指定父菜单下的子菜单
     */
    private String parentId;

    /**
     * 菜单状态，例如 ENABLED 或 DISABLED
     */
    private Menu.MenuState state;

    /**
     * 当前页码，从0开始
     */
    private int pageNum;

    /**
     * 每页显示条数
     */
    private int pageSize;

    /**
     * 排序字段
     */
    private String sortColumn;

    /**
     * 排序方式，asc 或 desc
     */
    private String sortType;
}
