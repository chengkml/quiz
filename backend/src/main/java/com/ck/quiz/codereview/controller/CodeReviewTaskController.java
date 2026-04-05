package com.ck.quiz.codereview.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.codereview.dto.CodeReviewTaskCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskHistoryOptionsDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskUpdateDto;
import com.ck.quiz.codereview.service.CodeReviewTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "CodeReviewTask", description = "代码评审任务管理")
@RestController
@RequestMapping("/api/code-review/task")
public class CodeReviewTaskController extends BaseController<CodeReviewTaskCreateDto, CodeReviewTaskUpdateDto, CodeReviewTaskQueryDto, CodeReviewTaskDto> {

    @Autowired
    private CodeReviewTaskService codeReviewTaskService;

    @Override
    protected BaseService<CodeReviewTaskCreateDto, CodeReviewTaskUpdateDto, CodeReviewTaskQueryDto, CodeReviewTaskDto, ?> getService() {
        return codeReviewTaskService;
    }

    @Operation(summary = "开始处理任务", description = "把任务状态从 OPEN 更新为 IN_PROGRESS")
    @PostMapping("/{id}/start")
    public ResponseEntity<CodeReviewTaskDto> start(@PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(codeReviewTaskService.start(authentication.getName(), id));
    }

    @Operation(summary = "完成任务", description = "把任务状态从 IN_PROGRESS 更新为 COMPLETED")
    @PostMapping("/{id}/complete")
    public ResponseEntity<CodeReviewTaskDto> complete(@PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(codeReviewTaskService.complete(authentication.getName(), id));
    }

    @Operation(summary = "获取任务历史输入选项", description = "获取项目名称、Git 仓库地址、分支名称的历史输入记录")
    @GetMapping("/history-options")
    public ResponseEntity<CodeReviewTaskHistoryOptionsDto> getHistoryOptions() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(codeReviewTaskService.getHistoryOptions(authentication.getName()));
    }
}
