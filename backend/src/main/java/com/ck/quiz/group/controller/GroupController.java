package com.ck.quiz.group.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.group.dto.GroupCreateDto;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.dto.GroupUpdateDto;
import com.ck.quiz.group.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "分组管理", description = "分组相关的 API 接口")
@RestController
@RequestMapping("/api/group")
public class GroupController extends BaseController<GroupCreateDto, GroupUpdateDto, GroupQueryDto, GroupDto>  {

    @Autowired
    private GroupService groupService;

    @Operation(summary = "校验分组名称唯一性", description = "检查名称在系统中是否唯一（可排除指定ID）")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkName(
            @Parameter(description = "排除的分组ID") @RequestParam(value = "id", required = false) String id,
            @Parameter(description = "分组名称", required = true) @RequestParam(value = "name") String name) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(groupService.checkNameUniq(authentication.getName(), name, id));
    }

    @Override
    protected BaseService<GroupCreateDto, GroupUpdateDto, GroupQueryDto, GroupDto, ?> getService() {
        return groupService;
    }
}