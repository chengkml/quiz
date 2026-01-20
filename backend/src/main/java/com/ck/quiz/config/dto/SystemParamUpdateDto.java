package com.ck.quiz.config.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.config.entity.SystemParam;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SystemParamUpdateDto extends UpdateDto {

    private String paramName;
    private String paramValue;
    private String defaultValue;
    private SystemParam.ParamType paramType;
    private String category;
    private String description;
    private Boolean isEncrypted;
    private Boolean isReadonly;
    private SystemParam.ParamStatus status;
    private Integer sortOrder;
}
