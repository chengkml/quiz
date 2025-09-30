package com.ck.quiz.knowledge.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 知识点信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输知识点详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDto {

    /**
     * 知识点唯一标识
     */
    private String id;

    /**
     * 知识点名称
     */
    private String name;

    /**
     * 知识点描述信息
     */
    private String description;

    /**
     * 所属分类ID
     */
    private String categoryId;

    /**
     * 所属分类名称
     */
    private String categoryName;

    /**
     * 所属学科ID
     */
    private String subjectId;

    /**
     * 所属学科名称
     */
    private String subjectName;

    /**
     * 难度等级（1-5）
     */
    private Integer difficultyLevel;

    /**
     * 知识点创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建该知识点的用户ID
     */
    private String createUser;

    /**
     * 创建该知识点的用户名
     */
    private String createUserName;

    /**
     * 知识点最后更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 最后更新该知识点的用户ID
     */
    private String updateUser;

    /**
     * 最后更新该知识点的用户名
     */
    private String updateUserName;
}