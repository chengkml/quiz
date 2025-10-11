package com.ck.quiz.user.controller;

import com.ck.quiz.user.dto.UserCreateDto;
import com.ck.quiz.user.dto.UserDto;
import com.ck.quiz.user.dto.UserLoginDto;
import com.ck.quiz.user.dto.UserUpdateDto;
import com.ck.quiz.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@Tag(name = "用户管理", description = "用户相关的API接口")
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Operation(summary = "用户注册", description = "创建新用户账号")
    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Parameter(description = "用户创建信息", required = true) @Valid @RequestBody UserCreateDto userCreateDto) {
        return ResponseEntity.ok(userService.register(userCreateDto));
    }

    @Operation(summary = "用户登录", description = "用户账号登录验证")
    @PostMapping("/login")
    public ResponseEntity<UserDto> login(HttpServletRequest request, @Valid @RequestBody UserLoginDto userLoginDto) {
        UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(userLoginDto.getUserId(), userLoginDto.getUserPwd());

        Authentication authentication = authenticationManager.authenticate(token);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDto userDto = userService.getUserById(userLoginDto.getUserId());

        HttpSession session = request.getSession(true);
        SecurityContext context = SecurityContextHolder.getContext();
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        return ResponseEntity.ok(userDto);
    }

    @Operation(summary = "用户登出", description = "注销当前登录用户")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate(); // 使当前 session 失效
        }
        SecurityContextHolder.clearContext(); // 清除 Spring Security 上下文
        return ResponseEntity.ok("用户已成功登出");
    }

    @Operation(summary = "获取用户详情", description = "根据用户ID获取用户详细信息")
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @Operation(summary = "分页查询用户", description = "根据条件分页查询用户列表")
    @GetMapping("search")
    public ResponseEntity<Page<UserDto>> searchUsers(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "create_date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(userService.searchUsers(userId, name, state, sortBy, sortDir, page, size));
    }

    @Operation(summary = "更新用户信息", description = "更新指定用户的基本信息")
    @PutMapping("/update")
    public ResponseEntity<UserDto> updateUser(@Valid @RequestBody UserUpdateDto userUpdateDto) {
        return ResponseEntity.ok(userService.updateUser(userUpdateDto));
    }

    @Operation(summary = "管理员重置密码", description = "管理员为用户重置登录密码")
    @PutMapping("/{id}/reset/password")
    public ResponseEntity<Boolean> resetPassword(@PathVariable String id, @RequestParam String newPassword) {
        return ResponseEntity.ok(userService.resetPassword(id, newPassword));
    }

    @Operation(summary = "启用用户", description = "启用指定的用户账号")
    @PostMapping("/{id}/enable")
    public ResponseEntity enableUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.enableUser(id));
    }

    @Operation(summary = "禁用用户", description = "禁用指定的用户账号")
    @PostMapping("/{id}/disable")
    public ResponseEntity disableUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.disableUser(id));
    }

    @Operation(summary = "检查用户ID", description = "检查指定的用户ID是否已存在")
    @GetMapping("/check/userId")
    public ResponseEntity<Boolean> checkUserId(@RequestParam String userId) {
        return ResponseEntity.ok(userService.existsByUserId(userId));
    }

    @Operation(summary = "删除用户", description = "删除指定的用户账号")
    @DeleteMapping("/delete/{id}")
    public ResponseEntity deleteUser(@PathVariable String id) {
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}
