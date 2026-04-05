package com.ck.quiz.wrongquestion.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.wrongquestion.dto.WrongQuestionCreateDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionQueryDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionUpdateDto;
import com.ck.quiz.wrongquestion.entity.WrongQuestion;

public interface WrongQuestionService extends BaseService<WrongQuestionCreateDto, WrongQuestionUpdateDto, WrongQuestionQueryDto, WrongQuestionDto, WrongQuestion> {
}
