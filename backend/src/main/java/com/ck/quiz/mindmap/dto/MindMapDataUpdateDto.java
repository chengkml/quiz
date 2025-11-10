package com.ck.quiz.mindmap.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 思维导图数据更新 DTO
 * 用于更新思维导图的实际数据内容
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapDataUpdateDto {

    /**
     * 思维导图唯一标识
     */
    @NotBlank(message = "思维导图ID不能为空")
    private String id;

    /**
     * 导图整体JSON结构（完整导图数据）
     */
    @NotBlank(message = "导图数据不能为空")
    private String mapData;
}