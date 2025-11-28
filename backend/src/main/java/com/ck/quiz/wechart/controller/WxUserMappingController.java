package com.ck.quiz.wechart.controller;

import com.ck.quiz.wechart.dto.WxBindDto;
import com.ck.quiz.wechart.dto.WxLoginDto;
import com.ck.quiz.wechart.dto.WxLoginRespDto;
import com.ck.quiz.wechart.service.WxUserMappingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 微信小程序用户接口
 */
@Tag(name = "微信小程序用户", description = "小程序登录及绑定 Web 用户接口")
@RestController
@RequestMapping("/api/wx/user")
public class WxUserMappingController {

    @Autowired
    private WxUserMappingService wxUserMappingService;

    /**
     * 小程序登录接口
     * <p>
     * 前端传 appid + code
     * 如果用户第一次登录，返回 firstLogin = true
     */
    @Operation(summary = "小程序登录", description = "微信小程序登录接口")
    @PostMapping("/login")
    public ResponseEntity<WxLoginRespDto> login(@Valid @RequestBody WxLoginDto dto) {
        WxLoginRespDto resp = wxUserMappingService.login(dto);
        return ResponseEntity.ok(resp);
    }

    /**
     * 小程序绑定 Web 用户接口
     * <p>
     * 前端传 openid + appid + Web 用户账号 + 密码
     */
    @Operation(summary = "绑定 Web 用户", description = "小程序首次登录绑定已有 Web 用户")
    @PostMapping("/bind")
    public ResponseEntity<WxLoginRespDto> bind(@Valid @RequestBody WxBindDto dto) {
        WxLoginRespDto resp = wxUserMappingService.bind(dto);
        return ResponseEntity.ok(resp);
    }
}
