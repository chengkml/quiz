package com.ck.quiz.diary.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.diary.dto.DiaryCreateDto;
import com.ck.quiz.diary.dto.DiaryDto;
import com.ck.quiz.diary.dto.DiaryQueryDto;
import com.ck.quiz.diary.dto.DiaryUpdateDto;
import com.ck.quiz.diary.entity.Diary;
import com.ck.quiz.diary.repository.DiaryRepository;
import com.ck.quiz.diary.service.DiaryService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class DiaryServiceImpl
        extends BaseServiceImpl<DiaryCreateDto, DiaryUpdateDto, DiaryQueryDto, DiaryDto, Diary, DiaryRepository>
        implements DiaryService {

    @Override
    public DiaryDto create(DiaryCreateDto createDto) {
        if (createDto.getDiaryDate() == null) {
            createDto.setDiaryDate(java.time.LocalDate.now());
        }
        if (createDto.getMood() == null) {
            createDto.setMood(Diary.Mood.CALM);
        }
        if (createDto.getArchived() == null) {
            createDto.setArchived(Boolean.FALSE);
        }
        return super.create(createDto);
    }

    @Override
    public Page<DiaryDto> search(String userId, DiaryQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("SELECT d.* FROM diary d WHERE 1=1 ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(1) FROM diary d WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.equals("createUser", userId, " AND d.create_user = :createUser ", params, sql, countSql);
        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(d.title) LIKE :titleKey ", params,
                namedParameterJdbcTemplate, sql, countSql);

        if (queryDto.getMood() != null) {
            JdbcQueryHelper.equals("mood", queryDto.getMood().name(), " AND d.mood = :mood ", params, sql, countSql);
        }

        if (queryDto.getArchived() != null) {
            params.put("archived", queryDto.getArchived());
            sql.append(" AND d.archived = :archived ");
            countSql.append(" AND d.archived = :archived ");
        }

        if (queryDto.getDiaryDateStart() != null) {
            params.put("diaryDateStart", Date.valueOf(queryDto.getDiaryDateStart()));
            sql.append(" AND d.diary_date >= :diaryDateStart ");
            countSql.append(" AND d.diary_date >= :diaryDateStart ");
        }

        if (queryDto.getDiaryDateEnd() != null) {
            params.put("diaryDateEnd", Date.valueOf(queryDto.getDiaryDateEnd()));
            sql.append(" AND d.diary_date <= :diaryDateEnd ");
            countSql.append(" AND d.diary_date <= :diaryDateEnd ");
        }

        sql.append(" ORDER BY d.diary_date DESC, d.create_date DESC ");

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<DiaryDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            Diary diary = new Diary();
            diary.setId(rs.getString("id"));
            diary.setTitle(rs.getString("title"));
            diary.setContent(rs.getString("content"));
            diary.setDiaryDate(rs.getDate("diary_date") != null ? rs.getDate("diary_date").toLocalDate() : null);
            diary.setMood(rs.getString("mood") != null ? Diary.Mood.valueOf(rs.getString("mood")) : null);
            diary.setWeather(rs.getString("weather"));
            Object archivedObj = rs.getObject("archived");
            diary.setArchived(archivedObj != null ? rs.getBoolean("archived") : Boolean.FALSE);
            diary.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            diary.setCreateUser(rs.getString("create_user"));
            diary.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            diary.setUpdateUser(rs.getString("update_user"));
            return convertToDto(diary, true);
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public DiaryDto archive(String userId, String id, Boolean archived) {
        Optional<Diary> optionalDiary = repository.findById(id);
        if (optionalDiary.isEmpty()) {
            throw new IllegalArgumentException("日记不存在: " + id);
        }

        Diary diary = optionalDiary.get();
        if (diary.getCreateUser() != null && !diary.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("无权限归档该日记: " + id);
        }

        diary.setArchived(Boolean.TRUE.equals(archived));
        Diary saved = repository.save(diary);
        return convertToDto(saved, true);
    }

    @Override
    protected DiaryDto newDto() {
        return new DiaryDto();
    }

    @Override
    protected Diary newModel() {
        return new Diary();
    }
}
