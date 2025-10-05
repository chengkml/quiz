package com.ck.quiz.subject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 学科信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输学科详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectDto {

    /**
     * 学科唯一标识
     */
    private String id;

    /**
     * 学科名称
     */
    private String name;

    /**
     * 学科描述信息
     */
    private String description;

    /**
     * 学科创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建该学科的用户ID
     */
    private String createUser;

    /**
     * 创建该学科的用户中文名
     */
    private String createUserName;

    /**
     * 学科最后更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 最后更新该学科的用户ID
     */
    private String updateUser;

    /**
     * 最后更新该学科的用户名
     */
    private String updateUserName;
}