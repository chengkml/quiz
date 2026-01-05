package com.ck.quiz.subject.dto;

import com.ck.quiz.base.dto.UpdateDto;

import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class SubjectUpdateDto extends UpdateDto {

    @Size(max = 64, message = "主题英文名长度不能超过64个字符")
    private String name;

    @Size(max = 128, message = "主题中文名长度不能超过128个字符")
    private String label;

    @Size(max = 512, message = "主题描述长度不能超过512个字符")
    private String descr;
}