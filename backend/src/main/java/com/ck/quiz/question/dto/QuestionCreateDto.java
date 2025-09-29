package com.ck.quiz.question.dto;

import com.ck.quiz.question.entity.Question;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 题目创建 DTO
 * 用于接收前端传来的题目创建信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCreateDto {

    /**
     * 题目类型：SINGLE, MULTIPLE, BLANK, SHORT_ANSWER
     */
    @NotNull(message = "题目类型不能为空")
    private Question.QuestionType type;

    /**
     * 题干内容
     */
    @NotBlank(message = "题干内容不能为空")
    private String content;

    /**
     * 选项（JSON 格式存储）
     * 对于单选题和多选题必填，填空题和简答题可选
     */
    private String options;

    /**
     * 标准答案（JSON 格式存储）
     */
    @NotBlank(message = "标准答案不能为空")
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
    private Integer difficultyLevel = 1;
}