package com.ck.quiz.homework.dto;

import com.ck.quiz.base.dto.QueryDto;

import lombok.Data;

import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class HomeworkQueryDto extends QueryDto {
    private String title;
}
