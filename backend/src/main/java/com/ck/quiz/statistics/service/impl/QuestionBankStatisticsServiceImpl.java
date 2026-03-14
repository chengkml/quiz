package com.ck.quiz.statistics.service.impl;

import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.statistics.dto.QuestionBankDashboardDto;
import com.ck.quiz.statistics.dto.StatisticsDto;
import com.ck.quiz.statistics.dto.StatisticsThemeDto;
import com.ck.quiz.statistics.service.QuestionBankStatisticsService;
import com.ck.quiz.statistics.service.StatisticsThemeService;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.repository.TodoRepository;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 题库统计主题服务实现
 */
@Service
public class QuestionBankStatisticsServiceImpl implements QuestionBankStatisticsService, StatisticsThemeService {

    public static final String THEME_KEY = "question-bank";

    private final TodoRepository todoRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;

    public QuestionBankStatisticsServiceImpl(TodoRepository todoRepository,
            SubjectRepository subjectRepository,
            QuestionRepository questionRepository,
            NamedParameterJdbcTemplate jdbcTemplate) {
        this.todoRepository = todoRepository;
        this.subjectRepository = subjectRepository;
        this.questionRepository = questionRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String getThemeKey() {
        return THEME_KEY;
    }

    @Override
    public StatisticsThemeDto getTheme() {
        return new StatisticsThemeDto(
                THEME_KEY,
                "题库统计",
                "题目规模、学科分布和新增趋势统计",
                "statistics-center/question-bank");
    }

    @Override
    public QuestionBankDashboardDto getDashboard() {
        return new QuestionBankDashboardDto(
                getOverview(),
                getQuestionCountByLastSevenDays(),
                getQuestionCountBySubject(),
                getQuestionCountByLastMonth());
    }

    @Override
    @Transactional(readOnly = true)
    public StatisticsDto getOverview() {
        String userId = getCurrentUserId();
        StatisticsDto statisticsDto = new StatisticsDto();

        // 待办数 = 待处理 + 进行中
        List<Todo.Status> activeStatuses = Arrays.asList(Todo.Status.SCHEDULED, Todo.Status.IN_PROGRESS);
        long todoCount = todoRepository.countByCreateUserAndStatusIn(userId, activeStatuses);
        statisticsDto.setTodoCount(todoCount);

        long subjectCount = subjectRepository.countByCreateUser(userId);
        statisticsDto.setSubjectCount(subjectCount);

        long questionCount = questionRepository.countByCreateUser(userId);
        statisticsDto.setQuestionCount(questionCount);

        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.atTime(LocalTime.MAX);
        long yesterdayQuestionCount = questionRepository.countByCreateUserAndCreateDateBetween(userId, startOfYesterday,
                endOfYesterday);
        statisticsDto.setYesterdayQuestionCount(yesterdayQuestionCount);

        return statisticsDto;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountByLastSevenDays() {
        List<LocalDateTime> dates = queryQuestionCreateDates(getCurrentUserId());

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAgo = today.minusDays(6);

        Map<String, Long> result = new LinkedHashMap<>();
        for (LocalDate date = sevenDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            result.put(date.toString(), 0L);
        }

        for (LocalDateTime dateTime : dates) {
            String dateStr = dateTime.toLocalDate().toString();
            if (result.containsKey(dateStr)) {
                result.put(dateStr, result.get(dateStr) + 1);
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountBySubject() {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", getCurrentUserId());

        String sql = """
                    SELECT DISTINCT q.question_id, s.name as subject_name
                    FROM question q
                    LEFT JOIN question_knowledge_rela r ON q.question_id = r.question_id
                    LEFT JOIN knowledge k ON r.knowledge_id = k.knowledge_id
                    LEFT JOIN category c ON k.category_id = c.id
                    LEFT JOIN subject s ON c.subject_id = s.id
                    WHERE q.create_user = :createUser
                """;

        List<Map<String, Object>> records = jdbcTemplate.queryForList(sql, params);

        Map<String, Long> countMap = new LinkedHashMap<>();
        Set<String> seenQuestions = new HashSet<>();

        for (Map<String, Object> record : records) {
            String subjectName = (String) record.get("subject_name");
            String questionId = (String) record.get("question_id");

            if (subjectName != null && questionId != null) {
                String key = subjectName + ":" + questionId;
                if (!seenQuestions.contains(key)) {
                    seenQuestions.add(key);
                    countMap.put(subjectName, countMap.getOrDefault(subjectName, 0L) + 1);
                }
            }
        }

        return countMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getQuestionCountByLastMonth() {
        List<LocalDateTime> dates = queryQuestionCreateDates(getCurrentUserId());

        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(29);

        Map<String, Long> result = new LinkedHashMap<>();
        for (LocalDate date = thirtyDaysAgo; !date.isAfter(today); date = date.plusDays(1)) {
            result.put(date.toString(), 0L);
        }

        for (LocalDateTime dateTime : dates) {
            String dateStr = dateTime.toLocalDate().toString();
            if (result.containsKey(dateStr)) {
                result.put(dateStr, result.get(dateStr) + 1);
            }
        }

        return result;
    }

    private List<LocalDateTime> queryQuestionCreateDates(String userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", userId);

        String sql = """
                    SELECT create_date
                    FROM question
                    WHERE create_user = :createUser
                    ORDER BY create_date ASC
                """;

        return jdbcTemplate.query(sql, params, (rs, rowNum) -> {
            java.sql.Timestamp timestamp = rs.getTimestamp("create_date");
            return timestamp != null ? timestamp.toLocalDateTime() : null;
        }).stream().filter(Objects::nonNull).toList();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
