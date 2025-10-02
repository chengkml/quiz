package com.ck.quiz.user_role.controller;

import com.ck.quiz.role.dto.RoleDto;
import com.ck.quiz.user_role.service.UserRoleRelaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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

    @Operation(summary = "替换用户角色", description = "替换指定用户的所有角色")
    @PostMapping("/{id}/replace")
    public ResponseEntity replaceUserRoles(
            @Parameter(description = "用户ID", required = true) @PathVariable String id,
            @Parameter(description = "角色ID列表", required = true) @RequestBody List<String> roleIds) {
        return ResponseEntity.ok(userRoleRelaService.replaceUserRoles(id, roleIds));
    }

}
