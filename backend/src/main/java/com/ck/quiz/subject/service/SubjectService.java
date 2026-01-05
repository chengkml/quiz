package com.ck.quiz.subject.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.subject.dto.SubjectCreateDto;
import com.ck.quiz.subject.dto.SubjectDto;
import com.ck.quiz.subject.dto.SubjectQueryDto;
import com.ck.quiz.subject.dto.SubjectUpdateDto;
import com.ck.quiz.subject.entity.Subject;

public interface SubjectService extends BaseService<SubjectCreateDto, SubjectUpdateDto, SubjectQueryDto, SubjectDto, Subject> {

    boolean checkNameUniq(String userId, String name, String excludeId);

}