package com.ck.quiz.group.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupQueryDto {

    @Size(max = 255)
    private String keyWord;

    @Min(0)
    private Integer pageNum = 0;

    @Min(1)
    @Max(100)
    private Integer pageSize = 20;

}
