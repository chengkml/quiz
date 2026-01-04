package com.ck.quiz.tag.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TagCreateDto {

    @NotBlank(message = "标签英文名不能为空")
    @Size(max = 128, message = "标签英文名不能超过128个字符")
    private String name;

    @NotBlank(message = "标签中文名不能为空")
    @Size(max = 256, message = "标签中文名不能超过256个字符")
    private String label;
    
    @Size(max = 512, message = "标签描述不能超过512个字符")
    private String descr;

    @Size(max = 32, message = "标签颜色不能超过32个字符")
    private String color;
}
