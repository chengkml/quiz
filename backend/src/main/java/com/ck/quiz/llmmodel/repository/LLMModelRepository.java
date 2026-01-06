package com.ck.quiz.llmmodel.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.llmmodel.entity.LLMModel;

import java.util.Optional;

public interface LLMModelRepository extends BaseRepository<LLMModel> {

    Optional<LLMModel> findByIsDefault(String isDefault);

    Optional<LLMModel> findByNameAndProvider(String name, String provider);

    java.util.List<LLMModel> findByType(LLMModel.ModelType type);

    Optional<LLMModel> findByName(String name);

    Optional<LLMModel> findByTypeAndIsDefault(LLMModel.ModelType type, String isDefault);
}