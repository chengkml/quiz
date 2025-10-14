package com.ck.quiz.exam.service;

import com.ck.quiz.exam.dto.ExamCreateDto;
import com.ck.quiz.exam.dto.ExamDto;
import com.ck.quiz.exam.dto.ExamQueryDto;
import com.ck.quiz.exam.dto.ExamResultDto;
import com.ck.quiz.exam.dto.ExamSubmitDto;
import com.ck.quiz.exam.dto.ExamUpdateDto;
import com.ck.quiz.exam.entity.Exam;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 试卷管理服务接口
 * <p>
 * 定义了试卷相关的核心业务操作，包括增删改查、分页查询、状态管理等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface ExamService {

    /**
     * 创建试卷
     *
     * @param examCreateDto 试卷创建信息（包含试卷基本信息和题目列表）
     * @return 创建成功后的试卷信息
     */
    ExamDto createExam(ExamCreateDto examCreateDto);

    /**
     * 更新试卷
     *
     * @param examUpdateDto 试卷更新信息（包含试卷ID和待更新字段）
     * @return 更新后的试卷信息
     */
    ExamDto updateExam(ExamUpdateDto examUpdateDto);

    /**
     * 删除试卷
     *
     * @param examId 试卷ID
     * @return 被删除的试卷信息（可用于前端回显或确认）
     */
    ExamDto deleteExam(String examId);

    /**
     * 根据ID获取试卷信息
     *
     * @param examId 试卷ID
     * @return 对应的试卷信息，如果不存在可返回 null 或抛异常
     */
    ExamDto getExamById(String examId);

    /**
     * 分页查询试卷
     *
     * @param queryDto 查询条件和分页参数
     * @return 分页结果，包含试卷列表和分页信息
     */
    Page<ExamDto> searchExams(ExamQueryDto queryDto);

    /**
     * 实体转DTO
     *
     * @param exam 试卷实体
     * @return 试卷DTO
     */
    ExamDto convertToDto(Exam exam);

    /**
     * 发布试卷
     *
     * @param examId 试卷ID
     * @return 发布后的试卷信息
     */
    ExamDto publishExam(String examId);

    /**
     * 归档试卷
     *
     * @param examId 试卷ID
     * @return 归档后的试卷信息
     */
    ExamDto archiveExam(String examId);

    /**
     * 添加题目到试卷
     *
     * @param examId 试卷ID
     * @param questionId 题目ID
     * @param orderNo 题目顺序
     * @param score 分值
     */
    void addQuestionToExam(String examId, String questionId, Integer orderNo, Integer score);

    /**
     * 从试卷中移除题目
     *
     * @param examId 试卷ID
     * @param questionId 题目ID
     */
    void removeQuestionFromExam(String examId, String questionId);

    /**
     * 更新试卷中题目的顺序和分值
     *
     * @param examId 试卷ID
     * @param questionId 题目ID
     * @param orderNo 新的题目顺序
     * @param score 新的分值
     */
    void updateExamQuestion(String examId, String questionId, Integer orderNo, Integer score);

    void addQuestionsToExam(String examId, List<String> questionIds);

    /**
     * 提交考试并评分
     *
     * @param examId 试卷ID
     * @param submitDto 提交内容（用户ID与答案列表）
     * @return 评分后的考试结果
     */
    ExamResultDto submitExam(String examId, ExamSubmitDto submitDto);
}