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

    Object replaceUserRoles(String id, List<String> roleIds);
}
