package com.ck.quiz.config.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 系统参数DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemParamDto {

    private String id;
    private String paramKey;
    private String paramName;
    private String paramValue;
    private String defaultValue;
    private String paramType;
    private String category;
    private String description;
    private Boolean isEncrypted;
    private Boolean isReadonly;
    private String status;
    private Integer sortOrder;
    private String createUser;
    private LocalDateTime createDate;
    private String updateUser;
    private LocalDateTime updateDate;
}
