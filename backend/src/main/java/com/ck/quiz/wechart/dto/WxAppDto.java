package com.ck.quiz.wechart.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 小程序 App DTO
 * <p>
 * 用于返回给前端显示
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxAppDto {

    private String id;

    /**
     * 主键ID
     */
    private String appId;

    /**
     * 小程序名称
     */
    private String appName;

    private String appDescr;

    private String appSecret;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    private String createUser;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    private String updateUser;

    private String updateUserName;
}