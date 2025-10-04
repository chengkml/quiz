package com.ck.quiz.exam.controller;

import com.ck.quiz.exam.dto.ExamCreateDto;
import com.ck.quiz.exam.dto.ExamQueryDto;
import com.ck.quiz.exam.dto.ExamUpdateDto;
import com.ck.quiz.exam.entity.Exam;
import com.ck.quiz.exam.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "试卷管理", description = "试卷相关的API接口")
@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Autowired
    private ExamService examService;

    @Operation(summary = "创建试卷", description = "创建新的试卷")
    @PostMapping("/create")
    public ResponseEntity createExam(
            @Parameter(description = "试卷创建信息", required = true) @Valid @RequestBody ExamCreateDto examCreateDto) {
        return ResponseEntity.ok(examService.createExam(examCreateDto));
    }

    @Operation(summary = "更新试卷", description = "更新指定试卷的信息")
    @PutMapping("/update")
    public ResponseEntity updateExam(
            @Parameter(description = "试卷更新信息", required = true) @Valid @RequestBody ExamUpdateDto examUpdateDto) {
        return ResponseEntity.ok(examService.updateExam(examUpdateDto));
    }

    @Operation(summary = "删除试卷", description = "根据ID删除指定试卷")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteExam(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(examService.deleteExam(id));
    }

    @Operation(summary = "获取试卷详情", description = "根据ID获取试卷详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getExamById(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(examService.getExamById(id));
    }

    @Operation(summary = "分页查询试卷", description = "根据条件分页查询试卷列表")
    @GetMapping
    public ResponseEntity searchExams(
            @Parameter(description = "试卷名称") @RequestParam(required = false) String name,
            @Parameter(description = "试卷描述") @RequestParam(required = false) String description,
            @Parameter(description = "试卷状态") @RequestParam(required = false) Exam.ExamPaperStatus status,
            @Parameter(description = "创建人") @RequestParam(required = false) String createUser,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        
        ExamQueryDto queryDto = new ExamQueryDto();
        queryDto.setName(name);
        queryDto.setDescription(description);
        queryDto.setStatus(status);
        queryDto.setCreateUser(createUser);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        
        return ResponseEntity.ok(examService.searchExams(queryDto));
    }

    @Operation(summary = "发布试卷", description = "将试卷状态更改为已发布")
    @PostMapping("/{id}/publish")
    public ResponseEntity publishExam(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(examService.publishExam(id));
    }

    @Operation(summary = "归档试卷", description = "将试卷状态更改为已归档")
    @PostMapping("/{id}/archive")
    public ResponseEntity archiveExam(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(examService.archiveExam(id));
    }

    @Operation(summary = "添加题目到试卷", description = "为试卷添加新的题目")
    @PostMapping("/{id}/questions")
    public ResponseEntity addQuestionToExam(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id,
            @Parameter(description = "题目ID", required = true) @RequestParam String questionId,
            @Parameter(description = "题目顺序", required = true) @RequestParam Integer orderNo,
            @Parameter(description = "分值", required = true) @RequestParam Integer score) {
        examService.addQuestionToExam(id, questionId, orderNo, score);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "从试卷中移除题目", description = "从试卷中移除指定题目")
    @DeleteMapping("/{id}/questions/{questionId}")
    public ResponseEntity removeQuestionFromExam(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id,
            @Parameter(description = "题目ID", required = true) @PathVariable String questionId) {
        examService.removeQuestionFromExam(id, questionId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "更新试卷中的题目", description = "更新试卷中题目的顺序和分值")
    @PutMapping("/{id}/questions/{questionId}")
    public ResponseEntity updateExamQuestion(
            @Parameter(description = "试卷ID", required = true) @PathVariable String id,
            @Parameter(description = "题目ID", required = true) @PathVariable String questionId,
            @Parameter(description = "题目顺序") @RequestParam(required = false) Integer orderNo,
            @Parameter(description = "分值") @RequestParam(required = false) Integer score) {
        examService.updateExamQuestion(id, questionId, orderNo, score);
        return ResponseEntity.ok().build();
    }
}