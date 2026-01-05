package com.ck.quiz.base.service;

import java.util.List;
import org.springframework.data.domain.Page;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.base.entity.Model;

public interface BaseService<C extends CreateDto, U extends UpdateDto, Q extends QueryDto, D extends Dto, M extends Model> {

    D create(C createDto);

    D update(String userId, U updateDto);

    void delete(String userId, String id);

    D get(String userId, String id);

    Page<D> search(String userId, Q queryDto);

    List<D> list(String userId);

    D convertToDto(M model, Boolean loadProps);

    List<D> convertToDtos(List<M> models);
}
