package com.ck.quiz.jwt.controller;

import com.ck.quiz.utils.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * JWT Token 生成控制器
 * 用于 API 测试时生成指定用户 ID 的 JWT Token
 */
@Tag(name = "JWT工具", description = "JWT Token 生成工具")
@RestController
@RequestMapping("/api/jwt")
public class JwtController {

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * 生成 JWT Token
     * 
     * @param userId 用户 ID
     * @return JWT Token 字符串
     */
    @Operation(summary = "生成JWT Token", description = "根据用户ID生成JWT Token，用于API测试")
    @PostMapping("/generate")
    public ResponseEntity<String> generateToken(@RequestParam String userId) {
        if (userId == null || userId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("用户 ID 不能为空");
        }
        String token = jwtUtil.generateToken(userId.trim());
        return ResponseEntity.ok(token);
    }
}
