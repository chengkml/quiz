package com.ck.quiz.tag.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.tag.entity.Tag;

import java.util.List;

public interface TagRepository extends BaseRepository<Tag> {

    List<Tag> findByCreateUser(String userId);

    Tag findByCreateUserAndName(String userId, String tagName);

    Tag findByCreateUserAndNameAndType(String userId, String tagName, String type);

}
