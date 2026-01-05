package com.ck.quiz.category.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryUpdateDto extends UpdateDto {

    @Size(max = 64, message = "分类名称长度不能超过64个字符")
    private String name;

    @Size(max = 32, message = "父分类ID长度不能超过32个字符")
    private String parentId;

    @Size(max = 32, message = "学科ID长度不能超过32个字符")
    private String subjectId;

    @Size(max = 255, message = "分类描述长度不能超过255个字符")
    private String descr;

}