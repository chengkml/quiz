package com.ck.quiz.question.dto;

import com.ck.quiz.question.entity.Question;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 题目更新 DTO
 * 用于接收前端传来的题目更新信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionUpdateDto {

    /**
     * 题目唯一标识
     */
    @NotBlank(message = "题目ID不能为空")
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
    @Min(value = 1, message = "难度等级最小为1")
    @Max(value = 5, message = "难度等级最大为5")
    private Integer difficultyLevel;
}