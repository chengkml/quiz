package com.ck.quiz.lifecountdown.controller;

import com.ck.quiz.lifecountdown.dto.LifeCountdownGenerateWarningDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownProfileDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownSaveDto;
import com.ck.quiz.lifecountdown.dto.LifeCountdownWarningDto;
import com.ck.quiz.lifecountdown.service.LifeCountdownService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/life-countdown")
@Tag(name = "生命倒计时", description = "生命倒计时与今日警示语")
public class LifeCountdownController {

    private final LifeCountdownService lifeCountdownService;

    @GetMapping("/current")
    @Operation(summary = "获取当前用户生命倒计时配置")
    public ResponseEntity<LifeCountdownProfileDto> current() {
        return ResponseEntity.ok(lifeCountdownService.getCurrentProfile(currentUserId()));
    }

    @PostMapping("/save")
    @Operation(summary = "保存死亡日期")
    public ResponseEntity<LifeCountdownProfileDto> save(@Valid @RequestBody LifeCountdownSaveDto dto) {
        return ResponseEntity.ok(lifeCountdownService.saveProfile(currentUserId(), dto));
    }

    @PostMapping("/generate-warning")
    @Operation(summary = "生成或获取今日警示语")
    public ResponseEntity<LifeCountdownWarningDto> generateWarning(
            @RequestBody(required = false) LifeCountdownGenerateWarningDto dto) {
        LifeCountdownGenerateWarningDto request = dto == null ? new LifeCountdownGenerateWarningDto() : dto;
        return ResponseEntity.ok(lifeCountdownService.generateTodayWarning(currentUserId(), request));
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : null;
    }
}
