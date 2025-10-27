package com.ck.quiz.mindmap.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 思维导图创建 DTO
 * 用于创建新的思维导图时传输数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapCreateDto {

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

    /**
     * 是否共享
     */
    private Boolean isShared = false;
}