package com.ck.quiz.exam.dto;

import com.ck.quiz.exam.entity.Exam;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 试卷更新 DTO
 * 用于接收更新试卷时的请求参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamUpdateDto {

    /**
     * 试卷ID
     */
    @NotBlank(message = "试卷ID不能为空")
    private String id;

    /**
     * 试卷名称
     */
    @Size(max = 128, message = "试卷名称长度不能超过128个字符")
    private String name;

    /**
     * 试卷描述
     */
    @Size(max = 512, message = "试卷描述长度不能超过512个字符")
    private String description;

    /**
     * 总分
     */
    @Positive(message = "总分必须为正数")
    private Integer totalScore;

    /**
     * 考试时长（分钟）
     */
    @Positive(message = "考试时长必须为正数")
    private Integer durationMinutes;
    
    /**
     * 归属学科ID
     */
    private Long subjectId;

    /**
     * 状态
     */
    private Exam.ExamPaperStatus status;

    /**
     * 试卷中的题目信息
     */
    @Valid
    private List<ExamQuestionCreateDto> questions;
}