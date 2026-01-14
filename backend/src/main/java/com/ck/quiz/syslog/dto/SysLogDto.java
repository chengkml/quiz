package com.ck.quiz.syslog.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class SysLogDto extends Dto {

    private String id;

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

    private LocalDateTime createDate;

    private String createUser;

    private String createUserName;

    private LocalDateTime updateDate;

    private String updateUser;

    private String updateUserName;
}

