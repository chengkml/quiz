package com.ck.quiz.knowledgeset.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceCreateDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceQueryDto;
import com.ck.quiz.knowledgeset.dto.KnowledgeSourceUpdateDto;
import com.ck.quiz.knowledgeset.service.KnowledgeSourceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "知识来源管理", description = "知识来源管理相关API")
@RestController
@RequestMapping("/api/knowledge-source")
public class KnowledgeSourceController extends
        BaseController<KnowledgeSourceCreateDto, KnowledgeSourceUpdateDto, KnowledgeSourceQueryDto, KnowledgeSourceDto> {

    private final KnowledgeSourceService knowledgeSourceService;

    public KnowledgeSourceController(KnowledgeSourceService knowledgeSourceService) {
        this.knowledgeSourceService = knowledgeSourceService;
    }

    @Override
    protected BaseService<KnowledgeSourceCreateDto, KnowledgeSourceUpdateDto, KnowledgeSourceQueryDto, KnowledgeSourceDto, ?> getService() {
        return knowledgeSourceService;
    }

    @org.springframework.web.bind.annotation.PostMapping("/test-connection")
    public void testConnection(@org.springframework.web.bind.annotation.RequestBody KnowledgeSourceDto dto)
            throws Exception {
        knowledgeSourceService.testConnection(dto.getType(), dto.getContent());
    }
}
