package com.ck.quiz.wechart.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 微信小程序用户登录请求 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxLoginDto {
    /**
     * 小程序 code
     */
    private String code;

    /**
     * 小程序 appId
     */
    private String appid;
}