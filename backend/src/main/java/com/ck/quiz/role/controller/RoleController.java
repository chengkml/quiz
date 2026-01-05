package com.ck.quiz.role.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "角色管理", description = "角色相关的API接口")
@RestController
@RequestMapping("/api/role")
public class RoleController extends BaseController<RoleCreateDto, RoleUpdateDto, RoleQueryDto, RoleDto> {

    @Autowired
    private RoleService roleService;

    @Operation(summary = "检查角色名称", description = "检查角色名称是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkRoleName(
            @Parameter(description = "角色名称", required = true) @RequestParam("name") String name,
            @Parameter(description = "排除的角色ID") @RequestParam(value = "excludeId", required = false) String excludeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(roleService.checkNameUniq(authentication.getName(), name, excludeId));
    }

    @Override
    protected BaseService<RoleCreateDto, RoleUpdateDto, RoleQueryDto, RoleDto, ?> getService() {
        return roleService;
    }
}
