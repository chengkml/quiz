package com.ck.quiz.role.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.role.entity.UserRole;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RoleDto extends Dto {

    private String name;

    private String descr;

    private UserRole.RoleState state;
}
