package com.ck.quiz.diary.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.diary.entity.Diary;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class DiaryDto extends Dto {

    private String title;

    private String content;

    private LocalDate diaryDate;

    private Diary.Mood mood;

    private String weather;

    private Boolean archived;
}
