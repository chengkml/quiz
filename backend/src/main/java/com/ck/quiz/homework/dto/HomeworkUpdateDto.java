package com.ck.quiz.homework.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.homework.entity.Homework;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class HomeworkUpdateDto extends UpdateDto {
    private String title;
    private String content;
    private Homework.Status status;
}
