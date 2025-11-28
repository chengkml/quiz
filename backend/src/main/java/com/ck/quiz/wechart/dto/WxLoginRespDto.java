package com.ck.quiz.wechart.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 微信小程序登录响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxLoginRespDto {
    /**
     * 系统统一用户ID
     */
    private String userId;

    private String openId;

    /**
     * JWT token
     */
    private String token;

    /**
     * 是否首次登录（新用户）
     */
    private boolean firstLogin;
}