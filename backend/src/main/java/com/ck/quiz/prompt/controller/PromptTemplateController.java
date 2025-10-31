package com.ck.quiz.prompt.controller;

import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 提示词模板管理控制器
 * 提供提示词模板相关的REST API接口
 */
@RestController
@RequestMapping("/api/prompt-templates")
@RequiredArgsConstructor
@Tag(name = "提示词模板管理", description = "提示词模板管理相关API")
public class PromptTemplateController {

    private final PromptTemplateService promptTemplateService;

    /**
     * 创建新提示词模板
     *
     * @param createDto 提示词模板创建信息
     * @return 创建的提示词模板信息
     */
    @PostMapping
    @Operation(summary = "创建提示词模板", description = "创建一个新的提示词模板")
    public ResponseEntity<PromptTemplateDto> createPromptTemplate(
            @Valid @RequestBody PromptTemplateCreateDto createDto) {
        PromptTemplateDto template = promptTemplateService.createPromptTemplate(createDto);
        return ResponseEntity.ok(template);
    }

    /**
     * 更新提示词模板信息
     *
     * @param updateDto 提示词模板更新信息
     * @return 更新后的提示词模板信息
     */
    @PutMapping
    @Operation(summary = "更新提示词模板", description = "更新现有提示词模板的信息")
    public ResponseEntity<PromptTemplateDto> updatePromptTemplate(
            @Valid @RequestBody PromptTemplateUpdateDto updateDto) {
        PromptTemplateDto template = promptTemplateService.updatePromptTemplate(updateDto);
        return ResponseEntity.ok(template);
    }

    /**
     * 删除提示词模板
     *
     * @param id 提示词模板ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除提示词模板", description = "根据ID删除提示词模板")
    public ResponseEntity<Void> deletePromptTemplate(
            @Parameter(description = "提示词模板ID") @PathVariable Long id) {
        promptTemplateService.deletePromptTemplate(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 根据ID获取提示词模板信息
     *
     * @param id 提示词模板ID
     * @return 提示词模板信息
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取提示词模板详情", description = "根据ID获取提示词模板详细信息")
    public ResponseEntity<PromptTemplateDto> getPromptTemplateById(
            @Parameter(description = "提示词模板ID") @PathVariable Long id) {
        PromptTemplateDto template = promptTemplateService.getPromptTemplateById(id);
        return ResponseEntity.ok(template);
    }

    /**
     * 根据名称获取提示词模板信息
     *
     * @param name 提示词模板名称
     * @return 提示词模板信息
     */
    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取提示词模板", description = "根据提示词模板名称获取模板信息")
    public ResponseEntity<PromptTemplateDto> getPromptTemplateByName(
            @Parameter(description = "提示词模板名称") @PathVariable String name) {
        PromptTemplateDto template = promptTemplateService.getPromptTemplateByName(name);
        return ResponseEntity.ok(template);
    }

    /**
     * 分页查询提示词模板
     *
     * @param queryDto 查询条件
     * @return 分页提示词模板列表
     */
    @GetMapping("/search")
    @Operation(summary = "分页查询提示词模板", description = "根据条件分页查询提示词模板")
    public ResponseEntity<Page<PromptTemplateDto>> searchPromptTemplates(
            @Valid PromptTemplateQueryDto queryDto) {
        Page<PromptTemplateDto> page = promptTemplateService.searchPromptTemplates(queryDto);
        return ResponseEntity.ok(page);
    }

    /**
     * 获取所有提示词模板
     *
     * @return 所有提示词模板列表
     */
    @GetMapping
    @Operation(summary = "获取所有提示词模板", description = "获取系统中所有的提示词模板")
    public ResponseEntity<List<PromptTemplateDto>> getAllPromptTemplates() {
        List<PromptTemplateDto> templates = promptTemplateService.getAllPromptTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * 根据创建用户获取提示词模板列表
     *
     * @param createUser 创建用户
     * @return 提示词模板列表
     */
    @GetMapping("/create-user/{createUser}")
    @Operation(summary = "根据创建用户获取提示词模板", description = "根据创建用户获取提示词模板列表")
    public ResponseEntity<List<PromptTemplateDto>> getPromptTemplatesByCreateUser(
            @Parameter(description = "创建用户") @PathVariable String createUser) {
        List<PromptTemplateDto> templates = promptTemplateService.getPromptTemplatesByCreateUser(createUser);
        return ResponseEntity.ok(templates);
    }
}