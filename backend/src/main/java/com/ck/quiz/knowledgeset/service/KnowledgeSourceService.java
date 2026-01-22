package com.ck.quiz.knowledgeset.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceUpdateDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;

public interface KnowledgeSourceService extends BaseService<KnowledgeSourceCreateDto, KnowledgeSourceUpdateDto, KnowledgeSourceQueryDto, KnowledgeSourceDto, KnowledgeSource> {
}
