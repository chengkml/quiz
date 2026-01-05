package com.ck.quiz.base.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class QueryDto {

    private String keyWord;

    @Min(value = 0, message = "页码不能小于0")
    private Integer pageNum = 0;

    @Min(value = 1, message = "每页数量不能小于1")
    @Max(value = 100, message = "每页数量不能大于100")
    private Integer pageSize = 20;

}
