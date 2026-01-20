package com.ck.quiz.config.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.config.dto.SystemParamCreateDto;
import com.ck.quiz.config.dto.SystemParamDto;
import com.ck.quiz.config.dto.SystemParamQueryDto;
import com.ck.quiz.config.dto.SystemParamUpdateDto;
import com.ck.quiz.config.entity.SystemParam;

import java.util.List;

public interface SystemParamService extends BaseService<SystemParamCreateDto, SystemParamUpdateDto, SystemParamQueryDto, SystemParamDto, SystemParam> {

    SystemParamDto getParamByName(String paramName);

    List<SystemParamDto> getParamsByCategory(String category);

}
