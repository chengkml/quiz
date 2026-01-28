package com.ck.quiz.password.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.password.dto.PasswordCreateDto;
import com.ck.quiz.password.dto.PasswordDto;
import com.ck.quiz.password.dto.PasswordQueryDto;
import com.ck.quiz.password.dto.PasswordUpdateDto;
import com.ck.quiz.password.service.PasswordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "密码管理", description = "个人密码本 API")
@RestController
@RequestMapping("/api/password")
public class PasswordController
        extends BaseController<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto> {

    @Autowired
    private PasswordService passwordService;

    @Override
    protected BaseService<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto, ?> getService() {
        return passwordService;
    }

    @Operation(summary = "获取解密密码", description = "获取指定条目的明文密码")
    @GetMapping("/decrypt/{id}")
    public ResponseEntity<String> getDecryptedPassword(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String password = passwordService.getDecryptedPassword(id, authentication.getName());
        return ResponseEntity.ok(password);
    }
}
