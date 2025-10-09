package com.ck.quiz.question.dto;

import com.ck.quiz.question.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 题目查询 DTO
 * 用于接收前端传来的题目查询条件，支持分页和排序
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionQueryDto {

    /**
     * 题目类型
     */
    private Question.QuestionType type;

    /**
     * 题干内容，支持模糊查询
     */
    private String content;

    /**
     * 难度等级
     */
    private Integer difficultyLevel;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 当前页码，从0开始
     */
    private Integer pageNum = 0;

    /**
     * 每页显示条数
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "createDate";

    /**
     * 排序方式，asc 或 desc
     */
    private String sortType = "desc";

    private String subjectId;

    private String categoryId;
}