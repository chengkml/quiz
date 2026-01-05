package com.ck.quiz.base.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDto {

    @NotBlank(message = "ID不能为空")
    @Size(max = 32, message = "ID长度不能超过32个字符")
    private String id;

}
