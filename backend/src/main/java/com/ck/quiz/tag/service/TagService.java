package com.ck.quiz.tag.service;

import com.ck.quiz.tag.dto.TagUpdateDto;
import com.ck.quiz.tag.entity.Tag;
import com.ck.quiz.tag.dto.TagCreateDto;
import com.ck.quiz.tag.dto.TagDto;
import com.ck.quiz.tag.dto.TagQueryDto;
import org.springframework.data.domain.Page;
import java.util.List;

public interface TagService {

    List<TagDto> list(String userId);

    Page<TagDto> search(String userId, TagQueryDto queryDto);

    boolean checkNameUniq(String userId, String tagName, String excludeTagId);

    TagDto get(String userId, String tagId);

    TagDto create(TagCreateDto tagCreateDto);

    TagDto update(String userId, TagUpdateDto tagUpdateDto);

    void delete(String userId, String tagId);

    List<TagDto> convertToDtos(List<Tag> tags);

    TagDto convertToDto(Tag tag, Boolean loadProps);
}
