package com.ck.quiz.question.controller;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionGenerateDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import reactor.core.publisher.Flux;

@Tag(name = "题目管理", description = "题目相关的API接口")
@RestController
@RequestMapping("/api/question")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    @Operation(summary = "创建题目", description = "创建新的题目")
    @PostMapping("/create")
    public ResponseEntity createQuestion(
            @Parameter(description = "题目创建信息", required = true) @Valid @RequestBody QuestionCreateDto questionCreateDto) {
        return ResponseEntity.ok(questionService.createQuestion(questionCreateDto));
    }

    @Operation(summary = "批量创建题目", description = "批量创建新的题目")
    @PostMapping("/batch/create")
    public ResponseEntity batchCreateQuestion(
            @Parameter(description = "题目创建信息", required = true) @Valid @RequestBody List<QuestionCreateDto> questionCreateDtos) {
        return ResponseEntity.ok(questionService.createQuestions(questionCreateDtos));
    }

    @Operation(summary = "更新题目", description = "更新指定题目的信息")
    @PutMapping("/update")
    public ResponseEntity updateQuestion(
            @Parameter(description = "题目更新信息", required = true) @Valid @RequestBody QuestionUpdateDto questionUpdateDto) {
        return ResponseEntity.ok(questionService.updateQuestion(questionUpdateDto));
    }

    @Operation(summary = "删除题目", description = "根据ID删除指定题目")
    @DeleteMapping("/{id}")
    public ResponseEntity deleteQuestion(
            @Parameter(description = "题目ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(questionService.deleteQuestion(id));
    }

    @Operation(summary = "获取题目详情", description = "根据ID获取题目详细信息")
    @GetMapping("/{id}")
    public ResponseEntity getQuestionById(
            @Parameter(description = "题目ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(questionService.getQuestionById(id));
    }

    @Operation(summary = "分页查询题目", description = "根据条件分页查询题目列表")
    @PostMapping
    public ResponseEntity searchQuestions(@RequestBody QuestionQueryDto queryDto) {
        return ResponseEntity.ok(questionService.searchQuestions(queryDto));
    }

    @Operation(summary = "根据知识点生成题目", description = "根据知识点描述调用大模型生成题目")
    @PostMapping("/generate")
    public ResponseEntity<List<QuestionCreateDto>> generateQuestions(
            @RequestBody QuestionGenerateDto request) {

        return ResponseEntity.ok(
                questionService.generateQuestions(
                        request.getKnowledgeDescr(),
                        request.getNum(),
                        request.getModelName()));
    }

    @Operation(summary = "流式生成题目（SSE）", description = "根据知识点描述调用大模型流式生成题目，逐条推送")
    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamGenerateQuestions(
            @RequestParam(value = "knowledgeDescr", required = false) String knowledgeDescr,
            @RequestParam(value = "knowledgeTitle", required = false) String knowledgeTitle,
            @RequestParam(value = "knowledgeContent", required = false) String knowledgeContent,
            @RequestParam(value = "num", defaultValue = "1") int num,
            @RequestParam(value = "modelName", required = false) String modelName) {
        return questionService.streamGenerateQuestions(knowledgeDescr, knowledgeTitle, knowledgeContent, num, modelName);
    }

    @Operation(summary = "关联知识点", description = "为题目关联知识点")
    @PostMapping("/{id}/associate-knowledge")
    public ResponseEntity associateKnowledge(
            @Parameter(description = "题目ID", required = true) @PathVariable String id,
            @Parameter(description = "知识点ID列表", required = true) @RequestBody List<String> knowledgeIds) {
        questionService.associateKnowledge(id, knowledgeIds);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "取消关联知识点", description = "取消题目与知识点的关联")
    @DeleteMapping("/{id}/disassociate-knowledge")
    public ResponseEntity disassociateKnowledge(
            @Parameter(description = "题目ID", required = true) @PathVariable String id,
            @Parameter(description = "知识点ID列表", required = true) @RequestBody List<String> knowledgeIds) {
        questionService.disassociateKnowledge(id, knowledgeIds);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "获取题目关联的知识点", description = "获取指定题目关联的所有知识点")
    @GetMapping("/{id}/knowledge")
    public ResponseEntity getQuestionKnowledge(
            @Parameter(description = "题目ID", required = true) @PathVariable String id) {
        return ResponseEntity.ok(questionService.getQuestionKnowledge(id));
    }

    @Operation(summary = "获取近七天题目增加量", description = "统计近七天每天新增的题目数量")
    @GetMapping("/statistics/last-seven-days")
    public ResponseEntity getQuestionCountByLastSevenDays() {
        return ResponseEntity.ok(questionService.getQuestionCountByLastSevenDays());
    }

    @Operation(summary = "获取各学科题目量", description = "统计各学科下的题目数量")
    @GetMapping("/statistics/by-subject")
    public ResponseEntity getQuestionCountBySubject() {
        return ResponseEntity.ok(questionService.getQuestionCountBySubject());
    }

    @Operation(summary = "获取近一个月题目增加量", description = "统计近一个月每天新增的题目数量")
    @GetMapping("/statistics/last-month")
    public ResponseEntity getQuestionCountByLastMonth() {
        return ResponseEntity.ok(questionService.getQuestionCountByLastMonth());
    }
}