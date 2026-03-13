package com.ck.quiz.project.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.project.dto.RequirementAnalyzeDto;
import com.ck.quiz.project.dto.RequirementCreateDto;
import com.ck.quiz.project.dto.RequirementDto;
import com.ck.quiz.project.dto.RequirementHistoryOptionsDto;
import com.ck.quiz.project.dto.RequirementLifecycleLogDto;
import com.ck.quiz.project.dto.RequirementQueryDto;
import com.ck.quiz.project.dto.RequirementReviewDto;
import com.ck.quiz.project.dto.RequirementUpdateDto;
import com.ck.quiz.project.service.RequirementService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@Tag(name = "Requirement", description = "需求管理")
@RestController
@RequestMapping("/api/project/requirement")
public class RequirementController extends BaseController<RequirementCreateDto, RequirementUpdateDto, RequirementQueryDto, RequirementDto> {

    @Autowired
    private RequirementService requirementService;

    @Override
    protected BaseService<RequirementCreateDto, RequirementUpdateDto, RequirementQueryDto, RequirementDto, ?> getService() {
        return requirementService;
    }

    @Operation(summary = "获取待处理需求 (OpenClaw)", description = "获取最早的一个待处理需求")
    @GetMapping("/pending")
    public RequirementDto getPending() {
        return requirementService.getPendingRequirement();
    }

    @Operation(summary = "更新需求状态 (OpenClaw)", description = "更新需求状态、结果信息及进度")
    @PostMapping("/{id}/status")
    public void updateStatus(@PathVariable String id,
                             @RequestParam String status,
                             @RequestParam(required = false) String resultMsg,
                             @RequestParam(required = false) Integer progressPercent) {
        requirementService.updateStatus(id, status, resultMsg, progressPercent);
    }

    @Operation(summary = "需求分析", description = "分析需求并将状态流转到待评审")
    @PostMapping("/{id}/analyze")
    public RequirementDto analyze(@PathVariable String id,
                                  @RequestBody RequirementAnalyzeDto analyzeDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return requirementService.analyze(authentication.getName(), id, analyzeDto);
    }

    @Operation(summary = "需求评审", description = "评审需求并将状态流转到待修订或待处理")
    @PostMapping("/{id}/review")
    public RequirementDto review(@PathVariable String id,
                                 @RequestBody RequirementReviewDto reviewDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return requirementService.review(authentication.getName(), id, reviewDto);
    }

    @Operation(summary = "获取需求生命周期", description = "按时间轴获取需求生命周期日志")
    @GetMapping("/{id}/lifecycle")
    public List<RequirementLifecycleLogDto> lifecycle(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return requirementService.getLifecycle(authentication.getName(), id);
    }

    @Operation(summary = "获取历史输入选项", description = "获取项目名称、Git仓库地址、分支名称的历史输入记录")
    @GetMapping("/history-options")
    public RequirementHistoryOptionsDto getHistoryOptions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return requirementService.getHistoryOptions(authentication.getName());
    }
}
