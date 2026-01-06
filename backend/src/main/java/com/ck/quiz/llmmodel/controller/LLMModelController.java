package com.ck.quiz.llmmodel.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.service.LLMModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "大语言模型管理", description = "大语言模型相关API")
@RestController
@RequestMapping("/api/llm-model")
public class LLMModelController extends BaseController<LLMModelCreateDto, LLMModelUpdateDto, LLMModelQueryDto, LLMModelDto> {

    private LLMModelService modelService;

    public LLMModelController(LLMModelService modelService) {
        this.modelService = modelService;
    }

    @Override
    protected LLMModelService getService() {
        return modelService;
    }

    @Operation(summary = "按类型获取模型列表")
    @GetMapping("/list-by-type/{type}")
    public List<LLMModelDto> listModelsByType(
            @Parameter(description = "模型类型", required = true)
            @PathVariable("type") String type) {
        return modelService.listModelsByType(LLMModel.ModelType.valueOf(type));
    }

    @Operation(summary = "设置默认模型")
    @PutMapping("/{id}/set-default")
    public void setDefaultModel(
            @Parameter(description = "模型ID", required = true)
            @PathVariable("id") String id) {
        modelService.setDefaultModel(id);
    }
}