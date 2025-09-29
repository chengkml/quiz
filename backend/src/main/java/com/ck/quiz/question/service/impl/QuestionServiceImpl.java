package com.ck.quiz.question.service.impl;

import com.ck.quiz.question.dto.QuestionCreateDto;
import com.ck.quiz.question.dto.QuestionDto;
import com.ck.quiz.question.dto.QuestionQueryDto;
import com.ck.quiz.question.dto.QuestionUpdateDto;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 题目管理服务实现类
 */
@Service
public class QuestionServiceImpl implements QuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public QuestionDto createQuestion(QuestionCreateDto questionCreateDto) {
        Question question = new Question();
        question.setId(IdHelper.genUuid());
        question.setType(questionCreateDto.getType());
        question.setContent(questionCreateDto.getContent());
        question.setOptions(questionCreateDto.getOptions());
        question.setAnswer(questionCreateDto.getAnswer());
        question.setExplanation(questionCreateDto.getExplanation());
        question.setDifficultyLevel(questionCreateDto.getDifficultyLevel());

        Question savedQuestion = questionRepository.save(question);
        return convertToDto(savedQuestion);
    }

    @Override
    @Transactional
    public QuestionDto updateQuestion(QuestionUpdateDto questionUpdateDto) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionUpdateDto.getId());
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionUpdateDto.getId());
        }

        Question question = optionalQuestion.get();
        
        // 只更新非空字段
        if (questionUpdateDto.getType() != null) {
            question.setType(questionUpdateDto.getType());
        }
        if (StringUtils.hasText(questionUpdateDto.getContent())) {
            question.setContent(questionUpdateDto.getContent());
        }
        if (questionUpdateDto.getOptions() != null) {
            question.setOptions(questionUpdateDto.getOptions());
        }
        if (StringUtils.hasText(questionUpdateDto.getAnswer())) {
            question.setAnswer(questionUpdateDto.getAnswer());
        }
        if (questionUpdateDto.getExplanation() != null) {
            question.setExplanation(questionUpdateDto.getExplanation());
        }
        if (questionUpdateDto.getDifficultyLevel() != null) {
            question.setDifficultyLevel(questionUpdateDto.getDifficultyLevel());
        }

        Question savedQuestion = questionRepository.save(question);
        return convertToDto(savedQuestion);
    }

    @Override
    @Transactional
    public QuestionDto deleteQuestion(String questionId) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionId);
        }

        Question question = optionalQuestion.get();
        questionRepository.delete(question);
        return convertToDto(question);
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionDto getQuestionById(String questionId) {
        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionId);
        }
        return convertToDto(optionalQuestion.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<QuestionDto> searchQuestions(QuestionQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT q.question_id AS id, q.type, q.content, q.options, q.answer, q.explanation, " +
                        "q.difficulty_level, q.create_date, q.create_user, q.update_date, q.update_user " +
                        "FROM question q WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM question q WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        // 添加查询条件
        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND q.type = :type ", params, sql, countSql);
        }
        
        if (StringUtils.hasText(queryDto.getContent())) {
            JdbcQueryHelper.lowerLike("content", queryDto.getContent(), " AND LOWER(q.content) LIKE :content ", params, jdbcTemplate, sql, countSql);
        }
        
        if (queryDto.getDifficultyLevel() != null) {
            JdbcQueryHelper.equals("difficultyLevel", String.valueOf(queryDto.getDifficultyLevel()), " AND q.difficulty_level = :difficultyLevel ", params, sql, countSql);
        }
        
        if (StringUtils.hasText(queryDto.getCreateUser())) {
            JdbcQueryHelper.equals("createUser", queryDto.getCreateUser(), " AND q.create_user = :createUser ", params, sql, countSql);
        }

        // 添加排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);
        
        // 分页查询
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<QuestionDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            QuestionDto dto = new QuestionDto();
            dto.setId(rs.getString("id"));
            dto.setType(Question.QuestionType.valueOf(rs.getString("type")));
            dto.setContent(rs.getString("content"));
            dto.setOptions(rs.getString("options"));
            dto.setAnswer(rs.getString("answer"));
            dto.setExplanation(rs.getString("explanation"));
            dto.setDifficultyLevel(rs.getInt("difficulty_level"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        // 获取总数
        Long total = jdbcTemplate.queryForObject(countSql.toString(), params, Long.class);
        
        return new PageImpl<>(list, 
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()), 
                total != null ? total : 0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByType(Question.QuestionType type) {
        List<Question> questions = questionRepository.findByType(type);
        return questions.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByDifficulty(Integer difficultyLevel) {
        List<Question> questions = questionRepository.findByDifficultyLevel(difficultyLevel);
        return questions.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionDto> getQuestionsByTypeAndDifficulty(Question.QuestionType type, Integer difficultyLevel) {
        List<Question> questions = questionRepository.findByTypeAndDifficultyLevel(type, difficultyLevel);
        return questions.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countQuestionsByType(Question.QuestionType type) {
        return questionRepository.countByType(type);
    }

    @Override
    @Transactional(readOnly = true)
    public long countQuestionsByDifficulty(Integer difficultyLevel) {
        return questionRepository.countByDifficultyLevel(difficultyLevel);
    }

    @Override
    public QuestionDto convertToDto(Question question) {
        QuestionDto dto = new QuestionDto();
        BeanUtils.copyProperties(question, dto);
        return dto;
    }
}