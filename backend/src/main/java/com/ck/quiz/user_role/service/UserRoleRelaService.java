package com.ck.quiz.user_role.service;

import com.ck.quiz.role.dto.RoleDto;

import java.util.List;

public interface UserRoleRelaService {

    List<RoleDto> getUserRoles(String id);

    List<RoleDto> replaceUserRoles(String id, List<String> roleIds);
}
