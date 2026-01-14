package com.ck.quiz.syslog.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SysLogUpdateDto extends UpdateDto {

    private String module;

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

