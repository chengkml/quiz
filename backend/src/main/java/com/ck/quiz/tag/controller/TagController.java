package com.ck.quiz.tag.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.service.TagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "标签管理", description = "标签相关的API接口")
@RestController
@RequestMapping("/api/tag")
public class TagController extends BaseController<TagCreateDto, TagUpdateDto, TagQueryDto, TagDto> {

    @Autowired
    private TagService tagService;

    @Operation(summary = "检查标签英文名", description = "检查标签英文名是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkTagName(
            @Parameter(description = "标签英文名", required = true) @RequestParam("tagName") String tagName,
            @Parameter(description = "标签类型") @RequestParam(value = "type", required = false) String type,
            @Parameter(description = "排除的标签ID") @RequestParam(value = "excludeTagId", required = false) String excludeTagId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(tagService.checkNameUniq(authentication.getName(), tagName, type, excludeTagId));
    }

    @Override
    protected BaseService<TagCreateDto, TagUpdateDto, TagQueryDto, TagDto, ?> getService() {
        return tagService;
    }

}
