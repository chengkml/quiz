package com.ck.quiz.diary.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.diary.dto.DiaryCreateDto;
import com.ck.quiz.diary.dto.DiaryDto;
import com.ck.quiz.diary.dto.DiaryQueryDto;
import com.ck.quiz.diary.dto.DiaryUpdateDto;
import com.ck.quiz.diary.entity.Diary;

public interface DiaryService extends BaseService<DiaryCreateDto, DiaryUpdateDto, DiaryQueryDto, DiaryDto, Diary> {

    DiaryDto archive(String userId, String id, Boolean archived);
}
