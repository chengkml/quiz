package com.ck.quiz.user_role.controller;

import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.user_role.service.UserRoleRelaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户角色关联管理控制器
 */
@Tag(name = "用户角色关联管理", description = "提供用户与角色之间的绑定、解绑和查询等接口")
@RestController
@RequestMapping("/api/user/role/rela")
public class UserRoleController {

    @Autowired
    private UserRoleRelaService userRoleRelaService;

    /**
     * 获取用户已分配的角色
     */
    @Operation(
            summary = "获取用户角色",
            description = "根据用户ID查询其已分配的角色列表"
    )
    @GetMapping("/{id}/roles")
    public ResponseEntity<List<RoleDto>> getUserRoles(
            @Parameter(description = "用户ID", required = true, example = "admin")
            @PathVariable String id) {
        return ResponseEntity.ok(userRoleRelaService.getUserRoles(id));
    }

    /**
     * 为用户分配角色
     */
    @Operation(
            summary = "分配用户角色",
            description = "为指定用户分配一个或多个角色ID"
    )
    @PostMapping("/{id}/assign/roles")
    public ResponseEntity<?> assignRoles(
            @Parameter(description = "用户ID", required = true, example = "admin")
            @PathVariable String id,
            @RequestBody(
                    description = "角色ID列表",
                    required = true,
                    content = @Content(schema = @Schema(implementation = List.class, example = "[\"roleId1\", \"roleId2\"]"))
            )
            @org.springframework.web.bind.annotation.RequestBody List<String> roleIds) {
        return ResponseEntity.ok(userRoleRelaService.assignRoles(id, roleIds));
    }

    /**
     * 撤销用户角色
     */
    @Operation(
            summary = "撤销用户角色",
            description = "撤销指定用户的一个或多个角色"
    )
    @DeleteMapping("/{id}/revoke/roles")
    public ResponseEntity<?> revokeRole(
            @Parameter(description = "用户ID", required = true, example = "admin")
            @PathVariable String id,
            @RequestBody(
                    description = "待撤销的角色ID列表",
                    required = true,
                    content = @Content(schema = @Schema(implementation = List.class, example = "[\"roleId1\"]"))
            )
            @org.springframework.web.bind.annotation.RequestBody List<String> roleIds) {
        return ResponseEntity.ok(userRoleRelaService.revokeRole(id, roleIds));
    }
}
