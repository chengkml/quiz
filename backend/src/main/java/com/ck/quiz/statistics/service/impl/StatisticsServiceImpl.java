package com.ck.quiz.statistics.service.impl;

import com.ck.quiz.question.entity.Question;
import com.ck.quiz.question.repository.QuestionRepository;
import com.ck.quiz.statistics.dto.StatisticsDto;
import com.ck.quiz.statistics.service.StatisticsService;
import com.ck.quiz.subject.repository.SubjectRepository;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

/**
 * 统计服务实现类
 */
@Service
public class StatisticsServiceImpl implements StatisticsService {

    private final TodoRepository todoRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;

    @Autowired
    public StatisticsServiceImpl(TodoRepository todoRepository,
                                SubjectRepository subjectRepository,
                                QuestionRepository questionRepository) {
        this.todoRepository = todoRepository;
        this.subjectRepository = subjectRepository;
        this.questionRepository = questionRepository;
    }

    @Override
    public StatisticsDto getStatistics() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        StatisticsDto statisticsDto = new StatisticsDto();
        
        // 统计待办数（待处理和进行中的待办总数）
        List<Todo.Status> activeStatuses = Arrays.asList(Todo.Status.PENDING, Todo.Status.IN_PROGRESS);
        long todoCount = todoRepository.countByCreateUserAndStatusIn(userId, activeStatuses);
        statisticsDto.setTodoCount(todoCount);
        
        // 统计学科数
        long subjectCount = subjectRepository.countByCreateUser(userId);
        statisticsDto.setSubjectCount(subjectCount);
        
        // 统计题目数
        long questionCount = questionRepository.countByCreateUser(userId);
        statisticsDto.setQuestionCount(questionCount);
        
        // 统计昨日题目增加量
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDateTime startOfYesterday = yesterday.atStartOfDay();
        LocalDateTime endOfYesterday = yesterday.atTime(LocalTime.MAX);
        long yesterdayQuestionCount = questionRepository.countByCreateUserAndCreateDateBetween(userId, startOfYesterday, endOfYesterday);
        statisticsDto.setYesterdayQuestionCount(yesterdayQuestionCount);
        
        return statisticsDto;
    }
}