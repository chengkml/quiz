package com.ck.quiz.tag.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.entity.Tag;

public interface TagService extends BaseService<TagCreateDto, TagUpdateDto, TagQueryDto, TagDto, Tag> {

    boolean checkNameUniq(String userId, String name, String type, String excludeId);

}
