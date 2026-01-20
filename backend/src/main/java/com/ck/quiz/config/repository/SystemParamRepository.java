package com.ck.quiz.config.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.config.entity.SystemParam;

import java.util.List;
import java.util.Optional;

public interface SystemParamRepository extends BaseRepository<SystemParam> {

    SystemParam findByParamNameAndStatus(String paramName, SystemParam.ParamStatus status);

    List<SystemParam> findByCategoryAndStatus(String category, SystemParam.ParamStatus status);

    Optional<SystemParam> findByParamName(String paramName);

}
