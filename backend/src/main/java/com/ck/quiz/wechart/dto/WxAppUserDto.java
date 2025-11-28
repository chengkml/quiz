package com.ck.quiz.wechart.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxAppUserDto {

    private String userId;

    private String userName;

    private String appId;

    private String appName;

    private String openId;

    private LocalDateTime createTime;
}
