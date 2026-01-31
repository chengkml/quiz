package com.ck.quiz.role.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.entity.UserRole;

public interface RoleService extends BaseService<RoleCreateDto, RoleUpdateDto, RoleQueryDto, RoleDto, UserRole> {

    boolean checkNameUniq(String userId, String name, String excludeId);

    boolean checkIdUniq(String userId, String id);

    RoleDto enableRole(String id);

    RoleDto disableRole(String id);

    java.util.List<RoleDto> listActiveRoles();

}
