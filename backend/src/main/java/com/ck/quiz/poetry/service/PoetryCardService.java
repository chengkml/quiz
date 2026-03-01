package com.ck.quiz.poetry.service;

import com.ck.quiz.base.service.ReviewBaseService;
import com.ck.quiz.poetry.dto.PoetryCardCreateDto;
import com.ck.quiz.poetry.dto.PoetryCardDto;
import com.ck.quiz.poetry.dto.PoetryCardQueryDto;
import com.ck.quiz.poetry.dto.PoetryCardUpdateDto;
import com.ck.quiz.poetry.entity.PoetryCard;

/**
 * 诗词卡片服务接口
 */
public interface PoetryCardService extends
        ReviewBaseService<PoetryCardCreateDto, PoetryCardUpdateDto, PoetryCardQueryDto, PoetryCardDto, PoetryCard> {
}
