package com.ck.quiz.group.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.group.entity.Group;

public interface GroupRepository extends BaseRepository<Group> {

    Group findByCreateUserAndName(String createUser, String name);
}