package com.ck.quiz.wrongquestion.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.question.entity.Question;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class WrongQuestionCreateDto extends CreateDto {

    @NotBlank(message = "学科不能为空")
    private String subjectId;

    private String categoryId;

    @NotNull(message = "题型不能为空")
    private Question.QuestionType type;

    @NotBlank(message = "题目内容不能为空")
    private String content;

    private String answer;

    private String difficulty;

    private String remark;

    private String originalImageFileId;

    private String originalImageName;

    private String ocrText;
}
