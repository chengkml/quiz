package com.ck.quiz.question.controller;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @Operation(summary = "创建题目", description = "创建新的题目")
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
    @GetMapping
    public ResponseEntity searchQuestions(
            @Parameter(description = "题目类型") @RequestParam(required = false) Question.QuestionType type,
            @Parameter(description = "题干内容") @RequestParam(required = false) String content,
            @Parameter(description = "难度等级") @RequestParam(required = false) Integer difficultyLevel,
            @Parameter(description = "创建人") @RequestParam(required = false) String createUser,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "20") int pageSize,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortColumn,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortType) {
        QuestionQueryDto queryDto = new QuestionQueryDto();
        queryDto.setType(type);
        queryDto.setContent(content);
        queryDto.setDifficultyLevel(difficultyLevel);
        queryDto.setCreateUser(createUser);
        queryDto.setPageNum(pageNum);
        queryDto.setPageSize(pageSize);
        queryDto.setSortColumn(sortColumn);
        queryDto.setSortType(sortType);
        return ResponseEntity.ok(questionService.searchQuestions(queryDto));
    }

    @Operation(summary = "根据知识点生成题目", description = "根据知识点描述调用大模型生成题目")
    @PostMapping("/generate")
    public ResponseEntity<List<QuestionCreateDto>> generateQuestions(
            @Parameter(description = "知识点描述", required = true) @RequestParam String knowledgeDescr,
            @Parameter(description = "生成题目数量", required = true) @RequestParam(defaultValue = "3") int num) {
        return ResponseEntity.ok(questionService.generateQuestions(knowledgeDescr, num));
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
}