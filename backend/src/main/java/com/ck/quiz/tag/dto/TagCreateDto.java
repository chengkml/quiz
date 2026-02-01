package com.ck.quiz.tag.dto;

import com.ck.quiz.base.dto.CreateDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TagCreateDto extends CreateDto {

    @NotBlank(message = "标签英文名不能为空")
    @Size(max = 128, message = "标签英文名不能超过128个字符")
    private String name;

    @NotBlank(message = "标签中文名不能为空")
    @Size(max = 256, message = "标签中文名不能超过256个字符")
    private String label;

    @Size(max = 64, message = "标签类型不能超过64个字符")
    private String type;

    @Size(max = 512, message = "标签描述不能超过512个字符")
    private String descr;

    @Size(max = 32, message = "标签颜色不能超过32个字符")
    private String color;
}
