package com.ck.quiz.user_role.service;

import com.ck.quiz.role.dto.RoleDto;

import java.util.List;

public interface UserRoleRelaService {

    /**
     * 获取用户的所有角色
     *
     * @param id 用户ID
     * @return 角色列表
     */
    List<RoleDto> getUserRoles(String id);

    /**
     * 为用户分配角色
     *
     * @param id      用户ID
     * @param roleIds 角色ID列表
     * @return 是否成功
     */
    int assignRoles(String id, List<String> roleIds);

    /**
     * 移除用户角色
     *
     * @param id      用户ID
     * @param roleIds 角色ID列表
     * @return 是否成功
     */
    int revokeRole(String id, List<String> roleIds);

}
