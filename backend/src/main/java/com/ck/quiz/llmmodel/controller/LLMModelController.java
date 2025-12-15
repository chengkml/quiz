package com.ck.quiz.llmmodel.controller;

import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.service.LLMModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "大语言模型管理", description = "大语言模型相关的API接口")
@RestController
@RequestMapping("/api/model")
public class LLMModelController {

    @Autowired
    private LLMModelService modelService;

    @Operation(summary = "创建模型", description = "创建新的大语言模型")
    @PostMapping("/create")
    public ResponseEntity<LLMModelDto> createModel(
            @Parameter(description = "模型创建信息", required = true) @Valid @RequestBody LLMModelCreateDto modelCreateDto) {
        return ResponseEntity.ok(modelService.createModel(modelCreateDto));
    }

    @Operation(summary = "更新模型", description = "更新指定模型的信息")
    @PutMapping("/update")
    public ResponseEntity<LLMModelDto> updateModel(
            @Parameter(description = "模型更新信息", required = true) @Valid @RequestBody LLMModelUpdateDto modelUpdateDto) {
        return ResponseEntity.ok(modelService.updateModel(modelUpdateDto));
    }

    @Operation(summary = "删除模型", description = "根据ID删除指定模型")
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<LLMModelDto> deleteModel(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(modelService.deleteModel(id));
    }

    @Operation(summary = "获取模型详情", description = "根据ID获取模型详细信息")
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<LLMModelDto> getModelById(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(modelService.getModelById(id));
    }

    @Operation(summary = "分页查询模型", description = "根据条件分页查询模型列表")
    @GetMapping
    public ResponseEntity<Page<LLMModelDto>> searchModels(
            @Parameter(description = "模型名称") @RequestParam(value = "name", required = false) String name,
            @Parameter(description = "模型提供商") @RequestParam(value = "provider", required = false) String provider,
            @Parameter(description = "模型类型") @RequestParam(value = "type", required = false) LLMModel.ModelType type,
            @Parameter(description = "是否为默认模型") @RequestParam(value = "isDefault", required = false) String isDefault,
            @Parameter(description = "页码") @RequestParam(value = "pageNum", defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(value = "pageSize", defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(value = "sortColumn", defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(value = "sortType", defaultValue = "desc") String sortType) {
        LLMModelQueryDto queryDto = new LLMModelQueryDto();
        queryDto.setName(name);
        queryDto.setProvider(provider);
        queryDto.setType(type);
        queryDto.setIsDefault(isDefault);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(modelService.searchModels(queryDto));
    }

    @Operation(summary = "按类型获取模型列表", description = "根据模型类型获取指定类型的模型列表")
    @GetMapping("/list/{type}")
    public ResponseEntity<List<LLMModelDto>> getModelsByType(
            @Parameter(description = "模型类型", required = true) @PathVariable String type) {
        return ResponseEntity.ok(modelService.listModelsByType(LLMModel.ModelType.valueOf(type)));
    }

    @Operation(summary = "设置默认模型", description = "将指定模型设置为默认模型")
    @PutMapping("/{id:\\d+}/set-default")
    public ResponseEntity<Void> setDefaultModel(
            @Parameter(description = "模型ID", required = true) @PathVariable String id) {
        modelService.setDefaultModel(id);
        return ResponseEntity.ok().build();
    }
}