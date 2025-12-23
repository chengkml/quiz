package com.ck.quiz.config.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 系统参数查询DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemParamQueryDto {

    private String paramName;
    private String category;
    private String status;
    private Integer page = 0;
    private Integer size = 20;
}
