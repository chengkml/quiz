package com.ck.quiz.exam.service.impl;

import com.ck.quiz.exam.dto.*;
import com.ck.quiz.exam.entity.Exam;
import com.ck.quiz.exam.entity.ExamQuestion;
import com.ck.quiz.exam.repository.ExamRepository;
import com.ck.quiz.exam.repository.ExamQuestionRepository;
import com.ck.quiz.exam.entity.ExamResult;
import com.ck.quiz.exam.entity.ExamResultAnswer;
import com.ck.quiz.exam.repository.ExamResultRepository;
import com.ck.quiz.exam.repository.ExamResultAnswerRepository;
import com.ck.quiz.exam.service.ExamService;
import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.question.service.QuestionService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.apache.commons.collections.MapUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.sql.Timestamp;
import java.time.LocalDateTime;

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

    @Autowired
    private ExamResultRepository examResultRepository;

    @Autowired
    private ExamResultAnswerRepository examResultAnswerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    @Transactional
    public ExamDto createExam(ExamCreateDto examCreateDto) {
        Exam exam = new Exam();
        exam.setId(IdHelper.genUuid());
        exam.setName(examCreateDto.getName());
        exam.setDescription(examCreateDto.getDescription());
        exam.setTotalScore(examCreateDto.getTotalScore());
        exam.setDurationMinutes(examCreateDto.getDurationMinutes());
        exam.setSubjectId(examCreateDto.getSubjectId());
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
        if (examUpdateDto.getSubjectId() != null) {
            exam.setSubjectId(examUpdateDto.getSubjectId());
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
        List<ExamResult> resultsToDelete = examResultRepository.findAll().stream()
                .filter(r -> r.getExam() != null && examId.equals(r.getExam().getId()))
                .collect(Collectors.toList());
        if (!resultsToDelete.isEmpty()) {
            examResultRepository.deleteAll(resultsToDelete);
        }

        // 删除试卷（Exam -> ExamQuestion 已配置级联与孤儿删除，会自动清理试卷题目关系）
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
        StringBuilder sb = new StringBuilder(
                "SELECT e.paper_id, e.name, e.total_score, e.duration_minutes, " +
                        "       e.description, e.status, e.create_user, e.create_date, " +
                        "       e.subject_id, u.user_name AS create_user_name " +
                        "FROM exam e " +
                        "LEFT JOIN user u ON e.create_user = u.user_id " +
                        "WHERE 1=1 "
        );

        StringBuilder countSb = new StringBuilder("SELECT count(*) FROM exam e WHERE 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 试卷名称模糊查询（name 或 description）
        if (queryDto.getKeyWord() != null && !queryDto.getKeyWord().trim().isEmpty()) {
            String keywordLike = "%" + queryDto.getKeyWord().trim().toLowerCase() + "%";
            JdbcQueryHelper.lowerLike("keyWord", keywordLike,
                    " AND (LOWER(e.name) LIKE :keyWord OR LOWER(e.description) LIKE :keyWord) ", params, jdbcTemplate, sb, countSb);
        }

        // 状态精确查询
        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(),
                    " AND e.status = :status ", params, sb, countSb);
        }
        
        // 学科ID精确查询
        if (queryDto.getSubjectId() != null) {
            JdbcQueryHelper.equals("subjectId", queryDto.getSubjectId(),
                    " AND e.subject_id = :subjectId ", params, sb, countSb);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(),
                    " AND e.create_user = :createUser ", params, sb, countSb);
        }

        // 排序
        if (queryDto.getSortColumn() != null && !queryDto.getSortColumn().trim().isEmpty()) {
            JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sb);
        }

        // 分页 SQL
        String listSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sb.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        Map<String, ExamDto> idMap = new HashMap<>();
        // 查询数据
        List<ExamDto> exams = jdbcTemplate.query(listSql, params, (rs, rowNum) -> {
            ExamDto dto = new ExamDto();
            String id = rs.getString("paper_id");
            dto.setId(id);
            dto.setName(rs.getString("name"));
            dto.setTotalScore(rs.getInt("total_score"));
            dto.setDurationMinutes(rs.getInt("duration_minutes"));
            dto.setDescription(rs.getString("description"));
            dto.setStatus(Exam.ExamPaperStatus.valueOf(rs.getString("status")));
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name")); // 新增：从 user 表获取姓名
            dto.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
            dto.setSubjectId(rs.getLong("subject_id")); // 设置学科ID
            idMap.put(id, dto);
            return dto;
        });
        if(!idMap.isEmpty()) {
            params.put("paperIds", new ArrayList<>(idMap.keySet()));
            HumpHelper.lineToHump(jdbcTemplate.queryForList("select paper_id, count(*) num from exam_paper_question where paper_id in (:paperIds) group by paper_id", params)).forEach(map->{
                String paperId = MapUtils.getString(map, "paperId");
                int num = MapUtils.getIntValue(map, "num");
                if(idMap.containsKey(paperId)) {
                    idMap.get(paperId).setQuestionNum(num);
                }
            });
        }

        // 封装分页对象
        return JdbcQueryHelper.toPage(jdbcTemplate, countSb.toString(), params, exams, queryDto.getPageNum(), queryDto.getPageSize());
    }


    @Override
    public ExamDto convertToDto(Exam exam) {
        ExamDto examDto = new ExamDto();
        BeanUtils.copyProperties(exam, examDto);
        
        // 设置学科ID
        examDto.setSubjectId(exam.getSubjectId());

        // 转换题目列表
        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderNo(exam.getId());
        List<ExamQuestionDto> questionDtos = examQuestions.stream()
                .map(this::convertExamQuestionToDto)
                .collect(Collectors.toList());
        examDto.setQuestions(questionDtos);
        
        // 设置题目数量
        examDto.setQuestionNum(questionDtos.size());

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

    @Override
    public void addQuestionsToExam(String examId, List<String> questionIds) {
        // 分值默认给1，序号取已有题目中最大的开始累加，并避免重复添加
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }

        Exam exam = optionalExam.get();

        // 获取已存在的题目关系，计算当前最大顺序号，并记录已存在的题目ID，避免重复
        List<ExamQuestion> existing = examQuestionRepository.findByExamIdOrderByOrderNo(examId);
        int maxOrder = existing.stream()
                .map(ExamQuestion::getOrderNo)
                .max(Comparator.naturalOrder())
                .orElse(0);

        Set<String> existingQuestionIds = existing.stream()
                .map(eq -> eq.getQuestion().getId())
                .collect(Collectors.toSet());

        int orderCounter = maxOrder;
        for (String qid : questionIds) {
            // 跳过重复的题目
            if (existingQuestionIds.contains(qid)) {
                continue;
            }

            Optional<Question> optQuestion = questionRepository.findById(qid);
            if (optQuestion.isEmpty()) {
                throw new RuntimeException("题目不存在，ID: " + qid);
            }

            ExamQuestion eq = new ExamQuestion();
            eq.setId(IdHelper.genUuid());
            eq.setExam(exam);
            eq.setQuestion(optQuestion.get());
            eq.setOrderNo(++orderCounter);
            eq.setScore(1);
            examQuestionRepository.save(eq);
        }
    }

    @Override
    @Transactional
    public ExamResultDto submitExam(String examId, ExamSubmitDto submitDto) {
        Optional<Exam> optionalExam = examRepository.findById(examId);
        if (optionalExam.isEmpty()) {
            throw new RuntimeException("试卷不存在，ID: " + examId);
        }
        Exam exam = optionalExam.get();

        List<ExamQuestion> examQuestions = examQuestionRepository.findByExamIdOrderByOrderNo(examId);
        Map<String, List<String>> answerMap = new HashMap<>();
        if (submitDto.getAnswers() != null) {
            for (ExamSubmitAnswerDto a : submitDto.getAnswers()) {
                answerMap.put(a.getExamQuestionId(), a.getAnswers() == null ? Collections.emptyList() : a.getAnswers());
            }
        }

        int totalScore = 0;
        int correctCount = 0;
        String resultId = IdHelper.genUuid();
        ExamResult result = new ExamResult();
        result.setId(resultId);
        result.setExam(exam);
        result.setUserId(submitDto.getUserId());
        result.setSubmitTime(LocalDateTime.now());

        List<ExamResultAnswer> resultAnswers = new ArrayList<>();

        for (ExamQuestion eq : examQuestions) {
            Question q = eq.getQuestion();
            List<String> std = new ArrayList<>();
            if(StringUtils.hasText(q.getAnswer())) {
                std = Arrays.asList(q.getAnswer().split(","));
            }

            List<String> userAns = answerMap.getOrDefault(eq.getId(), Collections.emptyList());
            boolean correct = isCorrect(q.getType(), std, userAns);
            int gain = correct ? Optional.ofNullable(eq.getScore()).orElse(0) : 0;
            if (correct) {
                correctCount++;
                totalScore += gain;
            }

            ExamResultAnswer ra = new ExamResultAnswer();
            ra.setId(IdHelper.genUuid());
            ra.setExamResult(result);
            ra.setExamQuestion(eq);
            try {
                ra.setUserAnswer(objectMapper.writeValueAsString(userAns));
            } catch (Exception e) {
                ra.setUserAnswer("[]");
            }
            ra.setCorrect(correct);
            ra.setGainScore(gain);
            resultAnswers.add(ra);
        }

        result.setCorrectCount(correctCount);
        result.setTotalScore(totalScore);
        result.setAnswers(resultAnswers);

        examResultRepository.save(result);

        ExamResultDto dto = new ExamResultDto();
        dto.setResultId(result.getId());
        dto.setExamId(exam.getId());
        dto.setUserId(result.getUserId());
        dto.setTotalScore(result.getTotalScore());
        dto.setCorrectCount(result.getCorrectCount());
        dto.setSubmitTime(result.getSubmitTime());
        dto.setAnswers(resultAnswers.stream().map(ra -> {
            ExamResultAnswerDto ad = new ExamResultAnswerDto();
            ad.setExamQuestionId(ra.getExamQuestion().getId());
            ad.setCorrect(Boolean.TRUE.equals(ra.getCorrect()));
            ad.setGainScore(Optional.ofNullable(ra.getGainScore()).orElse(0));
            return ad;
        }).collect(Collectors.toList()));
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamResultHistoryItemDto> listUserResults(String userId, int pageNum, int pageSize) {
        if (!StringUtils.hasText(userId)) {
            return Page.empty();
        }

        // === 构造主查询SQL ===
        StringBuilder sb = new StringBuilder("""
        SELECT r.result_id,
               e.paper_id AS exam_id,
               e.name AS exam_name,
               e.total_score,
               r.correct_count AS correct_count,
               r.submit_time AS submit_time
          FROM exam_result r
          LEFT JOIN exam e ON r.paper_id = e.paper_id
         WHERE 1=1
    """);

        // === 构造总数SQL ===
        StringBuilder countSb = new StringBuilder("""
        SELECT COUNT(*)
          FROM exam_result r
          LEFT JOIN exam e ON r.paper_id = e.paper_id
         WHERE 1=1
    """);

        Map<String, Object> params = new HashMap<>();

        // === 按 userId 精确查询 ===
        if (StringUtils.hasText(userId)) {
            JdbcQueryHelper.equals("userId", userId, " AND r.user_id = :userId ", params, sb, countSb);
        }

        // === 排序（默认按提交时间倒序） ===
        sb.append(" ORDER BY r.submit_time DESC ");

        // === 构造分页SQL ===
        String listSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sb.toString(), pageNum, pageSize);

        // === 执行查询 ===
        List<ExamResultHistoryItemDto> results = jdbcTemplate.query(listSql, params, (rs, rowNum) -> {
            ExamResultHistoryItemDto dto = new ExamResultHistoryItemDto();
            dto.setResultId(rs.getString("result_id"));
            dto.setExamId(rs.getString("exam_id"));
            dto.setExamName(rs.getString("exam_name"));
            dto.setTotalScore(rs.getInt("total_score"));
            dto.setCorrectCount(rs.getInt("correct_count"));
            Timestamp ts = rs.getTimestamp("submit_time");
            if (ts != null) {
                dto.setSubmitTime(ts.toLocalDateTime());
            }
            return dto;
        });

        // === 返回分页对象 ===
        return JdbcQueryHelper.toPage(jdbcTemplate, countSb.toString(), params, results, pageNum, pageSize);
    }


    @Override
    @Transactional(readOnly = true)
    public ExamResultDetailDto getExamResultById(String resultId) {
        java.util.Optional<ExamResult> optional = examResultRepository.findById(resultId);
        if (optional.isEmpty()) {
            throw new RuntimeException("答卷结果不存在，ID: " + resultId);
        }
        ExamResult r = optional.get();
        ExamResultDetailDto dto = new ExamResultDetailDto();
        dto.setResultId(r.getId());
        dto.setExamId(r.getExam().getId());
        dto.setUserId(r.getUserId());
        dto.setTotalScore(r.getTotalScore());
        dto.setCorrectCount(r.getCorrectCount());
        dto.setSubmitTime(r.getSubmitTime());

        java.util.List<ExamResultDetailAnswerDto> answers = new java.util.ArrayList<>();
        for (ExamResultAnswer ra : r.getAnswers()) {
            ExamResultDetailAnswerDto ad = new ExamResultDetailAnswerDto();
            ad.setExamQuestionId(ra.getExamQuestion().getId());
            ad.setCorrect(Boolean.TRUE.equals(ra.getCorrect()));
            ad.setScore(java.util.Optional.ofNullable(ra.getGainScore()).orElse(0));
            try {
                java.util.List<String> userAns = objectMapper.readValue(
                        java.util.Optional.ofNullable(ra.getUserAnswer()).orElse("[]"),
                        objectMapper.getTypeFactory().constructCollectionType(java.util.List.class, String.class)
                );
                ad.setUserAnswers(userAns);
            } catch (Exception e) {
                ad.setUserAnswers(java.util.Collections.emptyList());
            }
            // 标准答案从题目中解析
            com.ck.quiz.question.entity.Question q = ra.getExamQuestion().getQuestion();
            java.util.List<String> std = new java.util.ArrayList<>();
            if (org.springframework.util.StringUtils.hasText(q.getAnswer())) {
                std = java.util.Arrays.asList(q.getAnswer().split(","));
            }
            ad.setStandardAnswers(std);
            answers.add(ad);
        }
        dto.setAnswers(answers);
        return dto;
    }

    // 新增：一键智能生成试卷
    @Override
    @Transactional
    public ExamDto autoGenerateExam(com.ck.quiz.exam.dto.ExamAutoGenerateDto autoGenerateDto) {
        Integer questionCount = autoGenerateDto.getQuestionCount();
        Integer totalScore = autoGenerateDto.getTotalScore();
        String subjectId = autoGenerateDto.getSubjectId();
        String categoryId = autoGenerateDto.getCategoryId();
        Integer durationMinutes = autoGenerateDto.getDurationMinutes();
        boolean publish = autoGenerateDto.getPublishImmediately() != null ? autoGenerateDto.getPublishImmediately() : true;

        if (questionCount == null || questionCount <= 0) {
            throw new RuntimeException("题目数量必须为正数");
        }
        if (totalScore == null || totalScore <= 0) {
            throw new RuntimeException("总分必须为正数");
        }
        if (!StringUtils.hasText(subjectId) || !StringUtils.hasText(categoryId)) {
            throw new RuntimeException("学科与类目不能为空");
        }
        if (durationMinutes != null && durationMinutes <= 0) {
            throw new RuntimeException("考试时长必须为正数");
        }

        // 查询满足条件的题目ID列表（通过知识点关联过滤学科和类目）
        String sql = """
                SELECT DISTINCT q.question_id AS id
                FROM question q
                LEFT JOIN question_knowledge_rela r ON q.question_id = r.question_id
                LEFT JOIN knowledge k ON k.knowledge_id = r.knowledge_id
                WHERE 1=1 AND k.subject_id = :subjectId AND k.category_id = :categoryId
                """;
        Map<String, Object> params = new HashMap<>();
        params.put("subjectId", subjectId);
        params.put("categoryId", categoryId);

        List<String> allIds = jdbcTemplate.query(sql, params, (rs, rowNum) -> rs.getString("id"));
        if (allIds.size() < questionCount) {
            throw new RuntimeException("可用题目数量不足：需要" + questionCount + "，实际" + allIds.size());
        }

        // 随机挑选指定数量的题目ID
        Collections.shuffle(allIds);
        List<String> selectedIds = allIds.subList(0, questionCount);

        // 计算每题分值，均分并把余数分配到前面的题目
        int baseScore = totalScore / questionCount;
        int remainder = totalScore % questionCount;

        List<ExamQuestionCreateDto> examQuestions = new ArrayList<>();
        int order = 1;
        for (int i = 0; i < selectedIds.size(); i++) {
            int score = baseScore + (i < remainder ? 1 : 0);
            examQuestions.add(new ExamQuestionCreateDto(selectedIds.get(i), order++, score));
        }

        // 生成试卷名称（可选）
        String name = autoGenerateDto.getName();
        if (!StringUtils.hasText(name)) {
            String timestamp = java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmm").format(LocalDateTime.now());
            name = "智能生成试卷-" + questionCount + "题-" + totalScore + "分-" + timestamp;
        }

        // 构造试卷创建DTO
        ExamCreateDto createDto = new ExamCreateDto();
        createDto.setName(name);
        createDto.setDescription(autoGenerateDto.getDescription());
        createDto.setTotalScore(totalScore);
        createDto.setDurationMinutes(durationMinutes); // 可为null
        createDto.setStatus(Exam.ExamPaperStatus.DRAFT);
        createDto.setQuestions(examQuestions);

        ExamDto created = createExam(createDto);

        // 可选：立即发布
        if (publish) {
            created = publishExam(created.getId());
        }

        return created;
    }
    private boolean isCorrect(Question.QuestionType type, List<String> std, List<String> user) {
        if (type == Question.QuestionType.SINGLE || type == Question.QuestionType.SHORT_ANSWER) {
            String s = std.isEmpty() ? "" : std.get(0);
            String u = user.isEmpty() ? "" : user.get(0);
            return s.trim().equalsIgnoreCase(u.trim());
        }
        if (type == Question.QuestionType.MULTIPLE) {
            Set<String> s1 = std.stream().map(v -> v.trim().toUpperCase()).collect(Collectors.toSet());
            Set<String> s2 = user.stream().map(v -> v.trim().toUpperCase()).collect(Collectors.toSet());
            return s1.equals(s2);
        }
        if (type == Question.QuestionType.BLANK) {
            if (std.size() != user.size()) return false;
            for (int i = 0; i < std.size(); i++) {
                if (!std.get(i).trim().equals(user.get(i).trim())) return false;
            }
            return true;
        }
        return false;
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