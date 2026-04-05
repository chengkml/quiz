package com.ck.quiz.wrongquestion.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.question.entity.Question;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class WrongQuestionDto extends Dto {

    private String subjectId;

    private String subjectName;

    private String categoryId;

    private String categoryName;

    private Question.QuestionType type;

    private String content;

    private String answer;

    private String difficulty;

    private String remark;

    private String originalImageFileId;

    private String originalImageName;

    private String originalImageUrl;

    private String ocrText;
}
