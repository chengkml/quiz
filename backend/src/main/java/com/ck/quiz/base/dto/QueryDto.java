package com.ck.quiz.base.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.List;

@Data
public class QueryDto {

    private String keyWord;
    
    private List<String> groups;

    @Min(value = 0, message = "页码不能小于0")
    private Integer pageNum = 0;

    @Min(value = 1, message = "每页数量不能小于1")
    @Max(value = 1000, message = "每页数量不能大于1000")
    private Integer pageSize = 20;

}
