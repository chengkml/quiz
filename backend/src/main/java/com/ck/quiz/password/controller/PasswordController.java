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
public class PasswordController extends BaseController<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto> {

    @Autowired
    private PasswordService passwordService;

    @Override
    protected BaseService<PasswordCreateDto, PasswordUpdateDto, PasswordQueryDto, PasswordDto, ?> getService() {
        return passwordService;
    }

    @Operation(summary = "发送查看验证码", description = "向当前登录用户邮箱发送查看明文密码验证码")
    @PostMapping("/send-salt")
    public ResponseEntity<Void> sendSalt() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        passwordService.sendViewSalt(authentication.getName());
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "获取解密密码", description = "验证码校验通过后获取指定条目的明文密码")
    @GetMapping("/decrypt/{id}")
    public ResponseEntity<String> getDecryptedPassword(@PathVariable String id, @RequestParam String salt) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String password = passwordService.getDecryptedPassword(id, authentication.getName(), salt);
        return ResponseEntity.ok(password);
    }
}
