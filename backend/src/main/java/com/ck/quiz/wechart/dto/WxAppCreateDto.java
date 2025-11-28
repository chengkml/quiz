package com.ck.quiz.wechart.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 小程序 App 创建 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxAppCreateDto {

    /**
     * 小程序 AppId
     */
    @NotBlank(message = "appid不能为空")
    private String appid;

    /**
     * 小程序 AppSecret
     */
    @NotBlank(message = "appSecret不能为空")
    private String appSecret;

    /**
     * 小程序名称，可选
     */
    private String appName;
}