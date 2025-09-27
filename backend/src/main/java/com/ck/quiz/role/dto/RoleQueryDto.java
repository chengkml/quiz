package com.ck.quiz.role.dto;

import com.ck.quiz.role.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 角色查询DTO
 * 用于角色查询时接收查询条件
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleQueryDto {

    /**
     * 角色名称（模糊查询）
     */
    private String name;

    /**
     * 角色状态
     */
    private UserRole.RoleState state;

    /**
     * 页码（从0开始）
     */
    private Integer pageNum = 0;

    /**
     * 每页大小
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "createDate";

    /**
     * 排序方向：asc/desc
     */
    private String sortType = "desc";

}