package com.ck.quiz.subject.controller;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "主题管理", description = "主题相关的API接口")
@RestController
@RequestMapping("/api/subject")
public class SubjectController {

    @Autowired
    private SubjectService subjectService;

    @Operation(summary = "创建主题", description = "创建新的主题")
    @PostMapping("/create")
    public ResponseEntity<SubjectDto> createSubject(
            @Parameter(description = "主题创建信息", required = true) @Valid @RequestBody SubjectCreateDto subjectCreateDto) {
        return ResponseEntity.ok(subjectService.create(subjectCreateDto));
    }

    @Operation(summary = "更新主题", description = "更新主题信息")
    @PutMapping("/update")
    public ResponseEntity<SubjectDto> updateSubject(
            @Parameter(description = "主题更新信息", required = true) @Valid @RequestBody SubjectUpdateDto subjectUpdateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.update(authentication.getName(), subjectUpdateDto));
    }

    @Operation(summary = "删除主题", description = "删除指定主题")
    @DeleteMapping("/delete/{subjectId}")
    public ResponseEntity<SubjectDto> deleteSubject(
            @Parameter(description = "主题ID", required = true) @PathVariable("subjectId") String subjectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        subjectService.delete(authentication.getName(), subjectId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "获取主题详情", description = "根据主题ID获取主题详细信息")
    @GetMapping("/{subjectId}")
    public ResponseEntity<SubjectDto> getSubjectById(
            @Parameter(description = "主题ID", required = true) @PathVariable("subjectId") String subjectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.get(authentication.getName(), subjectId));
    }

    @Operation(summary = "分页查询主题", description = "根据条件分页查询主题列表")
    @GetMapping("/search")
    public ResponseEntity<?> search(@Valid SubjectQueryDto queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.search(authentication.getName(), queryDto));
    }

    @Operation(summary = "获取指定用户的所有主题列表", description = "获取指定用户的所有主题的简单列表")
    @GetMapping("/list")
    public ResponseEntity<List<SubjectDto>> getAllUserSubjects() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.list(authentication.getName()));
    }

    @Operation(summary = "检查主题英文名", description = "检查主题英文名是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkSubjectName(
            @Parameter(description = "主题英文名", required = true) @RequestParam("subjectName") String subjectName,
            @Parameter(description = "排除的主题ID") @RequestParam(value = "excludeSubjectId", required = false) String excludeSubjectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.checkNameUniq(authentication.getName(), subjectName, excludeSubjectId));
    }

}