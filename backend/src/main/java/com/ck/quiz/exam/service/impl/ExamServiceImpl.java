package com.ck.quiz.exam.service.impl;

import com.ck.quiz.exam.dto.*;
import com.ck.quiz.exam.entity.Exam;
import com.ck.quiz.exam.entity.ExamQuestion;
import com.ck.quiz.exam.repository.ExamRepository;
import com.ck.quiz.exam.repository.ExamQuestionRepository;
import com.ck.quiz.exam.service.ExamService;
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

import java.util.*;
import java.util.stream.Collectors;

/**
 * 试卷管理服务实现类
 */
@Service
public class ExamServiceImpl implements ExamService {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private ExamQuestionRepository examQuestionRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionService questionService;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public ExamDto createExam(ExamCreateDto examCreateDto) {
        Exam exam = new Exam();
        exam.setId(IdHelper.genUuid());
        exam.setName(examCreateDto.getName());
        exam.setDescription(examCreateDto.getDescription());
        exam.setTotalScore(examCreateDto.getTotalScore());
        exam.setDurationMinutes(examCreateDto.getDurationMinutes());
        exam.setStatus(examCreateDto.getStatus());

        Exam savedExam = examRepository.save(exam);

        // 添加题目到试卷
        if (examCreateDto.getQuestions() != null && !examCreateDto.getQuestions().isEmpty()) {
            for (ExamQuestionCreateDto questionDto : examCreateDto.getQuestions()) {
                addQuestionToExam(savedExam.getId(), questionDto.getQuestionId(), 
                                questionDto.getOrderNo(), questionDto.getScore());
            }
        }

        return getExamById(savedExam.getId());
    }

