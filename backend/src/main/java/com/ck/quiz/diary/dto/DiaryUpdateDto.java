package com.ck.quiz.diary.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.diary.entity.Diary;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
public class DiaryUpdateDto extends UpdateDto {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "正文不能为空")
    private String content;

    private LocalDate diaryDate;

    private Diary.Mood mood;

    private String weather;

    private Boolean archived;
}
