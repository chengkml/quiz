package com.ck.quiz.subject.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.service.SubjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "主题管理", description = "主题相关的API接口")
@RestController
@RequestMapping("/api/subject")
public class SubjectController extends BaseController<SubjectCreateDto, SubjectUpdateDto, SubjectQueryDto, SubjectDto> {

    @Autowired
    private SubjectService subjectService;

    @Operation(summary = "检查主题英文名", description = "检查主题英文名是否已存在")
    @GetMapping("/check/name")
    public ResponseEntity<Boolean> checkSubjectName(
            @Parameter(description = "主题英文名", required = true) @RequestParam("subjectName") String subjectName,
            @Parameter(description = "排除的主题ID") @RequestParam(value = "excludeSubjectId", required = false) String excludeSubjectId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(subjectService.checkNameUniq(authentication.getName(), subjectName, excludeSubjectId));
    }

    @Override
    protected BaseService<SubjectCreateDto, SubjectUpdateDto, SubjectQueryDto, SubjectDto, ?> getService() {
        return subjectService;
    }

}