    @Override
    @Transactional
    public ExamDto updateExam(ExamUpdateDto examUpdateDto) {
        Optional<Exam> optionalExam = examRepository.findById(examUpdateDto.getId());
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examUpdateDto.getId());
        }

        Exam exam = optionalExam.get();

        // 只更新非空字段
        if (StringUtils.hasText(examUpdateDto.getName())) {
            exam.setName(examUpdateDto.getName());
        }
        if (StringUtils.hasText(examUpdateDto.getDescription())) {
            exam.setDescription(examUpdateDto.getDescription());
        }
        if (examUpdateDto.getTotalScore() != null) {
            exam.setTotalScore(examUpdateDto.getTotalScore());
        }
        if (examUpdateDto.getDurationMinutes() != null) {
            exam.setDurationMinutes(examUpdateDto.getDurationMinutes());
        }
        if (examUpdateDto.getStatus() != null) {
            exam.setStatus(examUpdateDto.getStatus());
        }

        Exam savedExam = examRepository.save(exam);

        // 更新题目列表
        if (examUpdateDto.getQuestions() != null) {
            // 删除原有题目关系
            examQuestionRepository.deleteByExamId(exam.getId());
            
            // 添加新的题目关系
            for (ExamQuestionCreateDto questionDto : examUpdateDto.getQuestions()) {
                addQuestionToExam(exam.getId(), questionDto.getQuestionId(), 
                                questionDto.getOrderNo(), questionDto.getScore());
            }
        }

        return convertToDto(savedExam);
    }

    @Override
    @Transactional
    public ExamDto deleteExam(String examId) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }

        ExamDto examDto = convertToDto(optionalExam.get());
        examRepository.deleteById(examId);
        return examDto;
    }

    @Override
    @Transactional(readOnly = true)
    public ExamDto getExamById(String examId) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }
        return convertToDto(optionalExam.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamDto> searchExams(ExamQueryDto queryDto) {
        StringBuilder sb = new StringBuilder("SELECT * FROM exam WHERE 1=1 ");
        StringBuilder countSb = new StringBuilder("SELECT count(*) FROM exam WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 试卷名称模糊查询
        JdbcQueryHelper.lowerLike("name", queryDto.getName(), " AND lower(name) LIKE :name ", params, jdbcTemplate, sb, countSb);

        // 试卷描述模糊查询
        JdbcQueryHelper.lowerLike("description", queryDto.getDescription(), " AND lower(description) LIKE :description ", params, jdbcTemplate, sb, countSb);

        // 状态精确查询
        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND status = :status ", params, sb, countSb);
        }

        // 创建人精确查询
        JdbcQueryHelper.equals("createUser", queryDto.getCreateUser(), " AND create_user = :createUser ", params, sb, countSb);

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sb);

        // 分页 SQL
        String listSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sb.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        // 查询数据
        List<ExamDto> exams = jdbcTemplate.query(listSql, params, (rs, rowNum) -> {
            ExamDto dto = new ExamDto();
            dto.setId(rs.getString("paper_id"));
            dto.setName(rs.getString("name"));
            dto.setDescription(rs.getString("description"));
            dto.setStatus(Exam.ExamPaperStatus.valueOf(rs.getString("status")));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
            return dto;
        });

        // 封装分页对象
        return JdbcQueryHelper.toPage(jdbcTemplate, countSb.toString(), params, exams, queryDto.getPageNum(), queryDto.getPageSize());
    }


    @Override
    public ExamDto convertToDto(Exam exam) {
        ExamDto examDto = new ExamDto();
        BeanUtils.copyProperties(exam, examDto);

        // 转换题目列表
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderNo(exam.getId());
        List<ExamQuestionDto> questionDtos = examQuestions.stream()
                .map(this::convertExamQuestionToDto)
                .collect(Collectors.toList());
        examDto.setQuestions(questionDtos);

        return examDto;
    }

    @Override
    @Transactional
    public ExamDto publishExam(String examId) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }

        Exam exam = optionalExam.get();
        exam.setStatus(Exam.ExamPaperStatus.PUBLISHED);
        Exam savedExam = examRepository.save(exam);
        return convertToDto(savedExam);
    }

    @Override
    @Transactional
    public ExamDto archiveExam(String examId) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }

        Exam exam = optionalExam.get();
        exam.setStatus(Exam.ExamPaperStatus.ARCHIVED);
        Exam savedExam = examRepository.save(exam);
        return convertToDto(savedExam);
    }

    @Override
    @Transactional
    public void addQuestionToExam(String examId, String questionId, Integer orderNo, Integer score) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }

        Optional<Question> optionalQuestion = questionRepository.findById(questionId);
        if (optionalQuestion.isEmpty()) {
            throw new RuntimeException("题目不存在，ID: " + questionId);
        }

        ExamQuestion examQuestion = new ExamQuestion();
        examQuestion.setId(IdHelper.genUuid());
        examQuestion.setExam(optionalExam.get());
        examQuestion.setQuestion(optionalQuestion.get());
        examQuestion.setOrderNo(orderNo);
        examQuestion.setScore(score);

        examQuestionRepository.save(examQuestion);
    }

    @Override
    @Transactional
    public void removeQuestionFromExam(String examId, String questionId) {
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderNo(examId);
        examQuestions.stream()
                .filter(eq -> eq.getQuestion().getId().equals(questionId))
                .findFirst()
                .ifPresent(examQuestionRepository::delete);
    }

    @Override
    @Transactional
    public void updateExamQuestion(String examId, String questionId, Integer orderNo, Integer score) {
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderNo(examId);
        examQuestions.stream()
                .filter(eq -> eq.getQuestion().getId().equals(questionId))
                .findFirst()
                .ifPresent(examQuestion -> {
                    if (orderNo != null) {
                        examQuestion.setOrderNo(orderNo);
                    }
                    if (score != null) {
                        examQuestion.setScore(score);
                    }
                    examQuestionRepository.save(examQuestion);
                });
    }

    /**
     * 将数据库查询结果映射为ExamDto
     */
    private ExamDto mapToExamDto(Map<String, Object> row) {
        ExamDto examDto = new ExamDto();
        examDto.setId((String) row.get("paper_id"));
        examDto.setName((String) row.get("name"));
        examDto.setDescription((String) row.get("description"));
        examDto.setTotalScore((Integer) row.get("total_score"));
        examDto.setDurationMinutes((Integer) row.get("duration_minutes"));
        examDto.setStatus(Exam.ExamPaperStatus.valueOf((String) row.get("status")));
        examDto.setCreateDate((java.time.LocalDateTime) row.get("create_date"));
        examDto.setCreateUser((String) row.get("create_user"));
        examDto.setUpdateDate((java.time.LocalDateTime) row.get("update_date"));
        examDto.setUpdateUser((String) row.get("update_user"));
        return examDto;
    }

    /**
     * 将ExamQuestion实体转换为ExamQuestionDto
     */
    private ExamQuestionDto convertExamQuestionToDto(ExamQuestion examQuestion) {
        ExamQuestionDto dto = new ExamQuestionDto();
        dto.setId(examQuestion.getId());
        dto.setQuestion(questionService.convertToDto(examQuestion.getQuestion()));
        dto.setOrderNo(examQuestion.getOrderNo());
        dto.setScore(examQuestion.getScore());
        return dto;
    }
}