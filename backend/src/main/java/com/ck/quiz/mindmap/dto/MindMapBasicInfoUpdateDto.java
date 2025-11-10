package com.ck.quiz.mindmap.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 思维导图基本信息更新 DTO
 * 用于更新思维导图的基本信息（名称、描述等）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapBasicInfoUpdateDto {

    /**
     * 思维导图唯一标识
     */
    @NotBlank(message = "思维导图ID不能为空")
    private String id;

    /**
     * 导图名称
     */
    @NotBlank(message = "导图名称不能为空")
    private String mapName;

    /**
     * 导图描述
     */
    private String description;
}