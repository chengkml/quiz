package com.ck.quiz.wrongquestion.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.question.entity.Question;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class WrongQuestionQueryDto extends QueryDto {

    private String subjectId;

    private String categoryId;

    private Question.QuestionType type;

    private String difficulty;

    private String content;
}
