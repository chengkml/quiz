package com.ck.quiz.diary.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.diary.entity.Diary;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class DiaryQueryDto extends QueryDto {

    private String title;

    private Diary.Mood mood;

    private LocalDate diaryDateStart;

    private LocalDate diaryDateEnd;

    private Boolean archived;
}
