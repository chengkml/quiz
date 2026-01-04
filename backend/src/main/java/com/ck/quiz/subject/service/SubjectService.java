package com.ck.quiz.subject.service;

import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;
import org.springframework.data.domain.Page;

import java.util.List;

public interface SubjectService {

    boolean checkNameUniq(String userId, String name, String excludeId);

    SubjectDto create(SubjectCreateDto createDto);

    SubjectDto update(String userId, SubjectUpdateDto updateDto);

    void delete(String userId, String subjectId);

    SubjectDto get(String userId, String subjectId);

    Page<SubjectDto> search(String userId, SubjectQueryDto queryDto);

    List<SubjectDto> list(String userId);

    SubjectDto convertToDto(Subject subject, Boolean loadProps);

    List<SubjectDto> convertToDtos(List<Subject> subjects);
}