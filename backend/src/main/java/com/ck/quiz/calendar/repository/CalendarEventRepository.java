package com.ck.quiz.calendar.repository;

import com.ck.quiz.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 日程数据访问接口
 */
@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, String> {
}
