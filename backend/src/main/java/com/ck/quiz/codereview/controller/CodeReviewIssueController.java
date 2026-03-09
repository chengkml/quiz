package com.ck.quiz.codereview.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.codereview.dto.CodeReviewBatchConvertDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueUpdateDto;
import com.ck.quiz.codereview.service.CodeReviewIssueService;
import com.ck.quiz.project.dto.RequirementDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "CodeReviewIssue", description = "代码评审问题管理")
@RestController
@RequestMapping("/api/code-review")
public class CodeReviewIssueController extends BaseController<CodeReviewIssueCreateDto, CodeReviewIssueUpdateDto, CodeReviewIssueQueryDto, CodeReviewIssueDto> {

    @Autowired
    private CodeReviewIssueService codeReviewIssueService;

    @Override
    protected BaseService<CodeReviewIssueCreateDto, CodeReviewIssueUpdateDto, CodeReviewIssueQueryDto, CodeReviewIssueDto, ?> getService() {
        return codeReviewIssueService;
    }

    @Operation(summary = "批量创建评审问题", description = "OpenClaw可通过JWT调用该接口批量写入评审问题")
    @PostMapping("/create-batch")
    public ResponseEntity<List<CodeReviewIssueDto>> createBatch(@RequestBody @Valid List<CodeReviewIssueCreateDto> createDtos) {
        return ResponseEntity.ok(codeReviewIssueService.createBatch(createDtos));
    }

    @Operation(summary = "一键转需求", description = "把评审问题转成需求，并返回需求信息")
    @PostMapping("/{id}/convert-to-requirement")
    public ResponseEntity<RequirementDto> convertToRequirement(@PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(codeReviewIssueService.convertToRequirement(authentication.getName(), id));
    }

    @Operation(summary = "批量一键转需求", description = "把多个评审问题批量转成需求")
    @PostMapping("/convert-to-requirement/batch")
    public ResponseEntity<Map<String, Integer>> convertBatchToRequirement(@RequestBody @Valid CodeReviewBatchConvertDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        int count = codeReviewIssueService.convertBatchToRequirement(authentication.getName(), dto.getIssueIds());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
