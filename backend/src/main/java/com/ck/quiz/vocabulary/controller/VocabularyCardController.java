package com.ck.quiz.vocabulary.controller;

import com.ck.quiz.base.controller.ReviewBaseController;
import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.service.VocabularyCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;


/**
 * 单词卡片控制器
 * 艾宾浩斯间隔重复学习系统
 */
@Slf4j
@RestController
@RequestMapping("/api/vocabulary")
@Tag(name = "单词卡片管理", description = "艾宾浩斯单词记忆系统 API")
public class VocabularyCardController extends ReviewBaseController<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto> {

    @Autowired
    private VocabularyCardService vocabularyCardService;

    @Override
    protected ReviewBaseService<VocabularyCardCreateDto, VocabularyCardUpdateDto, VocabularyCardQueryDto, VocabularyCardDto, ?> getService() {
        return vocabularyCardService;
    }

    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式生成释义（SSE）", description = "根据单词调用大模型流式生成Markdown释义")
    public Flux<String> streamGenerateDefinition(
            @RequestParam("word") String word,
            @RequestParam(value = "modelName", required = false) String modelName) {
        return vocabularyCardService.streamGenerateDefinition(word, modelName);
    }
    
}
