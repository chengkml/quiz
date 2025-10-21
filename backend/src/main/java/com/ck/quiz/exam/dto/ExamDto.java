package com.ck.quiz.exam.dto;

import com.ck.quiz.exam.entity.Exam;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 试卷信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输试卷详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamDto {

    /**
     * 试卷唯一标识
     */
    private String id;

    /**
     * 试卷名称
     */
    private String name;

    /**
     * 试卷描述
     */
    private String description;

    /**
     * 总分
     */
    private Integer totalScore;

    /**
     * 考试时长（分钟）
     */
    private Integer durationMinutes;
    
    /**
     * 归属学科ID
     */
    private Long subjectId;
    
    /**
     * 归属学科名称
     */
    private String subjectName;

    /**
     * 状态：DRAFT, PUBLISHED, ARCHIVED
     */
    private Exam.ExamPaperStatus status;

    /**
     * 试卷中的题目信息
     */
    private List<ExamQuestionDto> questions;

    private int questionNum;

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