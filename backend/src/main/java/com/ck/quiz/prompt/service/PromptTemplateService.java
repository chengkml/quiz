package com.ck.quiz.prompt.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import com.ck.quiz.prompt.entity.PromptTemplate;

public interface PromptTemplateService extends BaseService<PromptTemplateCreateDto, PromptTemplateUpdateDto, PromptTemplateQueryDto, PromptTemplateDto, PromptTemplate> {

    boolean checkNameUniq(String userId, String name, String excludeId);
}