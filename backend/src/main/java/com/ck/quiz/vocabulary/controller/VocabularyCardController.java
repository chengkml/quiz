package com.ck.quiz.vocabulary.controller;

import com.ck.quiz.vocabulary.dto.*;
import com.ck.quiz.vocabulary.service.VocabularyCardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 单词卡片控制器
 * 艾宾浩斯间隔重复学习系统
 */
@Slf4j
@RestController
@RequestMapping("/api/vocabulary")
@RequiredArgsConstructor
@Tag(name = "单词卡片管理", description = "艾宾浩斯单词记忆系统 API")
public class VocabularyCardController {

    private final VocabularyCardService vocabularyCardService;

    /**
     * 获取当前登录用户ID
     */
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return "anonymous";
        }
        return authentication.getName();
    }

    @PostMapping("/create")
    @Operation(summary = "创建单词卡片")
    public VocabularyCardDto create(@RequestBody VocabularyCardCreateDto dto) {
        String userId = getCurrentUserId();
        log.info("用户 {} 创建单词: {}", userId, dto.getWord());
        return vocabularyCardService.create(userId, dto);
    }

    @PostMapping("/update")
    @Operation(summary = "更新单词卡片")
    public VocabularyCardDto update(@RequestBody VocabularyCardUpdateDto dto) {
        String userId = getCurrentUserId();
        log.info("用户 {} 更新单词: {}", userId, dto.getId());
        return vocabularyCardService.update(userId, dto);
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "删除单词卡片")
    public void delete(@PathVariable String id) {
        String userId = getCurrentUserId();
        log.info("用户 {} 删除单词: {}", userId, id);
        vocabularyCardService.delete(userId, id);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取单词详情")
    public VocabularyCardDto getById(@PathVariable String id) {
        String userId = getCurrentUserId();
        return vocabularyCardService.getById(userId, id);
    }

    @PostMapping("/search")
    @Operation(summary = "搜索/筛选单词")
    public Page<VocabularyCardDto> search(@RequestBody VocabularyCardQueryDto queryDto) {
        String userId = getCurrentUserId();
        return vocabularyCardService.search(userId, queryDto);
    }

    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式生成释义（SSE）", description = "根据单词调用大模型流式生成Markdown释义")
    public Flux<String> streamGenerateDefinition(
            @RequestParam("word") String word,
            @RequestParam(value = "modelName", required = false) String modelName) {
        return vocabularyCardService.streamGenerateDefinition(word, modelName);
    }

    @PostMapping("/archive/{id}")
    @Operation(summary = "归档单词")
    public void archive(@PathVariable String id, @RequestParam(defaultValue = "true") boolean archived) {
        String userId = getCurrentUserId();
        log.info("用户 {} {}单词: {}", userId, archived ? "归档" : "取消归档", id);
        vocabularyCardService.archive(userId, id, archived);
    }

    @PostMapping("/reset/{id}")
    @Operation(summary = "重置学习状态")
    public void reset(@PathVariable String id) {
        String userId = getCurrentUserId();
        log.info("用户 {} 重置单词学习状态: {}", userId, id);
        vocabularyCardService.reset(userId, id);
    }

    @GetMapping("/due-today")
    @Operation(summary = "获取今日待复习单词")
    public List<VocabularyCardDto> getDueToday() {
        String userId = getCurrentUserId();
        return vocabularyCardService.getDueToday(userId);
    }

    @PostMapping("/review")
    @Operation(summary = "提交复习评分")
    public ReviewResultDto review(@RequestBody ReviewRequestDto dto) {
        String userId = getCurrentUserId();
        log.info("用户 {} 复习单词 {}, 评分: {}", userId, dto.getCardId(), dto.getScore());
        return vocabularyCardService.review(userId, dto);
    }

    @GetMapping("/statistics")
    @Operation(summary = "获取学习统计")
    public StatisticsDto getStatistics() {
        String userId = getCurrentUserId();
        return vocabularyCardService.getStatistics(userId);
    }

    @GetMapping("/review-history/{cardId}")
    @Operation(summary = "获取单词复习历史")
    public List<ReviewLogDto> getReviewHistory(@PathVariable String cardId) {
        String userId = getCurrentUserId();
        return vocabularyCardService.getReviewHistory(userId, cardId);
    }
}
