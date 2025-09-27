package com.ck.quiz.role.controller;

import com.ck.quiz.role.dto.RoleCreateDto;
import com.ck.quiz.role.dto.RoleQueryDto;
import com.ck.quiz.role.dto.RoleUpdateDto;
import com.ck.quiz.role.entity.UserRole;
import com.ck.quiz.role.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "角色管理", description = "角色相关的API接口")
@RestController
@RequestMapping("/api/role")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @Operation(summary = "创建角色", description = "创建新的角色")
    @PostMapping("/create")
    public ResponseEntity createRole(
            @Parameter(description = "角色创建信息", required = true) @Valid @RequestBody RoleCreateDto roleCreateDto) {
        return ResponseEntity.ok(roleService.createRole(roleCreateDto));
    }

    @Operation(summary = "更新角色", description = "更新角色信息")
    @PutMapping("/update")
    public ResponseEntity updateRole(
            @Parameter(description = "角色更新信息", required = true) @Valid @RequestBody RoleUpdateDto roleUpdateDto) {
        return ResponseEntity.ok(roleService.updateRole(roleUpdateDto));
    }

    @Operation(summary = "删除角色", description = "删除指定角色")
    @DeleteMapping("/delete/{roleId}")
    public ResponseEntity deleteRole(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleService.deleteRole(roleId));
    }

    @Operation(summary = "获取角色详情", description = "根据角色ID获取角色详细信息")
    @GetMapping("/{roleId}")
    public ResponseEntity getRoleById(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleService.getRoleById(roleId));
    }

    @Operation(summary = "根据名称获取角色", description = "根据角色名称获取角色详细信息")
    @GetMapping("/name/{roleName}")
    public ResponseEntity getRoleByName(
            @Parameter(description = "角色名称", required = true) @PathVariable String roleName) {
        return ResponseEntity.ok(roleService.getRoleByName(roleName));
    }

    @Operation(summary = "分页查询角色", description = "根据条件分页查询角色列表")
    @GetMapping
    public ResponseEntity getRoles(
            @Parameter(description = "角色名称") @RequestParam(required = false) String roleName,
            @Parameter(description = "角色状态") @RequestParam(required = false) UserRole.RoleState state,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortBy,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortDir) {
        RoleQueryDto queryDto = new RoleQueryDto();
        queryDto.setName(roleName);
        queryDto.setState(state);
        queryDto.setPageNum(page);
        queryDto.setPageSize(size);
        queryDto.setSortColumn(sortBy);
        queryDto.setSortType(sortDir);
        return ResponseEntity.ok(roleService.searchRoles(queryDto));
    }

    @Operation(summary = "获取启用角色列表", description = "获取所有启用状态的角色列表")
    @GetMapping("/list/active")
    public ResponseEntity getActiveRoles() {
        return ResponseEntity.ok(roleService.getActiveRoles());
    }

    @Operation(summary = "启用角色", description = "启用指定角色")
    @PostMapping("/{roleId}/enable")
    public ResponseEntity enableRole(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleService.enableRole(roleId));
    }

    @Operation(summary = "禁用角色", description = "禁用指定角色")
    @PostMapping("/{roleId}/disable")
    public ResponseEntity disableRole(
            @Parameter(description = "角色ID", required = true) @PathVariable String roleId) {
        return ResponseEntity.ok(roleService.disableRole(roleId));
    }

    @Operation(summary = "检查角色名称", description = "检查角色名称是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity checkRoleName(
            @Parameter(description = "角色名称", required = true) @RequestParam String roleName,
            @Parameter(description = "排除的角色ID") @RequestParam(required = false) String excludeRoleId) {
        return ResponseEntity.ok(roleService.isRoleNameExists(roleName, excludeRoleId));
    }
}
