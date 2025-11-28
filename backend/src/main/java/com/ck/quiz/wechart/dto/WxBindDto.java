package com.ck.quiz.wechart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxBindDto {
    private String appId;
    private String code;
    private String userId;     // Web 用户账号
    private String password;   // Web 用户密码
}