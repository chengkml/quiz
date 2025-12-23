package com.ck.quiz.config.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统参数创建DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemParamCreateDto {

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
}
