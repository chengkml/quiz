package com.ck.quiz.calendar.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.calendar.entity.CalendarEvent;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CalendarEventRepository extends BaseRepository<CalendarEvent> {

    List<CalendarEvent> findByExpireTimeLessThanEqualAndStatusIn(LocalDateTime expireTime, List<CalendarEvent.Status> statuses);
}
