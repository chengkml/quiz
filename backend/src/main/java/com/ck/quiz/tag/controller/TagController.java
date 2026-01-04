package com.ck.quiz.tag.controller;

import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import com.ck.quiz.tag.service.TagService;
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

@Tag(name = "标签管理", description = "标签相关的API接口")
@RestController
@RequestMapping("/api/tag")
public class TagController {

    @Autowired
    private TagService tagService;

    @Operation(summary = "创建标签", description = "创建新的标签")
    @PostMapping("/create")
    public ResponseEntity<TagDto> createTag(
            @Parameter(description = "标签创建信息", required = true) @Valid @RequestBody TagCreateDto tagCreateDto) {
        return ResponseEntity.ok(tagService.create(tagCreateDto));
    }

    @Operation(summary = "更新标签", description = "更新标签信息")
    @PutMapping("/update")
    public ResponseEntity<TagDto> updateTag(
            @Parameter(description = "标签更新信息", required = true) @Valid @RequestBody TagUpdateDto tagUpdateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.update(authentication.getName(), tagUpdateDto));
    }

    @Operation(summary = "删除标签", description = "删除指定标签")
    @DeleteMapping("/delete/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @Parameter(description = "标签ID", required = true) @PathVariable("tagId") String tagId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        tagService.delete(authentication.getName(), tagId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取标签详情", description = "根据标签ID获取标签详细信息")
    @GetMapping("/{tagId}")
    public ResponseEntity<TagDto> getTagById(
            @Parameter(description = "标签ID", required = true) @PathVariable("tagId") String tagId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.get(authentication.getName(), tagId));
    }

    @Operation(summary = "分页查询标签", description = "根据条件分页查询标签列表")
    @GetMapping("/search")
    public ResponseEntity<?> search(@Valid TagQueryDto queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.search(authentication.getName(), queryDto));
    }

    @Operation(summary = "获取指定用户的所有标签列表", description = "获取指定用户的所有标签的简单列表")
    @GetMapping("/list")
    public ResponseEntity<List<TagDto>> getAllUserTags() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.list(authentication.getName()));
    }

    @Operation(summary = "检查标签英文名", description = "检查标签英文名是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkTagName(
            @Parameter(description = "标签英文名", required = true) @RequestParam("tagName") String tagName,
            @Parameter(description = "排除的标签ID") @RequestParam(value = "excludeTagId", required = false) String excludeTagId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.checkNameUniq(authentication.getName(), tagName, excludeTagId));
    }
}
