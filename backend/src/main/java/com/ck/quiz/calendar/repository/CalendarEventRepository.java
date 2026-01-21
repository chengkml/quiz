package com.ck.quiz.calendar.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.calendar.entity.CalendarEvent;
import org.springframework.stereotype.Repository;

@Repository
public interface CalendarEventRepository extends BaseRepository<CalendarEvent> {
}
