package com.ck.quiz.exam.dto;

import com.ck.quiz.exam.entity.Exam;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 试卷查询 DTO
 * 用于封装试卷查询条件和分页参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQueryDto {

    /**
     * 试卷名称（模糊查询）
     */
    private String keyWord;

    /**
     * 状态
     */
    private Exam.ExamPaperStatus status;

    /**
     * 页码（从0开始）
     */
    private int pageNum = 0;

    /**
     * 每页大小
     */
    private int pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "create_date";

    /**
     * 排序方向：asc, desc
     */
    private String sortType = "desc";
}