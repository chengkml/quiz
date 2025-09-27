package com.ck.quiz.role.dto;

import com.ck.quiz.role.entity.UserRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 角色信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输角色详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleDto {

    /**
     * 角色唯一标识
     */
    private String id;

    /**
     * 角色名称
     */
    private String name;

    /**
     * 角色描述信息
     */
    private String descr;

    /**
     * 角色状态枚举，表示角色是否有效、禁用等
     */
    private UserRole.RoleState state;

    /**
     * 角色创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建该角色的用户ID
     */
    private String createUser;

    /**
     * 创建该角色的用户名
     */
    private String createUserName;

    /**
     * 角色最后更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 最后更新该角色的用户ID
     */
    private String updateUser;

    /**
     * 最后更新该角色的用户名
     */
    private String updateUserName;
}
