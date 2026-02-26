package com.ck.quiz.base.controller;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.ReviewLogDto;
import com.ck.quiz.base.dto.ReviewRequestDto;
import com.ck.quiz.base.dto.ReviewResultDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.service.ReviewBaseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;

public abstract class ReviewBaseController<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto>
        extends BaseController<C, U, Q, D> {

    protected abstract ReviewBaseService<C, U, Q, D, ?> getService();

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

    @PostMapping("/archive/{id}")
    @Operation(summary = "归档单词")
    public void archive(@PathVariable String id, @RequestParam(defaultValue = "true") boolean archived) {
        String userId = getCurrentUserId();
        getService().archive(userId, id, archived);
    }

    @PostMapping("/reset/{id}")
    @Operation(summary = "重置学习状态")
    public void reset(@PathVariable String id) {
        String userId = getCurrentUserId();
        getService().reset(userId, id);
    }

    @GetMapping("/due-today")
    @Operation(summary = "获取今日待复习单词")
    public List<D> getDueToday() {
        String userId = getCurrentUserId();
        return getService().getDueToday(userId);
    }

    @PostMapping("/review")
    @Operation(summary = "提交复习评分")
    public ReviewResultDto review(@RequestBody ReviewRequestDto dto) {
        String userId = getCurrentUserId();
        return getService().review(userId, dto);
    }

    @GetMapping("/review-history/{cardId}")
    @Operation(summary = "获取单词复习历史")
    public List<ReviewLogDto> getReviewHistory(@PathVariable String cardId) {
        String userId = getCurrentUserId();
        return getService().getReviewHistory(userId, cardId);
    }
}
