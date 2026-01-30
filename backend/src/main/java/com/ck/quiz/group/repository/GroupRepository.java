package com.ck.quiz.group.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.group.entity.Group;
import java.util.List;

public interface GroupRepository extends BaseRepository<Group> {

    Group findByCreateUserAndNameAndType(String createUser, String name, String type);

    List<Group> findByCreateUserAndName(String createUser, String name);
}