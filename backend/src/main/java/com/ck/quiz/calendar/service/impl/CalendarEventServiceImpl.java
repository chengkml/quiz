package com.ck.quiz.calendar.service.impl;

import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import com.ck.quiz.calendar.repository.CalendarEventRepository;
import com.ck.quiz.calendar.service.CalendarEventService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 日程管理服务实现类
 */
@Service
public class CalendarEventServiceImpl implements CalendarEventService {

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public CalendarEventDto createEvent(CalendarEventCreateDto createDto) {
        validateTimeRange(createDto.getStartTime(), createDto.getEndTime());
        CalendarEvent event = new CalendarEvent();
        event.setId(IdHelper.genUuid());
        event.setTitle(createDto.getTitle());
        event.setDescription(createDto.getDescription());
        event.setLocation(createDto.getLocation());
        event.setStatus(createDto.getStatus() != null ? createDto.getStatus() : CalendarEvent.Status.SCHEDULED);
        event.setStartTime(createDto.getStartTime());
        event.setEndTime(createDto.getEndTime());
        event.setAllDay(createDto.getAllDay() != null ? createDto.getAllDay() : Boolean.FALSE);
        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public CalendarEventDto updateEvent(CalendarEventUpdateDto updateDto) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(updateDto.getId());
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + updateDto.getId());
        }
        CalendarEvent event = optionalEvent.get();

        if (StringUtils.hasText(updateDto.getTitle())) {
            event.setTitle(updateDto.getTitle());
        }
        if (updateDto.getDescription() != null) {
            event.setDescription(updateDto.getDescription());
        }
        if (updateDto.getLocation() != null) {
            event.setLocation(updateDto.getLocation());
        }
        if (updateDto.getStatus() != null) {
            event.setStatus(updateDto.getStatus());
        }
        if (updateDto.getStartTime() != null) {
            event.setStartTime(updateDto.getStartTime());
        }
        if (updateDto.getEndTime() != null) {
            event.setEndTime(updateDto.getEndTime());
        }
        if (updateDto.getAllDay() != null) {
            event.setAllDay(updateDto.getAllDay());
        }

        validateTimeRange(event.getStartTime(), event.getEndTime());

        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public CalendarEventDto deleteEvent(String eventId) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        CalendarEvent event = optionalEvent.get();
        calendarEventRepository.delete(event);
        return convertToDto(event);
    }

    @Override
    @Transactional(readOnly = true)
    public CalendarEventDto getEventById(String eventId) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        return convertToDto(optionalEvent.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalendarEventDto> searchEvents(CalendarEventQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT e.event_id AS id, e.title, e.description, e.location, e.status, e.start_time, e.end_time, e.all_day, " +
                        "e.create_date, e.create_user, e.update_date, e.update_user, u.user_name create_user_name " +
                        "FROM calendar_event e LEFT JOIN user u ON u.user_id = e.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM calendar_event e "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(e.title) LIKE :titleKey ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND e.status = :status ", params, sql, countSql);
        }

        if (queryDto.getStartTimeFrom() != null) {
            sql.append(" AND e.start_time >= :startTimeFrom ");
            countSql.append(" AND e.start_time >= :startTimeFrom ");
            params.put("startTimeFrom", queryDto.getStartTimeFrom());
        }

        if (queryDto.getStartTimeTo() != null) {
            sql.append(" AND e.start_time <= :startTimeTo ");
            countSql.append(" AND e.start_time <= :startTimeTo ");
            params.put("startTimeTo", queryDto.getStartTimeTo());
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND e.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<CalendarEventDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            CalendarEventDto dto = new CalendarEventDto();
            dto.setId(rs.getString("id"));
            dto.setTitle(rs.getString("title"));
            dto.setDescription(rs.getString("description"));
            dto.setLocation(rs.getString("location"));
            dto.setStatus(rs.getString("status") != null ? CalendarEvent.Status.valueOf(rs.getString("status")) : null);
            dto.setStartTime(rs.getTimestamp("start_time") != null ? rs.getTimestamp("start_time").toLocalDateTime() : null);
            dto.setEndTime(rs.getTimestamp("end_time") != null ? rs.getTimestamp("end_time").toLocalDateTime() : null);
            dto.setAllDay(rs.getObject("all_day") != null ? rs.getBoolean("all_day") : null);
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public CalendarEventDto convertToDto(CalendarEvent calendarEvent) {
        CalendarEventDto dto = new CalendarEventDto();
        BeanUtils.copyProperties(calendarEvent, dto);
        return dto;
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new RuntimeException("结束时间不能早于开始时间");
        }
    }
}
