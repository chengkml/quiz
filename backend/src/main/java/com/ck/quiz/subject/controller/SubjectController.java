package com.ck.quiz.subject.controller;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "学科管理", description = "学科相关的API接口")
@RestController
@RequestMapping("/api/subject")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @Operation(summary = "创建学科", description = "创建新的学科")
    @PostMapping("/create")
    public ResponseEntity createSubject(
            @Parameter(description = "学科创建信息", required = true) @Valid @RequestBody SubjectCreateDto subjectCreateDto) {
        return ResponseEntity.ok(subjectService.createSubject(subjectCreateDto));
    }

    @Operation(summary = "更新学科", description = "更新学科信息")
    @PutMapping("/update")
    public ResponseEntity updateSubject(
            @Parameter(description = "学科更新信息", required = true) @Valid @RequestBody SubjectUpdateDto subjectUpdateDto) {
        return ResponseEntity.ok(subjectService.updateSubject(subjectUpdateDto));
    }

    @Operation(summary = "删除学科", description = "删除指定学科")
    @DeleteMapping("/delete/{subjectId}")
    public ResponseEntity deleteSubject(
            @Parameter(description = "学科ID", required = true) @PathVariable String subjectId) {
        return ResponseEntity.ok(subjectService.deleteSubject(subjectId));
    }

    @Operation(summary = "获取学科详情", description = "根据学科ID获取学科详细信息")
    @GetMapping("/{subjectId}")
    public ResponseEntity getSubjectById(
            @Parameter(description = "学科ID", required = true) @PathVariable String subjectId) {
        return ResponseEntity.ok(subjectService.getSubjectById(subjectId));
    }

    @Operation(summary = "根据名称获取学科", description = "根据学科名称获取学科详细信息")
    @GetMapping("/name/{subjectName}")
    public ResponseEntity getSubjectByName(
            @Parameter(description = "学科名称", required = true) @PathVariable String subjectName) {
        return ResponseEntity.ok(subjectService.getSubjectByName(subjectName));
    }

    @Operation(summary = "分页查询学科", description = "根据条件分页查询学科列表")
    @GetMapping
    public ResponseEntity getSubjects(
            @Parameter(description = "学科名称") @RequestParam(required = false) String subjectName,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "排序字段") @RequestParam(defaultValue = "create_date") String sortBy,
            @Parameter(description = "排序方向") @RequestParam(defaultValue = "desc") String sortDir) {
        SubjectQueryDto queryDto = new SubjectQueryDto();
        queryDto.setName(subjectName);
        queryDto.setPageNum(page);
        queryDto.setPageSize(size);
        queryDto.setSortColumn(sortBy);
        queryDto.setSortType(sortDir);
        return ResponseEntity.ok(subjectService.searchSubjects(queryDto));
    }

    @Operation(summary = "获取所有学科列表", description = "获取所有学科的简单列表")
    @GetMapping("/list/all")
    public ResponseEntity getAllSubjects() {
        return ResponseEntity.ok(subjectService.getAllSubjects());
    }

    @Operation(summary = "获取指定用户的所有学科列表", description = "获取指定用户的所有学科的简单列表")
    @GetMapping("/list/user/all")
    public ResponseEntity getAllUserSubjects() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.getAllUserSubjects(authentication.getName()));
    }

    @Operation(summary = "检查学科名称", description = "检查学科名称是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity checkSubjectName(
            @Parameter(description = "学科名称", required = true) @RequestParam String subjectName,
            @Parameter(description = "排除的学科ID") @RequestParam(required = false) String excludeSubjectId) {
        return ResponseEntity.ok(subjectService.isSubjectNameExists(subjectName, excludeSubjectId));
    }

    @Operation(summary = "导出学科列表", description = "导出学科列表为Excel文件")
    @GetMapping("/export")
    public void exportSubjects(HttpServletResponse response) {
        subjectService.exportSubjects(response);
    }

    @Operation(summary = "导入学科列表", description = "从Excel文件导入学科列表")
    @PostMapping("/import")
    public ResponseEntity importSubjects(@Parameter(description = "Excel文件") @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(subjectService.importSubjects(file));
    }

    @Operation(summary = "学科知识问题初始化", description = "生成学科知识和问题")
    @GetMapping("/init/questions")
    public ResponseEntity initSubjectQuestions(
            @Parameter(description = "学科ID", required = true) @RequestParam String subjectId,
            @Parameter(description = "问题数", required = true) @RequestParam int questionNum) {
        subjectService.initSubjectQuestions(subjectId, questionNum);
        return ResponseEntity.ok().build();
    }
}