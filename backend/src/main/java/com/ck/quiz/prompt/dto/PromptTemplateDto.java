package com.ck.quiz.prompt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 提示词模板DTO
 * 用于在服务层与前端或其他系统交互时传输提示词模板详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromptTemplateDto {

    /**
     * 提示词模板ID
     */
    private Long id;

    /**
     * 模板名称
     */
    private String name;

    /**
     * 模板内容
     */
    private String content;

    /**
     * 模板描述
     */
    private String description;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建用户
     */
    private String createUser;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新用户
     */
    private String updateUser;
}