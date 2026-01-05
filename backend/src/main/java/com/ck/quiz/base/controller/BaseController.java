package com.ck.quiz.base.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.service.BaseService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;

public abstract class BaseController<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto> {

    protected abstract BaseService<C, U, Q, D, ?> getService();

    @Operation(summary = "创建", description = "创建对象")
    @PostMapping("create")
    public ResponseEntity<D> create(
            @Parameter(description = "对象创建信息", required = true) @RequestBody @Valid C createDto) {
        return ResponseEntity.ok(getService().create(createDto));
    }

    @Operation(summary = "更新", description = "更新对象信息")
    @PutMapping("/update")
    public ResponseEntity<D> update(
            @Parameter(description = "对象更新信息", required = true) @RequestBody @Valid U updateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(getService().update(authentication.getName(), updateDto));
    }

    @Operation(summary = "删除", description = "删除指定对象")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "对象ID", required = true) @PathVariable(value = "id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        getService().delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取对象详情", description = "根据对象ID获取对象详细信息")
    @GetMapping("/get/{id}")
    public ResponseEntity<D> get(
            @Parameter(description = "对象ID", required = true) @PathVariable(value = "id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(getService().get(authentication.getName(), id));
    }

    @Operation(summary = "分页查询对象", description = "根据条件分页查询对象列表")
    @PostMapping("/search")
    public ResponseEntity<Page<D>> search(
            @Parameter(description = "查询条件", required = true) @RequestBody @Valid Q queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(getService().search(authentication.getName(), queryDto));
    }

    @Operation(summary = "获取指定用户的所有对象列表", description = "获取指定用户的所有对象的简单列表")
    @GetMapping("/list")
    public ResponseEntity<List<D>> list() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(getService().list(authentication.getName()));
    }
}
