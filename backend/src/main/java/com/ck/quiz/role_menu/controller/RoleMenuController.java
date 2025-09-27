package com.ck.quiz.role_menu.controller;

import com.ck.quiz.role_menu.service.RoleMenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "角色菜单关联", description = "角色菜单关联管理相关接口")
@RestController
@RequestMapping("/api/role/menu/rela")
public class RoleMenuController {

    @Autowired
    private RoleMenuService roleMenuService;

    @Operation(summary = "替换菜单权限", description = "替换指定角色的所有菜单权限")
    @PostMapping("/{roleId}/replace")
    public ResponseEntity replaceRoleMenus(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId,
            @Parameter(description = "菜单ID列表", required = true) @RequestBody List<String> menuIds) {
        return ResponseEntity.ok(roleMenuService.replaceRoleMenus(roleId, menuIds));
    }

    @Operation(summary = "获取角色菜单权限", description = "获取指定角色的菜单权限列表")
    @GetMapping("/role/{roleId}")
    public ResponseEntity getMenusByRoleId(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleMenuService.getMenusByRoleId(roleId));
    }

    @Operation(summary = "获取角色菜单权限树", description = "获取指定角色的菜单权限树形结构")
    @GetMapping("/role/{roleId}/tree")
    public ResponseEntity getMenuTreeByRoleId(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleMenuService.getMenuTreeByRoleId(roleId));
    }

    @Operation(summary = "获取用户菜单权限树", description = "获取指定用户的菜单权限树形结构")
    @GetMapping("/user/{userId}/tree")
    public ResponseEntity getMenuTreeByUserId(
            @Parameter(description = "用户ID", required = true) @PathVariable String userId) {
        return ResponseEntity.ok(roleMenuService.getMenuTreeByUserId(userId));
    }
}
