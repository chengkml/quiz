package com.ck.quiz.wechart.dto;


import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 小程序 App 更新 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxAppUpdateDto {

    private String id;

    @NotBlank(message = "appId不能为空")
    private String appId;

    /**
     * 小程序 AppSecret，可选更新
     */
    private String appSecret;

    /**
     * 小程序名称，可选更新
     */
    private String appName;

    private String appDescr;
}