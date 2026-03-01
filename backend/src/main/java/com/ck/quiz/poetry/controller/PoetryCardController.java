package com.ck.quiz.poetry.controller;

import com.ck.quiz.base.controller.ReviewBaseController;
import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.poetry.dto.PoetryCardCreateDto;
import com.ck.quiz.poetry.dto.PoetryCardDto;
import com.ck.quiz.poetry.dto.PoetryCardQueryDto;
import com.ck.quiz.poetry.dto.PoetryCardUpdateDto;
import com.ck.quiz.poetry.service.PoetryCardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 诗词卡片控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/poetry")
@Tag(name = "诗词管理", description = "诗词卡片管理 API")
public class PoetryCardController
        extends ReviewBaseController<PoetryCardCreateDto, PoetryCardUpdateDto, PoetryCardQueryDto, PoetryCardDto> {

    @Autowired
    private PoetryCardService poetryCardService;

    @Override
    protected ReviewBaseService<PoetryCardCreateDto, PoetryCardUpdateDto, PoetryCardQueryDto, PoetryCardDto, ?> getService() {
        return poetryCardService;
    }
}
