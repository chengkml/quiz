package com.ck.quiz.syslog.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SysLogCreateDto extends CreateDto {

    @NotBlank(message = "模块不能为空")
    private String module;

    @NotBlank(message = "操作类型不能为空")
    private String action;

    private String requestUri;

    private String requestMethod;

    private String requestParams;

    private String responseData;

    private String success;

    private String errorMessage;

    private String ipAddress;

    private String userAgent;

    private Long costTime;
}

