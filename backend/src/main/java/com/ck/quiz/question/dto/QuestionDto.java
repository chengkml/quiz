package com.ck.quiz.question.dto;

import com.ck.quiz.question.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 题目信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输题目详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionDto {

    /**
     * 题目唯一标识
     */
    private String id;

    /**
     * 题目类型：SINGLE, MULTIPLE, BLANK, SHORT_ANSWER
     */
    private Question.QuestionType type;

    /**
     * 题干内容
     */
    private String content;

    /**
     * 选项（JSON 格式存储）
     */
    private String options;

    /**
     * 标准答案（JSON 格式存储）
     */
    private String answer;

    /**
     * 解析说明
     */
    private String explanation;

    /**
     * 难度等级 1-5
     */
    private Integer difficultyLevel;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}