package com.ck.quiz.question.service;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 题目管理服务接口
 * <p>
 * 定义了题目相关的核心业务操作，包括增删改查、分页查询、统计等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface QuestionService {

    /**
     * 创建题目
     *
     * @param questionCreateDto 题目创建信息（包含题干、选项、答案等）
     * @return 创建成功后的题目信息
     */
    QuestionDto createQuestion(QuestionCreateDto questionCreateDto);

    /**
     * 更新题目
     *
     * @param questionUpdateDto 题目更新信息（包含题目ID和待更新字段）
     * @return 更新后的题目信息
     */
    QuestionDto updateQuestion(QuestionUpdateDto questionUpdateDto);

    /**
     * 删除题目
     *
     * @param questionId 题目ID
     * @return 被删除的题目信息（可用于前端回显或确认）
     */
    QuestionDto deleteQuestion(String questionId);

    /**
     * 根据ID获取题目信息
     *
     * @param questionId 题目ID
     * @return 对应的题目信息，如果不存在可返回 null 或抛异常
     */
    QuestionDto getQuestionById(String questionId);

    /**
     * 分页查询题目列表
     *
     * @param queryDto 查询条件（支持题目类型、难度、内容模糊查询、分页参数等）
     * @return 分页封装的题目列表
     */
    Page<QuestionDto> searchQuestions(QuestionQueryDto queryDto);

    /**
     * 将实体类对象转换为传输对象
     *
     * @param question 题目实体对象
     * @return 题目DTO
     */
    QuestionDto convertToDto(Question question);

    /**
     * 根据知识点描述生成题目
     *
     * @param knowledgeDescr
     * @param num
     * @return
     */
    List<QuestionCreateDto> generateQuestions(String knowledgeDescr, int num);

    List<QuestionDto> createQuestions(List<QuestionCreateDto> questionCreateDtos);
}