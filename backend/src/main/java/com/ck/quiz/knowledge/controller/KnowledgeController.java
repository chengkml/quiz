package com.ck.quiz.knowledge.controller;

import com.ck.quiz.knowledge.dto.KnowledgeCreateDto;
import com.ck.quiz.knowledge.dto.KnowledgeDto;
import com.ck.quiz.knowledge.dto.KnowledgeQueryDto;
import com.ck.quiz.knowledge.dto.KnowledgeUpdateDto;
import com.ck.quiz.knowledge.service.KnowledgeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 知识点管理控制器
 * 提供知识点相关的REST API接口
 */
@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
@Tag(name = "知识点管理", description = "知识点管理相关API")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    /**
     * 创建新知识点
     *
     * @param createDto 知识点创建信息
     * @return 创建的知识点信息
     */
    @PostMapping
    @Operation(summary = "创建知识点", description = "创建一个新的知识点")
    public ResponseEntity<KnowledgeDto> createKnowledge(
            @Valid @RequestBody KnowledgeCreateDto createDto) {
        KnowledgeDto knowledge = knowledgeService.createKnowledge(createDto);
        return ResponseEntity.ok(knowledge);
    }

    /**
     * 更新知识点信息
     *
     * @param updateDto 知识点更新信息
     * @return 更新后的知识点信息
     */
    @PutMapping
    @Operation(summary = "更新知识点", description = "更新现有知识点的信息")
    public ResponseEntity<KnowledgeDto> updateKnowledge(
            @Valid @RequestBody KnowledgeUpdateDto updateDto) {
        KnowledgeDto knowledge = knowledgeService.updateKnowledge(updateDto);
        return ResponseEntity.ok(knowledge);
    }

    /**
     * 删除知识点
     *
     * @param id 知识点ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除知识点", description = "根据ID删除知识点")
    public ResponseEntity<Void> deleteKnowledge(
            @Parameter(description = "知识点ID") @PathVariable String id) {
        knowledgeService.deleteKnowledge(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 根据ID获取知识点信息
     *
     * @param id 知识点ID
     * @return 知识点信息
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取知识点详情", description = "根据ID获取知识点详细信息")
    public ResponseEntity<KnowledgeDto> getKnowledgeById(
            @Parameter(description = "知识点ID") @PathVariable String id) {
        KnowledgeDto knowledge = knowledgeService.getKnowledgeById(id);
        return ResponseEntity.ok(knowledge);
    }

    /**
     * 根据名称获取知识点信息
     *
     * @param name 知识点名称
     * @return 知识点信息
     */
    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取知识点", description = "根据知识点名称获取知识点信息")
    public ResponseEntity<KnowledgeDto> getKnowledgeByName(
            @Parameter(description = "知识点名称") @PathVariable String name) {
        KnowledgeDto knowledge = knowledgeService.getKnowledgeByName(name);
        return ResponseEntity.ok(knowledge);
    }

    /**
     * 分页查询知识点
     *
     * @param queryDto 查询条件
     * @return 分页知识点列表
     */
    @PostMapping("/search")
    @Operation(summary = "分页查询知识点", description = "根据条件分页查询知识点列表")
    public ResponseEntity<Page<KnowledgeDto>> searchKnowledge(
            @RequestBody KnowledgeQueryDto queryDto) {
        Page<KnowledgeDto> knowledge = knowledgeService.searchKnowledge(queryDto);
        return ResponseEntity.ok(knowledge);
    }

    /**
     * 检查知识点名称是否存在
     *
     * @param name      知识点名称
     * @param excludeId 排除的知识点ID（用于更新时检查）
     * @return 是否存在
     */
    @GetMapping("/check-name")
    @Operation(summary = "检查知识点名称", description = "检查知识点名称是否已存在")
    public ResponseEntity<Boolean> checkKnowledgeNameExists(
            @Parameter(description = "知识点名称") @RequestParam String name,
            @Parameter(description = "排除的知识点ID") @RequestParam(required = false) String excludeId) {
        boolean exists = knowledgeService.checkKnowledgeNameExists(name, excludeId);
        return ResponseEntity.ok(exists);
    }

    /**
     * 获取知识点关联的问题
     *
     * @param id 知识点ID
     * @return 关联的问题列表
     */
    @GetMapping("/{id}/questions")
    @Operation(summary = "获取知识点关联的问题", description = "获取指定知识点关联的所有问题")
    public ResponseEntity getKnowledgeQuestions(
            @Parameter(description = "知识点ID") @PathVariable String id) {
        return ResponseEntity.ok(knowledgeService.getKnowledgeQuestions(id));
    }

}