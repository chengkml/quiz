package com.ck.quiz.cron.service;

import com.ck.quiz.calendar.entity.CalendarEvent;
import com.ck.quiz.calendar.repository.CalendarEventRepository;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TodoScheduleExpireService {

    private static final String SYSTEM_USER = "system";

    private static final List<Todo.Status> TODO_ACTIVE_STATUSES = List.of(
            Todo.Status.SCHEDULED,
            Todo.Status.IN_PROGRESS
    );

    private static final List<CalendarEvent.Status> SCHEDULE_ACTIVE_STATUSES = List.of(
            CalendarEvent.Status.SCHEDULED,
            CalendarEvent.Status.IN_PROGRESS
    );

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    public ExpireScanResult scanAndExpire() {
        return scanAndExpire(LocalDateTime.now());
    }

    public ExpireScanResult scanAndExpire(LocalDateTime scanTime) {
        List<Todo> expiredTodos = todoRepository.findByExpireTimeLessThanEqualAndStatusIn(scanTime, TODO_ACTIVE_STATUSES);
        List<CalendarEvent> expiredSchedules = calendarEventRepository.findByExpireTimeLessThanEqualAndStatusIn(
                scanTime,
                SCHEDULE_ACTIVE_STATUSES
        );

        Set<String> processedTodoIds = new HashSet<>();
        Set<String> processedScheduleIds = new HashSet<>();

        int expiredTodoCount = 0;
        int expiredScheduleCount = 0;

        for (Todo todo : expiredTodos) {
            if (!processedTodoIds.add(todo.getId())) {
                continue;
            }
            if (expireTodo(todo, scanTime)) {
                expiredTodoCount++;
            }
            if (StringUtils.hasText(todo.getCalendarEventId())) {
                CalendarEvent linkedEvent = calendarEventRepository.findById(todo.getCalendarEventId()).orElse(null);
                if (linkedEvent != null) {
                    processedScheduleIds.add(linkedEvent.getId());
                    if (expireSchedule(linkedEvent, scanTime)) {
                        expiredScheduleCount++;
                    }
                }
            }
        }

        for (CalendarEvent schedule : expiredSchedules) {
            if (!processedScheduleIds.add(schedule.getId())) {
                continue;
            }
            if (expireSchedule(schedule, scanTime)) {
                expiredScheduleCount++;
            }
            if (StringUtils.hasText(schedule.getTodoId())) {
                Todo linkedTodo = todoRepository.findById(schedule.getTodoId()).orElse(null);
                if (linkedTodo != null) {
                    processedTodoIds.add(linkedTodo.getId());
                    if (expireTodo(linkedTodo, scanTime)) {
                        expiredTodoCount++;
                    }
                }
            }
        }

        return new ExpireScanResult(expiredTodoCount, expiredScheduleCount);
    }

    private boolean expireTodo(Todo todo, LocalDateTime scanTime) {
        if (!TODO_ACTIVE_STATUSES.contains(todo.getStatus())) {
            return false;
        }
        todo.setStatus(Todo.Status.EXPIRED);
        todo.setUpdateDate(scanTime);
        todo.setUpdateUser(SYSTEM_USER);
        todoRepository.save(todo);
        return true;
    }

    private boolean expireSchedule(CalendarEvent schedule, LocalDateTime scanTime) {
        if (!SCHEDULE_ACTIVE_STATUSES.contains(schedule.getStatus())) {
            return false;
        }
        schedule.setStatus(CalendarEvent.Status.EXPIRED);
        schedule.setUpdateDate(scanTime);
        schedule.setUpdateUser(SYSTEM_USER);
        calendarEventRepository.save(schedule);
        return true;
    }

    public record ExpireScanResult(int expiredTodoCount, int expiredScheduleCount) {

        public int totalExpiredCount() {
            return expiredTodoCount + expiredScheduleCount;
        }
    }
}
