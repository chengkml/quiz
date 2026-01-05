package com.ck.quiz.category.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryCreateDto extends CreateDto {

    @NotBlank(message = "目录名称不能为空")
    @Size(max = 64, message = "目录名称长度不能超过64个字符")
    private String name;

    @Size(max = 32, message = "父目录ID长度不能超过32个字符")
    private String parentId;

    @NotBlank(message = "所属主题ID不能为空")
    @Size(max = 32, message = "主题ID长度不能超过32个字符")
    private String subjectId;

    @Size(max = 255, message = "目录描述长度不能超过255个字符")
    private String descr;

}