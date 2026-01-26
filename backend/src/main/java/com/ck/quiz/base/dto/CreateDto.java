package com.ck.quiz.base.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDto {

    @Size(max = 128, message = "分组名不能超过128个字符")
    private String group;

    private java.util.List<String> tags;

}
