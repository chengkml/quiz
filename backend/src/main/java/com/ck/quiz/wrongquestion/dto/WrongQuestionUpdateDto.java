package com.ck.quiz.wrongquestion.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.question.entity.Question;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class WrongQuestionUpdateDto extends UpdateDto {

    @NotBlank(message = "学科不能为空")
    private String subjectId;

    private String categoryId;

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
