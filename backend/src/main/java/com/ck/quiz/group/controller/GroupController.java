package com.ck.quiz.group.controller;

import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "分组管理", description = "分组相关的 API 接口")
@RestController
@RequestMapping("/api/group")
public class GroupController {

    @Autowired
    private GroupService groupService;

    @Operation(summary = "创建分组", description = "创建一个新的分组")
    @PostMapping("/create")
    public ResponseEntity<GroupDto> create(
            @Parameter(description = "分组创建信息", required = true) @RequestBody @Valid GroupCreateDto dto) {
        return ResponseEntity.ok(groupService.create(dto));
    }

    @Operation(summary = "更新分组", description = "根据 ID 更新分组信息")
    @PutMapping("/update")
    public ResponseEntity<GroupDto> update(
            @Parameter(description = "分组更新信息", required = true) @RequestBody @Valid GroupUpdateDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.update(authentication.getName(), dto));
    }

    @Operation(summary = "删除分组", description = "根据 ID 删除分组")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "分组ID", required = true) @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        groupService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "根据 ID 获取分组", description = "根据分组 ID 获取分组详情")
    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> getById(
            @Parameter(description = "分组ID", required = true) @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.get(authentication.getName(), id));
    }

    @Operation(summary = "按用户列出分组", description = "根据可选的 userId 列出分组")
    @GetMapping("/list")
    public ResponseEntity<List<GroupDto>> listByUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.list(authentication.getName()));
    }

    @Operation(summary = "分页搜索分组", description = "根据查询条件分页搜索分组")
    @PostMapping("/search")
    public ResponseEntity<Page<GroupDto>> search(
            @Valid @RequestBody GroupQueryDto queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.search(authentication.getName(), queryDto));
    }

    @Operation(summary = "校验分组名称唯一性", description = "检查名称在系统中是否唯一（可排除指定ID）")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkName(
            @Parameter(description = "排除的分组ID") @RequestParam(value = "id", required = false) String id,
            @Parameter(description = "分组名称", required = true) @RequestParam(value = "name") String name) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.checkNameUniq(authentication.getName(), name, id));
    }

}