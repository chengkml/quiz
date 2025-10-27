package com.ck.quiz.mindmap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 思维导图信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输思维导图详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapDto {

    /**
     * 思维导图唯一标识
     */
    private String id;

    /**
     * 导图名称
     */
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
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    private String createUserName;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}