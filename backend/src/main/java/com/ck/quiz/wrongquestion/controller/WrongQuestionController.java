package com.ck.quiz.wrongquestion.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.wrongquestion.dto.WrongQuestionCreateDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionQueryDto;
import com.ck.quiz.wrongquestion.dto.WrongQuestionUpdateDto;
import com.ck.quiz.wrongquestion.service.WrongQuestionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "错题本管理", description = "错题本相关接口")
@RestController
@RequestMapping("/api/wrong-question")
@RequiredArgsConstructor
public class WrongQuestionController extends BaseController<WrongQuestionCreateDto, WrongQuestionUpdateDto, WrongQuestionQueryDto, WrongQuestionDto> {

    private final WrongQuestionService wrongQuestionService;

    @Override
    protected BaseService<WrongQuestionCreateDto, WrongQuestionUpdateDto, WrongQuestionQueryDto, WrongQuestionDto, ?> getService() {
        return wrongQuestionService;
    }
}
