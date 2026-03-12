package com.ck.quiz.diary.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.diary.dto.DiaryCreateDto;
import com.ck.quiz.diary.dto.DiaryDto;
import com.ck.quiz.diary.dto.DiaryQueryDto;
import com.ck.quiz.diary.dto.DiaryUpdateDto;
import com.ck.quiz.diary.service.DiaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "日记管理", description = "日记的创建、更新、归档、查询")
@RestController
@RequestMapping("/api/diary")
public class DiaryController extends BaseController<DiaryCreateDto, DiaryUpdateDto, DiaryQueryDto, DiaryDto> {

    @Autowired
    private DiaryService diaryService;

    @Operation(summary = "归档日记", description = "根据日记ID切换归档状态")
    @PostMapping("/{id}/archive")
    public ResponseEntity<DiaryDto> archive(
            @Parameter(description = "日记ID", required = true) @PathVariable("id") String id,
            @Parameter(description = "是否归档") @RequestParam(value = "archived", defaultValue = "true") Boolean archived) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(diaryService.archive(authentication.getName(), id, archived));
    }

    @Override
    protected BaseService<DiaryCreateDto, DiaryUpdateDto, DiaryQueryDto, DiaryDto, ?> getService() {
        return diaryService;
    }
}
