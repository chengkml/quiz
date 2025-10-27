package com.ck.quiz.mindmap.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 思维导图更新 DTO
 * 用于更新思维导图时传输数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapUpdateDto {

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

    /**
     * 导图整体JSON结构（完整导图数据）
     */
    private String mapData;
}