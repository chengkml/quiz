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

    /**
     * 主键ID
     */
    private String appId;

    /**
     * 小程序 AppId
     */
    private String appid;

    /**
     * 小程序名称
     */
    private String appName;

    /**
     * 创建时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}