package com.ck.quiz.config.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.config.entity.SystemParam;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SystemParamCreateDto extends CreateDto {

    @NotBlank(message = "参数名称不能为空")
    private String paramName;
    private String paramValue;
    private String defaultValue;
    private SystemParam.ParamType paramType = SystemParam.ParamType.STRING;
    private String category;
    private String description;
    private Boolean isEncrypted = false;
    private Boolean isReadonly = false;
    private SystemParam.ParamStatus status = SystemParam.ParamStatus.ACTIVE;
    private Integer sortOrder;
}
