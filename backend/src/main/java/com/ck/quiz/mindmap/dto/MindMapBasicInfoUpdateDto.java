package com.ck.quiz.mindmap.dto;

import com.ck.quiz.base.dto.UpdateDto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class MindMapBasicInfoUpdateDto extends UpdateDto {

    @NotBlank(message = "导图名称不能为空")
    private String mapName;

    private String descr;
}