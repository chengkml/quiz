package com.ck.quiz.wechart.service;


import com.ck.quiz.wechart.dto.WxBindDto;
import com.ck.quiz.wechart.dto.WxLoginDto;
import com.ck.quiz.wechart.dto.WxLoginRespDto;

/**
 * 微信小程序用户服务接口
 */
public interface WxUserMappingService {

    /**
     * 小程序登录
     * @param dto 登录请求
     * @return JWT 或 firstLogin = true
     */
    WxLoginRespDto login(WxLoginDto dto);

    /**
     * 小程序绑定 Web 用户接口
     * @param dto 绑定请求（Web 用户账号 + 密码）
     * @return JWT
     */
    WxLoginRespDto bind(WxBindDto dto);
}