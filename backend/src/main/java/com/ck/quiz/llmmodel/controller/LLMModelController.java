package com.ck.quiz.llmmodel.controller;

import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.service.LLMModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "大语言模型管理", description = "大语言模型相关的API接口")
@RestController
@RequestMapping("/api/model")
public class LLMModelController {

    @Autowired
    private LLMModelService modelService;

    @Operation(summary = "创建模型", description = "创建新的大语言模型")
    @PostMapping("/create")
    public ResponseEntity createModel(
            @Parameter(description = "模型创建信息", required = true) @Valid @RequestBody LLMModelCreateDto modelCreateDto) {
        return ResponseEntity.ok(modelService.createModel(modelCreateDto));
    }

    @Operation(summary = "更新模型", description = "更新指定模型的信息")
    @PutMapping("/update")
    public ResponseEntity updateModel(
            @Parameter(description = "模型更新信息", required = true) @Valid @RequestBody LLMModelUpdateDto modelUpdateDto) {
        return ResponseEntity.ok(modelService.updateModel(modelUpdateDto));
    }

    @Operation(summary = "删除模型", description = "根据ID删除指定模型")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteModel(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(modelService.deleteModel(id));
    }

    @Operation(summary = "获取模型详情", description = "根据ID获取模型详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getModelById(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(modelService.getModelById(id));
    }

    @Operation(summary = "获取默认模型", description = "获取系统设置的默认模型")
    @GetMapping("/default")
    public ResponseEntity getDefaultModel() {
        return ResponseEntity.ok(modelService.getDefaultModel());
    }

    @Operation(summary = "分页查询模型", description = "根据条件分页查询模型列表")
    @GetMapping
    public ResponseEntity searchModels(
            @Parameter(description = "模型名称") @RequestParam(required = false) String name,
            @Parameter(description = "模型提供商") @RequestParam(required = false) String provider,
            @Parameter(description = "模型类型") @RequestParam(required = false) LLMModel.ModelType type,
            @Parameter(description = "模型状态") @RequestParam(required = false) LLMModel.ModelStatus status,
            @Parameter(description = "是否为默认模型") @RequestParam(required = false) Boolean isDefault,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        LLMModelQueryDto queryDto = new LLMModelQueryDto();
        queryDto.setName(name);
        queryDto.setProvider(provider);
        queryDto.setType(type);
        queryDto.setStatus(status);
        queryDto.setIsDefault(isDefault);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(modelService.searchModels(queryDto));
    }

    @Operation(summary = "获取激活状态的模型列表", description = "获取所有激活状态的模型列表")
    @GetMapping("/active/list")
    public ResponseEntity<List<?>> getActiveModels() {
        return ResponseEntity.ok(modelService.getActiveModels());
    }

    @Operation(summary = "设置默认模型", description = "将指定模型设置为默认模型")
    @PutMapping("/{id}/set-default")
    public ResponseEntity setDefaultModel(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        modelService.setDefaultModel(id);
        return ResponseEntity.ok().build();
    }
}