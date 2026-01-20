package com.ck.quiz.config.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SystemParamQueryDto extends QueryDto {

    private String paramName;
    private String category;
    private String status;
}
