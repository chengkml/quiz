package com.ck.quiz.prompt.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "提示词模板管理", description = "提示词模板管理相关API")
@RestController
@RequestMapping("/api/prompt-templates")
public class PromptTemplateController extends BaseController<PromptTemplateCreateDto, PromptTemplateUpdateDto, PromptTemplateQueryDto, PromptTemplateDto> {

    @Autowired
    private PromptTemplateService templateService;

    @Operation(summary = "检查模板名称", description = "检查模板名称是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkTemplateName(
            @Parameter(description = "模板名称", required = true) @RequestParam("name") String name,
            @Parameter(description = "排除的模板ID") @RequestParam(value = "excludeId", required = false) String excludeId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(templateService.checkNameUniq(authentication.getName(), name, excludeId));
    }

    @Override
    protected BaseService<PromptTemplateCreateDto, PromptTemplateUpdateDto, PromptTemplateQueryDto, PromptTemplateDto, ?> getService() {
        return templateService;
    }
}