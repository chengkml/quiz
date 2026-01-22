package com.ck.quiz.llmmodel.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;

import java.util.List;

import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiEmbeddingModel;

public interface LLMModelService extends BaseService<LLMModelCreateDto, LLMModelUpdateDto, LLMModelQueryDto, LLMModelDto, LLMModel> {

    List<LLMModelDto> listModelsByType(LLMModel.ModelType modelType);

    void setDefaultModel(String modelId);

    OpenAiChatModel getChatModel(String modelName);

    OpenAiEmbeddingModel getEmbeddingModel(String modelName);
}