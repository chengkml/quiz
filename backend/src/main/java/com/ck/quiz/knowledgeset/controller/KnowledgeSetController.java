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
public class KnowledgeSetController
        extends BaseController<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto> {

    private final KnowledgeSetService knowledgeSetService;

    public KnowledgeSetController(KnowledgeSetService knowledgeSetService) {
        this.knowledgeSetService = knowledgeSetService;
    }

    @Override
    protected BaseService<KnowledgeSetCreateDto, KnowledgeSetUpdateDto, KnowledgeSetQueryDto, KnowledgeSetDto, ?> getService() {
        return knowledgeSetService;
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "My Created Page")
    @org.springframework.web.bind.annotation.PostMapping("/my-created")
    public org.springframework.http.ResponseEntity<org.springframework.data.domain.Page<KnowledgeSetDto>> myCreated(
            @org.springframework.web.bind.annotation.RequestBody KnowledgeSetQueryDto queryDto) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return org.springframework.http.ResponseEntity
                .ok(knowledgeSetService.search(authentication.getName(), queryDto));
    }

    @io.swagger.v3.oas.annotations.Operation(summary = "My Joined Page")
    @org.springframework.web.bind.annotation.PostMapping("/my-joined")
    public org.springframework.http.ResponseEntity<org.springframework.data.domain.Page<KnowledgeSetDto>> myJoined(
            @org.springframework.web.bind.annotation.RequestBody KnowledgeSetQueryDto queryDto) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        return org.springframework.http.ResponseEntity
                .ok(knowledgeSetService.pageMyJoined(authentication.getName(), queryDto));
    }
}
