package com.ck.quiz.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GroupCreateDto {

    @NotBlank(message = "分组英文名不能为空")
    @Size(max = 128, message = "分组英文名不能超过128个字符")
    private String name;

    @NotBlank(message = "分组中文名不能为空")
    @Size(max = 256, message = "分组中文名不能超过256个字符")
    private String label;
    
    @Size(max = 512, message = "分组描述不能超过512个字符")
    private String descr;

}