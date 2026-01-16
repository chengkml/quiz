package com.ck.quiz.knowledgeset.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSetUpdateDto;
import com.ck.quiz.knowledgeset.service.KnowledgeSetService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "知识集管理", description = "知识集管理相关API")
@RestController
@RequestMapping("/api/knowledge-set")
public class KnowledgeSetController extends BaseController<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto> {

    private final KnowledgeSetService knowledgeSetService;

    public KnowledgeSetController(KnowledgeSetService knowledgeSetService) {
        this.knowledgeSetService = knowledgeSetService;
    }

    @Override
    protected BaseService<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto, ?> getService() {
        return knowledgeSetService;
    }
}

