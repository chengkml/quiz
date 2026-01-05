package com.ck.quiz.subject.dto;

import com.ck.quiz.base.dto.CreateDto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SubjectCreateDto extends CreateDto{

    @NotBlank(message = "主题英文名不能为空")
    @Size(max = 64, message = "主题英文名长度不能超过64个字符")
    private String name;

    @NotBlank(message = "主题中文名不能为空")
    @Size(max = 128, message = "主题中文名长度不能超过128个字符")
    private String label;

    @Size(max = 512, message = "主题描述长度不能超过512个字符")
    private String descr;

}