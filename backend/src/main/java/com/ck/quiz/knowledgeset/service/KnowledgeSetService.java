package com.ck.quiz.knowledgeset.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetUpdateDto;
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;

public interface KnowledgeSetService extends BaseService<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto, KnowledgeSet> {
}

